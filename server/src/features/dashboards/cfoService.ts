/**
 * CFO Dashboard Service (PRT-43).
 * Composes portfolio-wide executive metrics from multiple data sources.
 * All 4 datasets fetched in parallel for performance.
 */
import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import type {
  CFODashboardResponse,
  BurnRateData,
  MarginHealthProject,
  RevenueVsCostEntry,
  ForecastProject,
  PortfolioAggregates,
} from './types.js';

const ZERO = new Decimal(0);

function getMarginRag(marginPercent: Decimal): 'GREEN' | 'AMBER' | 'RED' {
  if (marginPercent.gte(20)) return 'GREEN';
  if (marginPercent.gte(0)) return 'AMBER';
  return 'RED';
}

/**
 * Fetch monthly burn rate totals across all projects (last 6 months).
 */
async function fetchBurnRate(): Promise<BurnRateData> {
  const monthlyCosts = await prisma.costEntry.groupBy({
    by: ['period'],
    _sum: { actualAmount: true },
    orderBy: { period: 'asc' },
  });

  // Take last 6 months
  const recent = monthlyCosts.slice(-6);
  const trend = recent.map((row) => ({
    month: row.period,
    total: (row._sum.actualAmount ?? ZERO).toString(),
  }));

  const lastEntry = recent[recent.length - 1];
  const currentMonthTotal = lastEntry
    ? (lastEntry._sum.actualAmount ?? ZERO).toString()
    : '0.00';

  return { currentMonthTotal, trend };
}

/**
 * Fetch margin health per project.
 */
