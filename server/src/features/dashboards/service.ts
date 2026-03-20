import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, getProjectScope, canAccessProject } from '../../shared/dataScope.js';
import { logger } from '../../config/logger.js';

const RAG_SORT_ORDER: Record<string, number> = {
  RED: 0,
  AMBER: 1,
  GREEN: 2,
};

function ragSortValue(rag: string | null | undefined): number {
  if (rag == null) return 3;
  return RAG_SORT_ORDER[rag] ?? 3;
}

export async function getPMDashboard(user: AuthUser) {
  if (user.role !== 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Only PM users can access the PM dashboard');
  }

  const where = getProjectScope(user);

  // Fetch all projects managed by this PM with related data
  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: { select: { displayName: true } },
      healthUpdates: {
        orderBy: { period: 'desc' },
        take: 1,
      },
      costEntries: {
        select: {
          actualAmount: true,
          period: true,
        },
      },
      allocations: {
        where: {
          endDate: null,
        },
        select: { id: true },
      },
    },
  });

  logger.debug(`PM dashboard: found ${projects.length} projects for user ${user.id}`);

  // Find the latest period across all projects for burn rate KPI
  let latestPeriod: string | null = null;
  for (const project of projects) {
    for (const entry of project.costEntries) {
      if (!latestPeriod || entry.period > latestPeriod) {
        latestPeriod = entry.period;
      }
    }
  }

  // Build project items
  const projectItems = projects.map((project) => {
    const latestHealth = project.healthUpdates[0] ?? null;
    const healthRag = latestHealth?.clientSatisfactionRag ?? null;

    // Calculate burn rate (latest period total actual cost)
    const latestPeriodEntries = latestPeriod
      ? project.costEntries.filter((e) => e.period === latestPeriod)
      : [];
    const burnRate = latestPeriodEntries.reduce(
      (sum, e) => sum.plus(new Decimal(e.actualAmount.toString())),
      new Decimal(0),
    );

    // Calculate cumulative spend (all actual costs)
    const cumulativeSpend = project.costEntries.reduce(
      (sum, e) => sum.plus(new Decimal(e.actualAmount.toString())),
      new Decimal(0),
    );

    // Budget used percent
    const contractValue = new Decimal(project.contractValue.toString());
    const budgetUsedPercent = contractValue.isZero()
      ? 0
      : cumulativeSpend.div(contractValue).times(100).toDecimalPlaces(2).toNumber();

    return {
      id: project.id,
      code: project.code,
      name: project.name,
      client: project.client,
      status: project.status,
      healthRag,
      burnRate: burnRate.toDecimalPlaces(2).toString(),
      contractValue: contractValue.toDecimalPlaces(2).toString(),
      cumulativeSpend: cumulativeSpend.toDecimalPlaces(2).toString(),
      budgetUsedPercent,
      teamSize: project.allocations.length,
      lastUpdated: project.updatedAt.toISOString(),
    };
  });

  // Sort by RAG severity (RED=0, AMBER=1, GREEN=2, null=3), then burnRate desc
  projectItems.sort((a, b) => {
    const ragDiff = ragSortValue(a.healthRag) - ragSortValue(b.healthRag);
    if (ragDiff !== 0) return ragDiff;
    return new Decimal(b.burnRate).minus(new Decimal(a.burnRate)).toNumber();
  });

  // KPIs
  const totalActiveProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const projectsAtRisk = projectItems.filter(
    (p) => p.healthRag === 'RED' || p.healthRag === 'AMBER',
  ).length;
  const totalBurnRate = projectItems
    .reduce((sum, p) => sum.plus(new Decimal(p.burnRate)), new Decimal(0))
    .toDecimalPlaces(2)
    .toString();

  return {
    data: {
      kpis: {
        totalActiveProjects,
        projectsAtRisk,
        totalBurnRate,
      },
      projects: projectItems,
    },
  };
}

