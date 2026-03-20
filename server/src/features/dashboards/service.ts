import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, getProjectScope } from '../../shared/dataScope.js';

/**
 * Portfolio Dashboard — BU_HEAD and CFO only.
 * Returns project list with health, burn rate trend, margin, budget usage,
 * plus portfolio-level KPIs.
 */
export async function getPortfolioDashboard(user: AuthUser) {
  if (user.role === 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Portfolio dashboard is not available for PM role');
  }

  const where = getProjectScope(user);

  // Fetch projects with related data for KPI computation
  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      contractValue: true,
      businessUnit: true,
      updatedAt: true,
      manager: {
        select: { id: true, displayName: true },
      },
      costEntries: {
        select: { actualAmount: true, period: true },
        orderBy: { period: 'desc' },
      },
      healthUpdates: {
        select: { clientSatisfactionRag: true, period: true },
        orderBy: { period: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Build per-project summary
  const projectSummaries = projects.map((p) => {
    const contractValue = new Decimal(p.contractValue.toString());
    const totalActualCost = p.costEntries.reduce(
      (sum, ce) => sum.plus(new Decimal(ce.actualAmount.toString())),
      new Decimal(0),
    );

    // Burn rate trend: aggregate actual cost per period for last 6 months
    const periodTotals: Record<string, Decimal> = {};
    for (const ce of p.costEntries) {
      const existing = periodTotals[ce.period] ?? new Decimal(0);
      periodTotals[ce.period] = existing.plus(new Decimal(ce.actualAmount.toString()));
    }
    // Sort periods descending, take last 6
    const sortedPeriods = Object.keys(periodTotals).sort().reverse().slice(0, 6).reverse();
    const burnRateTrend = sortedPeriods.map((period) => ({
      period,
      amount: (periodTotals[period] ?? new Decimal(0)).toString(),
    }));

    // Margin % = (contractValue - totalActualCost) / contractValue * 100
    const margin = contractValue.isZero()
      ? new Decimal(0)
      : contractValue.minus(totalActualCost).div(contractValue).times(100);

    // Budget used % = totalActualCost / contractValue * 100
    const budgetUsedPct = contractValue.isZero()
      ? new Decimal(0)
      : totalActualCost.div(contractValue).times(100);

    // Latest health RAG
    const firstHealthUpdate = p.healthUpdates[0];
    const latestHealth = firstHealthUpdate
      ? firstHealthUpdate.clientSatisfactionRag
      : null;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      managerName: p.manager.displayName,
      status: p.status,
      healthRag: latestHealth,
      burnRateTrend,
      marginPct: margin.toDecimalPlaces(2).toString(),
      budgetUsedPct: budgetUsedPct.toDecimalPlaces(2).toString(),
      lastUpdated: p.updatedAt.toISOString(),
    };
  });

  // Portfolio KPIs
  const totalProjects = projectSummaries.length;
  const projectsByHealth = {
    RED: projectSummaries.filter((p) => p.healthRag === 'RED').length,
    AMBER: projectSummaries.filter((p) => p.healthRag === 'AMBER').length,
    GREEN: projectSummaries.filter((p) => p.healthRag === 'GREEN').length,
    NONE: projectSummaries.filter((p) => p.healthRag === null).length,
  };

  // Total burn rate = sum of most recent period burn for each project
  const totalBurnRate = projectSummaries.reduce((sum, p) => {
    const lastEntry = p.burnRateTrend[p.burnRateTrend.length - 1];
    const latest = lastEntry ? new Decimal(lastEntry.amount) : new Decimal(0);
    return sum.plus(latest);
  }, new Decimal(0));

  // Average margin across all projects
  const averageMargin = totalProjects > 0
    ? projectSummaries
        .reduce((sum, p) => sum.plus(new Decimal(p.marginPct)), new Decimal(0))
        .div(totalProjects)
    : new Decimal(0);

  return {
    data: {
      projects: projectSummaries,
      kpis: {
        totalProjects,
        projectsByHealth,
        totalBurnRate: totalBurnRate.toDecimalPlaces(2).toString(),
        averageMargin: averageMargin.toDecimalPlaces(2).toString(),
      },
    },
  };
}