async function fetchMarginHealth(): Promise<MarginHealthProject[]> {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: {
      id: true,
      name: true,
      contractValue: true,
      costEntries: {
        select: { actualAmount: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result: MarginHealthProject[] = [];

  for (const p of projects) {
    const contractValue = new Decimal(p.contractValue.toString());
    let totalSpend = ZERO;
    for (const ce of p.costEntries) {
      totalSpend = totalSpend.plus(ce.actualAmount.toString());
    }

    const marginPercent = contractValue.isZero()
      ? ZERO
      : contractValue.minus(totalSpend).div(contractValue).times(100);

    result.push({
      projectId: p.id,
      projectName: p.name,
      contractValue: contractValue.toFixed(2),
      totalSpend: totalSpend.toFixed(2),
      marginPercent: marginPercent.toFixed(2),
      healthRag: getMarginRag(marginPercent),
    });
  }

  // Sort by margin ascending (worst first)
  result.sort((a, b) => parseFloat(a.marginPercent) - parseFloat(b.marginPercent));

  return result;
}

/**
 * Fetch portfolio-wide revenue vs cost by month.
 */
async function fetchRevenueVsCost(): Promise<RevenueVsCostEntry[]> {
  // Get monthly costs
  const monthlyCosts = await prisma.costEntry.groupBy({
    by: ['period'],
    _sum: { actualAmount: true },
    orderBy: { period: 'asc' },
  });

  // Get milestones as revenue (by paid date or due date month)
  const milestones = await prisma.paymentMilestone.findMany({
    select: { amount: true, dueDate: true, isPaid: true, paidDate: true },
  });

  const revenueByMonth = new Map<string, Decimal>();
  for (const m of milestones) {
    const date = m.isPaid && m.paidDate ? m.paidDate : m.dueDate;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = revenueByMonth.get(month) ?? ZERO;
    revenueByMonth.set(month, existing.plus(m.amount.toString()));
  }

  // Merge all months
  const allMonths = new Set<string>();
  for (const c of monthlyCosts) allMonths.add(c.period);
  for (const month of revenueByMonth.keys()) allMonths.add(month);

  const sorted = Array.from(allMonths).sort();

  return sorted.map((month) => {
    const costRow = monthlyCosts.find((c) => c.period === month);
    const cost = costRow?._sum.actualAmount
      ? new Decimal(costRow._sum.actualAmount.toString())
      : ZERO;
    const revenue = revenueByMonth.get(month) ?? ZERO;

    return {
      month,
      totalRevenue: revenue.toFixed(2),
      totalCost: cost.toFixed(2),
    };
  });
}

/**
 * Fetch forecast-to-completion for all projects with cost data.
 * Simplified inline forecast computation (linear projection from monthly burns).
 */
async function fetchForecastList(): Promise<ForecastProject[]> {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
    select: {
      id: true,
      name: true,
      contractValue: true,
      endDate: true,
      costEntries: {
        select: { period: true, actualAmount: true },
      },
    },
  });

  const result: ForecastProject[] = [];

  for (const p of projects) {
    const contractValue = new Decimal(p.contractValue.toString());

    // Group cost entries by period
    const byPeriod = new Map<string, Decimal>();
    for (const ce of p.costEntries) {
      const existing = byPeriod.get(ce.period) ?? ZERO;
      byPeriod.set(ce.period, existing.plus(ce.actualAmount.toString()));
    }

    const months = Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    if (months.length < 3) {
      // Insufficient data — still include with basic info
      let totalSpend = ZERO;
      for (const [, amt] of months) totalSpend = totalSpend.plus(amt);

      result.push({
        projectId: p.id,
        projectName: p.name,
        projectedTotalCost: totalSpend.toFixed(2),
        contractValue: contractValue.toFixed(2),
        variance: totalSpend.minus(contractValue).toFixed(2),
        confidence: 'INSUFFICIENT_DATA',
        completionMonth: null,
      });
      continue;
    }

    // Simple linear projection: average monthly burn * remaining months
    let totalSpend = ZERO;
    for (const [, amt] of months) totalSpend = totalSpend.plus(amt);

    const avgMonthlyBurn = totalSpend.div(months.length);
    const endMonth = `${p.endDate.getFullYear()}-${String(p.endDate.getMonth() + 1).padStart(2, '0')}`;
    const lastDataMonth = months[months.length - 1]![0];

    // Count remaining months
    const lastParts = lastDataMonth.split('-').map(Number);
    const endParts = endMonth.split('-').map(Number);
    const remainingMonths = Math.max(
      0,
      (endParts[0]! - lastParts[0]!) * 12 + (endParts[1]! - lastParts[1]!),
    );

    const projectedTotal = totalSpend.plus(avgMonthlyBurn.times(remainingMonths));
    const variance = projectedTotal.minus(contractValue);

    // Confidence based on data points
    const confidence = months.length >= 6 ? 'HIGH' as const
      : months.length >= 4 ? 'MEDIUM' as const
      : 'LOW' as const;

    result.push({
      projectId: p.id,
      projectName: p.name,
      projectedTotalCost: projectedTotal.toFixed(2),
      contractValue: contractValue.toFixed(2),
      variance: variance.toFixed(2),
      confidence,
      completionMonth: endMonth,
    });
  }

  return result;
}

/**
 * Main CFO Dashboard endpoint — runs all 4 fetches in parallel.
 */
export async function getCFODashboard(): Promise<{ data: CFODashboardResponse }> {
  const [burnRate, marginHealth, revenueVsCost, forecastList] = await Promise.all([
    fetchBurnRate(),
    fetchMarginHealth(),
    fetchRevenueVsCost(),
    fetchForecastList(),
  ]);

  // Compute portfolio aggregates
  let totalContractValue = ZERO;
  let totalSpend = ZERO;
  let projectedTotalCost = ZERO;

  for (const p of marginHealth) {
    totalContractValue = totalContractValue.plus(p.contractValue);
    totalSpend = totalSpend.plus(p.totalSpend);
  }

  for (const f of forecastList) {
    projectedTotalCost = projectedTotalCost.plus(f.projectedTotalCost);
  }

  const overallMarginPercent = totalContractValue.isZero()
    ? ZERO
    : totalContractValue.minus(projectedTotalCost).div(totalContractValue).times(100);

  const aggregates: PortfolioAggregates = {
    totalContractValue: totalContractValue.toFixed(2),
    totalSpend: totalSpend.toFixed(2),
    projectedTotalCost: projectedTotalCost.toFixed(2),
    overallMarginPercent: overallMarginPercent.toFixed(2),
  };

  return {
    data: {
      burnRate,
      marginHealth,
      revenueVsCost,
      forecastList,
      aggregates,
    },
  };
}
