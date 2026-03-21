/**
 * Variance Service (PRT-42 / PRT-68).
 * Computes planned vs actual variance per cost category per month.
 */
import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, type AuthUser } from '../../shared/dataScope.js';
import type {
  VarianceResponse,
  CategoryVariance,
  VarianceCell,
  RagLevel,
  TrendDirection,
  VarianceSummary,
} from './types.js';

const ZERO = new Decimal(0);

const CATEGORY_LABELS: Record<string, string> = {
  EMPLOYEE_SALARY: 'Salaries & Payroll',
  SUBSCRIPTIONS: 'Software Licenses',
  TRAVEL: 'Travel & Lodging',
  ACCOMMODATION: 'Accommodation',
  FOOD_ALLOWANCE: 'Food Allowance',
  GIFTS: 'Gifts',
  INFRASTRUCTURE: 'Hardware/Infrastructure',
  CONTRACTOR: 'Subcontractors',
};

function getRag(variancePercent: Decimal): RagLevel {
  const abs = variancePercent.abs();
  if (abs.lte(5)) return 'GREEN';
  if (abs.lte(15)) return 'AMBER';
  return 'RED';
}

function computeVarianceCell(planned: Decimal, actual: Decimal): VarianceCell {
  const variance = actual.minus(planned);
  const variancePercent = planned.isZero()
    ? ZERO
    : variance.div(planned).times(100);

  return {
    planned: planned.toFixed(2),
    actual: actual.toFixed(2),
    variance: variance.toFixed(2),
    variancePercent: variancePercent.toFixed(2),
    rag: getRag(variancePercent),
  };
}

function getTrend(months: Record<string, VarianceCell>, sortedPeriods: string[]): TrendDirection {
  if (sortedPeriods.length < 2) return 'STABLE';

  const lastPeriod = sortedPeriods[sortedPeriods.length - 1]!;
  const prevPeriod = sortedPeriods[sortedPeriods.length - 2]!;

  const lastCell = months[lastPeriod];
  const prevCell = months[prevPeriod];
  if (!lastCell || !prevCell) return 'STABLE';

  const lastAbs = new Decimal(lastCell.variancePercent).abs();
  const prevAbs = new Decimal(prevCell.variancePercent).abs();
  const diff = lastAbs.minus(prevAbs);

  if (diff.gt(1)) return 'WORSENING';
  if (diff.lt(-1)) return 'IMPROVING';
  return 'STABLE';
}

export async function getVariance(
  projectId: number,
  user: AuthUser,
  startPeriod?: string,
  endPeriod?: string,
): Promise<{ data: VarianceResponse }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });

  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project))
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');

  // Get cost categories for this project
  const costCategories = await prisma.costCategory.findMany({
    where: { projectId },
    include: {
      plannedAmounts: { orderBy: { period: 'asc' } },
      costEntries: { orderBy: { period: 'asc' } },
    },
  });

  // Collect all periods
  const allPeriods = new Set<string>();
  for (const cat of costCategories) {
    for (const pa of cat.plannedAmounts) allPeriods.add(pa.period);
    for (const ce of cat.costEntries) allPeriods.add(ce.period);
  }

  let sortedPeriods = Array.from(allPeriods).sort();
  if (startPeriod) sortedPeriods = sortedPeriods.filter((p) => p >= startPeriod);
  if (endPeriod) sortedPeriods = sortedPeriods.filter((p) => p <= endPeriod);

  // Build category variance data
  const categories: CategoryVariance[] = [];
  const periodTotals: Record<string, { planned: Decimal; actual: Decimal }> = {};

  for (const period of sortedPeriods) {
    periodTotals[period] = { planned: ZERO, actual: ZERO };
  }

  let overallPlanned = ZERO;
  let overallActual = ZERO;

  for (const cat of costCategories) {
    const plannedByPeriod = new Map<string, Decimal>();
    for (const pa of cat.plannedAmounts) {
      plannedByPeriod.set(pa.period, new Decimal(pa.amount.toString()));
    }

    const actualByPeriod = new Map<string, Decimal>();
    for (const ce of cat.costEntries) {
      actualByPeriod.set(ce.period, new Decimal(ce.actualAmount.toString()));
    }

    const months: Record<string, VarianceCell> = {};
    for (const period of sortedPeriods) {
      const planned = plannedByPeriod.get(period) ?? ZERO;
      const actual = actualByPeriod.get(period) ?? ZERO;
      months[period] = computeVarianceCell(planned, actual);

      const totals = periodTotals[period]!;
      totals.planned = totals.planned.plus(planned);
      totals.actual = totals.actual.plus(actual);

      overallPlanned = overallPlanned.plus(planned);
      overallActual = overallActual.plus(actual);
    }

    categories.push({
      categoryType: cat.categoryType,
      categoryLabel: CATEGORY_LABELS[cat.categoryType] ?? cat.categoryType,
      months,
      trend: getTrend(months, sortedPeriods),
    });
  }

  // Compute totals row
  const totals: Record<string, VarianceCell> = {};
  for (const period of sortedPeriods) {
    const t = periodTotals[period]!;
    totals[period] = computeVarianceCell(t.planned, t.actual);
  }

  // Summary
  const overallVariance = overallActual.minus(overallPlanned);
  const overallVariancePercent = overallPlanned.isZero()
    ? ZERO
    : overallVariance.div(overallPlanned).times(100);

  const categoriesOverBudget = categories.filter((c) => {
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    if (!lastPeriod) return false;
    const cell = c.months[lastPeriod];
    return cell && new Decimal(cell.variance).gt(0);
  }).length;

  // Find best performing (lowest absolute variance %)
  let bestPerforming: string | null = null;
  let lowestVariance = new Decimal(Infinity);
  for (const c of categories) {
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    if (!lastPeriod) continue;
    const cell = c.months[lastPeriod];
    if (!cell) continue;
    const absVar = new Decimal(cell.variancePercent).abs();
    if (absVar.lt(lowestVariance)) {
      lowestVariance = absVar;
      bestPerforming = c.categoryLabel;
    }
  }

  const summary: VarianceSummary = {
    overallVariance: overallVariance.toFixed(2),
    overallVariancePercent: overallVariancePercent.toFixed(2),
    overallRag: getRag(overallVariancePercent),
    categoriesOverBudget,
    totalCategories: categories.length,
    bestPerforming,
  };

  return {
    data: {
      projectId,
      periods: sortedPeriods,
      categories,
      totals,
      totalTrend: getTrend(totals, sortedPeriods),
      summary,
    },
  };
}