export async function getProjectDashboard(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { displayName: true } },
    },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', `Project with id ${projectId} not found`);
  }

  if (!canAccessProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  // Fetch all related data in parallel
  const [costEntries, healthUpdates, allocations] = await Promise.all([
    prisma.costEntry.findMany({
      where: { projectId },
      include: {
        costCategory: {
          select: { categoryType: true },
        },
      },
      orderBy: { period: 'asc' },
    }),
    prisma.healthUpdate.findMany({
      where: { projectId },
      orderBy: { period: 'desc' },
    }),
    prisma.projectAllocation.findMany({
      where: { projectId },
      include: {
        teamMember: {
          select: { role: true },
        },
      },
    }),
  ]);

  logger.debug(
    `Project dashboard ${projectId}: ${costEntries.length} cost entries, ${healthUpdates.length} health updates, ${allocations.length} allocations`,
  );

  // Project info
  const projectInfo = {
    id: project.id,
    code: project.code,
    name: project.name,
    client: project.client,
    status: project.status,
    contractValue: new Decimal(project.contractValue.toString()).toDecimalPlaces(2).toString(),
    startDate: project.startDate.toISOString().split('T')[0],
    endDate: project.endDate.toISOString().split('T')[0],
    businessUnit: project.businessUnit,
    managerName: project.manager.displayName,
    description: project.description ?? null,
  };

  // KPIs
  const contractValue = new Decimal(project.contractValue.toString());
  const cumulativeSpend = costEntries.reduce(
    (sum, e) => sum.plus(new Decimal(e.actualAmount.toString())),
    new Decimal(0),
  );

  // Current month = latest period with cost entries
  const lastEntry = costEntries[costEntries.length - 1];
  const latestPeriod = lastEntry ? lastEntry.period : null;
  const currentMonthEntries = latestPeriod
    ? costEntries.filter((e) => e.period === latestPeriod)
    : [];
  const totalBurnRate = currentMonthEntries
    .reduce((sum, e) => sum.plus(new Decimal(e.actualAmount.toString())), new Decimal(0))
    .toDecimalPlaces(2)
    .toString();

  const budgetRemaining = contractValue.minus(cumulativeSpend).toDecimalPlaces(2).toString();
  const latestHealth = healthUpdates[0] ?? null;

  const kpis = {
    totalBurnRate,
    cumulativeSpend: cumulativeSpend.toDecimalPlaces(2).toString(),
    contractValue: contractValue.toDecimalPlaces(2).toString(),
    budgetRemaining,
    healthRag: latestHealth?.clientSatisfactionRag ?? null,
  };

  // Burn rate history: monthly totals sorted by period asc
  const burnRateMap = new Map<string, Decimal>();
  for (const entry of costEntries) {
    const existing = burnRateMap.get(entry.period) ?? new Decimal(0);
    burnRateMap.set(entry.period, existing.plus(new Decimal(entry.actualAmount.toString())));
  }
  const burnRateHistory = Array.from(burnRateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, amount]) => ({
      period,
      amount: amount.toDecimalPlaces(2).toString(),
    }));

  // Cost breakdown for current period (latest period with cost entries)
  // Also fetch planned amounts for the same period
  const costBreakdown: Array<{ category: string; planned: string; actual: string }> = [];
  if (latestPeriod) {
    // Group actuals by category for the latest period
    const actualByCategory = new Map<string, Decimal>();
    for (const entry of currentMonthEntries) {
      const cat = entry.costCategory.categoryType;
      const existing = actualByCategory.get(cat) ?? new Decimal(0);
      actualByCategory.set(cat, existing.plus(new Decimal(entry.actualAmount.toString())));
    }

    // Fetch planned amounts for this period
    const plannedAmounts = await prisma.plannedAmount.findMany({
      where: {
        period: latestPeriod,
        costCategory: { projectId },
      },
      include: {
        costCategory: { select: { categoryType: true } },
      },
    });

    const plannedByCategory = new Map<string, Decimal>();
    for (const pa of plannedAmounts) {
      const cat = pa.costCategory.categoryType;
      const existing = plannedByCategory.get(cat) ?? new Decimal(0);
      plannedByCategory.set(cat, existing.plus(new Decimal(pa.amount.toString())));
    }

    // Combine all categories that appear in either planned or actual
    const allCategories = new Set([...actualByCategory.keys(), ...plannedByCategory.keys()]);
    for (const category of allCategories) {
      costBreakdown.push({
        category,
        planned: (plannedByCategory.get(category) ?? new Decimal(0)).toDecimalPlaces(2).toString(),
        actual: (actualByCategory.get(category) ?? new Decimal(0)).toDecimalPlaces(2).toString(),
      });
    }
  }

  // Health summary
  const healthSummary = latestHealth
    ? {
        achievements: latestHealth.achievements,
        challenges: latestHealth.challenges,
        clientSatisfactionRag: latestHealth.clientSatisfactionRag,
        escalationCount: latestHealth.escalationCount,
        changeRequestVolume: latestHealth.changeRequestVolume,
        avgResponseTimeDays: latestHealth.avgResponseTimeDays
          ? new Decimal(latestHealth.avgResponseTimeDays.toString()).toDecimalPlaces(2).toString()
          : null,
        period: latestHealth.period,
      }
    : null;

  // Team composition
  // Active allocations = no endDate or endDate in the future
  const now = new Date();
  const activeAllocations = allocations.filter(
    (a) => a.endDate === null || a.endDate > now,
  );
  const totalAllocationPct = activeAllocations
    .reduce((sum, a) => sum.plus(new Decimal(a.allocationPct.toString())), new Decimal(0))
    .toDecimalPlaces(2)
    .toString();

  const roleCountMap = new Map<string, number>();
  for (const alloc of activeAllocations) {
    const role = alloc.teamMember.role;
    roleCountMap.set(role, (roleCountMap.get(role) ?? 0) + 1);
  }

  const teamComposition = {
    totalMembers: activeAllocations.length,
    totalAllocationPct,
    roles: Array.from(roleCountMap.entries()).map(([role, count]) => ({ role, count })),
  };

  return {
    data: {
      project: projectInfo,
      kpis,
      burnRateHistory,
      costBreakdown,
      healthSummary,
      teamComposition,
    },
  };
}

