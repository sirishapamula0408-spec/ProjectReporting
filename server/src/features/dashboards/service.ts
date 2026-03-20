import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { getProjectScope, type AuthUser } from '../../shared/dataScope.js';

export async function getPmDashboard(user: AuthUser) {
  const scope = getProjectScope(user);

  const projects = await prisma.project.findMany({
    where: { ...scope, status: { in: ['ACTIVE', 'ON_HOLD', 'PROPOSAL'] } },
    select: {
      id: true,
      code: true,
      name: true,
      client: true,
      status: true,
      contractValue: true,
      updatedAt: true,
      costEntries: {
        select: { actualAmount: true, period: true },
      },
      healthUpdates: {
        orderBy: { period: 'desc' },
        take: 1,
        select: { clientSatisfactionRag: true, period: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get current period
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const projectSummaries = projects.map((p) => {
    const totalSpend = p.costEntries.reduce(
      (sum, e) => sum.plus(e.actualAmount.toString()),
      new Decimal(0),
    );
    const contractValue = new Decimal(p.contractValue.toString());
    const budgetUsedPct = contractValue.isZero()
      ? 0
      : totalSpend.div(contractValue).mul(100).toDecimalPlaces(1).toNumber();

    // Current month burn
    const currentMonthEntries = p.costEntries.filter((e) => e.period === currentPeriod);
    const currentBurn = currentMonthEntries.reduce(
      (sum, e) => sum.plus(e.actualAmount.toString()),
      new Decimal(0),
    );

    const healthRag = p.healthUpdates[0]?.clientSatisfactionRag || null;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      client: p.client,
      status: p.status,
      healthRag,
      currentBurnRate: currentBurn.toFixed(2),
      budgetUsedPct,
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  // Sort by RAG severity: RED first, then AMBER, then GREEN, then null
  const ragOrder: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };
  projectSummaries.sort((a, b) => {
    const aOrder = a.healthRag ? ragOrder[a.healthRag] ?? 3 : 3;
    const bOrder = b.healthRag ? ragOrder[b.healthRag] ?? 3 : 3;
    return aOrder - bOrder;
  });

  // KPIs
  const totalActive = projectSummaries.filter((p) => p.status === 'ACTIVE').length;
  const atRisk = projectSummaries.filter((p) => p.healthRag === 'RED' || p.healthRag === 'AMBER').length;
  const totalBurnRate = projectSummaries.reduce(
    (sum, p) => sum.plus(p.currentBurnRate),
    new Decimal(0),
  );

  return {
    data: {
      kpis: {
        totalActiveProjects: totalActive,
        projectsAtRisk: atRisk,
        totalPortfolioBurnRate: totalBurnRate.toFixed(2),
      },
      projects: projectSummaries,
    },
  };
}
