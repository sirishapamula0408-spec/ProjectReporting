/**
 * Burn vs Revenue Service (PRT-39 / PRT-64).
 * Computes cumulative spend vs revenue timeline from cost entries and payment milestones.
 */
import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, type AuthUser } from '../../shared/dataScope.js';
import type { BurnRevenueResponse, TimelineEntry } from './types.js';

const ZERO = new Decimal(0);

export async function getBurnRevenue(
  projectId: number,
  user: AuthUser,
  fromMonth?: string,
  toMonth?: string,
): Promise<{ data: BurnRevenueResponse }> {
  // Fetch project with access check
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!canAccessProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  // Get monthly spend totals grouped by period
  const monthlyCosts = await prisma.costEntry.groupBy({
    by: ['period'],
    where: { projectId },
    _sum: { actualAmount: true },
    orderBy: { period: 'asc' },
  });

  // Get payment milestones
  const milestones = await prisma.paymentMilestone.findMany({
    where: { projectId },
    select: { amount: true, dueDate: true, isPaid: true, paidDate: true },
    orderBy: { dueDate: 'asc' },
  });

  // Build milestone lookup by month (using paid date if paid, due date otherwise)
  const milestoneByMonth = new Map<string, Decimal>();
  for (const m of milestones) {
    const date = m.isPaid && m.paidDate ? m.paidDate : m.dueDate;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = milestoneByMonth.get(month) ?? ZERO;
    milestoneByMonth.set(month, existing.plus(m.amount));
  }

  // Collect all unique months from both costs and milestones
  const allMonths = new Set<string>();
  for (const c of monthlyCosts) allMonths.add(c.period);
  for (const month of milestoneByMonth.keys()) allMonths.add(month);

  const sortedMonths = Array.from(allMonths).sort();

  // Apply optional date range filter
  const filteredMonths = sortedMonths.filter((m) => {
    if (fromMonth && m < fromMonth) return false;
    if (toMonth && m > toMonth) return false;
    return true;
  });

  // Build spend lookup
  const spendByMonth = new Map<string, Decimal>();
  for (const c of monthlyCosts) {
    spendByMonth.set(c.period, c._sum.actualAmount ?? ZERO);
  }

  // Build timeline with cumulative values
  // Cumulative values always start from beginning of project regardless of filter
  let cumulativeSpend = ZERO;
  let cumulativeRevenue = ZERO;
  const allEntries: TimelineEntry[] = [];

  for (const month of sortedMonths) {
    const monthlySpend = spendByMonth.get(month) ?? ZERO;
    const paymentAmount = milestoneByMonth.get(month) ?? ZERO;

    cumulativeSpend = cumulativeSpend.plus(monthlySpend);
    cumulativeRevenue = cumulativeRevenue.plus(paymentAmount);

    const gap = cumulativeRevenue.minus(cumulativeSpend);

    allEntries.push({
      month,
      monthlySpend: monthlySpend.toFixed(2),
      cumulativeSpend: cumulativeSpend.toFixed(2),
      paymentAmount: paymentAmount.toFixed(2),
      cumulativeRevenue: cumulativeRevenue.toFixed(2),
      gap: gap.toFixed(2),
      status: gap.gte(0) ? 'SURPLUS' : 'DEFICIT',
    });
  }

  // Filter for response but keep cumulative calculations correct
  const timeline = allEntries.filter((e) => {
    if (fromMonth && e.month < fromMonth) return false;
    if (toMonth && e.month > toMonth) return false;
    return true;
  });

  const currentGap = cumulativeRevenue.minus(cumulativeSpend);

  return {
    data: {
      projectId,
      timeline,
      summary: {
        totalSpend: cumulativeSpend.toFixed(2),
        totalRevenue: cumulativeRevenue.toFixed(2),
        currentGap: currentGap.toFixed(2),
        status: currentGap.gte(0) ? 'SURPLUS' : 'DEFICIT',
      },
    },
  };
}