/**
 * Portfolio Dashboard — BU_HEAD and CFO only.
 */
export async function getPortfolioDashboard(user: AuthUser) {
  if (user.role === 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Portfolio dashboard is not available for PM role');
  }

  const where = getProjectScope(user);

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
      manager: { select: { id: true, displayName: true } },
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

  const projectSummaries = projects.map((p) => {
    const contractVal = new Decimal(p.contractValue.toString());
    const totalActualCost = p.costEntries.reduce(
      (sum, ce) => sum.plus(new Decimal(ce.actualAmount.toString())),
      new Decimal(0),
    );

    const periodTotals: Record<string, Decimal> = {};
    for (const ce of p.costEntries) {
      const existing = periodTotals[ce.period] ?? new Decimal(0);
      periodTotals[ce.period] = existing.plus(new Decimal(ce.actualAmount.toString()));
    }
    const sortedPeriods = Object.keys(periodTotals).sort().reverse().slice(0, 6).reverse();
    const burnRateTrend = sortedPeriods.map((period) => ({
      period,
      amount: (periodTotals[period] ?? new Decimal(0)).toString(),
    }));

    const margin = contractVal.isZero()
      ? new Decimal(0)
      : contractVal.minus(totalActualCost).div(contractVal).times(100);

    const budgetUsedPct = contractVal.isZero()
      ? new Decimal(0)
      : totalActualCost.div(contractVal).times(100);

    const latestHealth = p.healthUpdates[0]?.clientSatisfactionRag ?? null;

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

  const totalProjects = projectSummaries.length;
  const projectsByHealth = {
    RED: projectSummaries.filter((p) => p.healthRag === 'RED').length,
    AMBER: projectSummaries.filter((p) => p.healthRag === 'AMBER').length,
    GREEN: projectSummaries.filter((p) => p.healthRag === 'GREEN').length,
    NONE: projectSummaries.filter((p) => p.healthRag === null).length,
  };

  const totalBurnRate = projectSummaries.reduce((sum, p) => {
    const lastEntry = p.burnRateTrend[p.burnRateTrend.length - 1];
    return sum.plus(lastEntry ? new Decimal(lastEntry.amount) : new Decimal(0));
  }, new Decimal(0));

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
