import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, canModifyProject, type AuthUser } from '../../shared/dataScope.js';

// ─── Helpers ───

function serializeDecimal(val: Prisma.Decimal | null): string {
  return val ? val.toString() : '0.00';
}

async function getProjectOrThrow(projectId: number, user: AuthUser, requireModify = false) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true, contractValue: true },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Access denied');
  if (requireModify && !canModifyProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Only the project manager can modify this project');
  return project;
}

// ─── Cost Categories ───

export async function listCostCategories(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const categories = await prisma.costCategory.findMany({
    where: { projectId },
    orderBy: { id: 'asc' },
  });

  return { data: categories };
}

// ─── Planned Amounts ───

export async function listPlannedAmounts(projectId: number, user: AuthUser, period?: string) {
  await getProjectOrThrow(projectId, user);

  const where: Prisma.PlannedAmountWhereInput = {
    costCategory: { projectId },
  };
  if (period) where.period = period;

  const amounts = await prisma.plannedAmount.findMany({
    where,
    include: { costCategory: { select: { id: true, categoryType: true } } },
    orderBy: [{ costCategory: { id: 'asc' } }, { period: 'asc' }],
  });

  return {
    data: amounts.map((a) => ({
      id: a.id,
      costCategoryId: a.costCategoryId,
      categoryType: a.costCategory.categoryType,
      period: a.period,
      amount: serializeDecimal(a.amount),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };
}

export async function upsertPlannedAmount(
  projectId: number,
  costCategoryId: number,
  period: string,
  amount: string,
  user: AuthUser,
) {
  await getProjectOrThrow(projectId, user, true);

  // Verify category belongs to project
  const category = await prisma.costCategory.findFirst({
    where: { id: costCategoryId, projectId },
  });
  if (!category) throw new AppError(404, 'NOT_FOUND', 'Cost category not found for this project');

  const result = await prisma.plannedAmount.upsert({
    where: { costCategoryId_period: { costCategoryId, period } },
    create: {
      costCategoryId,
      period,
      amount: new Prisma.Decimal(amount),
    },
    update: {
      amount: new Prisma.Decimal(amount),
    },
  });

  return {
    data: {
      id: result.id,
      costCategoryId: result.costCategoryId,
      period: result.period,
      amount: serializeDecimal(result.amount),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    },
  };
}

export async function batchUpsertPlannedAmounts(
  projectId: number,
  items: Array<{ costCategoryId: number; period: string; amount: string }>,
  user: AuthUser,
) {
  await getProjectOrThrow(projectId, user, true);

  // Verify all categories belong to project
  const categoryIds = [...new Set(items.map((i) => i.costCategoryId))];
  const categories = await prisma.costCategory.findMany({
    where: { id: { in: categoryIds }, projectId },
    select: { id: true },
  });
  if (categories.length !== categoryIds.length) {
    throw new AppError(400, 'INVALID_CATEGORY', 'One or more cost categories do not belong to this project');
  }

  const results = await prisma.$transaction(
    items.map((item) =>
      prisma.plannedAmount.upsert({
        where: { costCategoryId_period: { costCategoryId: item.costCategoryId, period: item.period } },
        create: {
          costCategoryId: item.costCategoryId,
          period: item.period,
          amount: new Prisma.Decimal(item.amount),
        },
        update: {
          amount: new Prisma.Decimal(item.amount),
        },
      }),
    ),
  );

  return {
    data: results.map((r) => ({
      id: r.id,
      costCategoryId: r.costCategoryId,
      period: r.period,
      amount: serializeDecimal(r.amount),
    })),
  };
}

// ─── Cost Entries ───

export async function listCostEntries(projectId: number, user: AuthUser, period?: string) {
  await getProjectOrThrow(projectId, user);

  const where: Prisma.CostEntryWhereInput = { projectId };
  if (period) where.period = period;

  const entries = await prisma.costEntry.findMany({
    where,
    include: {
      costCategory: { select: { id: true, categoryType: true } },
      enteredBy: { select: { id: true, displayName: true } },
    },
    orderBy: [{ costCategory: { id: 'asc' } }, { period: 'asc' }],
  });

  return {
    data: entries.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      costCategoryId: e.costCategoryId,
      categoryType: e.costCategory.categoryType,
      period: e.period,
      actualAmount: serializeDecimal(e.actualAmount),
      notes: e.notes,
      enteredBy: e.enteredBy,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };
}

export async function upsertCostEntry(
  projectId: number,
  costCategoryId: number,
  period: string,
  actualAmount: string,
  notes: string | undefined,
  user: AuthUser,
) {
  await getProjectOrThrow(projectId, user, true);

  const category = await prisma.costCategory.findFirst({
    where: { id: costCategoryId, projectId },
  });
  if (!category) throw new AppError(404, 'NOT_FOUND', 'Cost category not found for this project');

  // Check if entry already exists for audit trail
  const existing = await prisma.costEntry.findUnique({
    where: { costCategoryId_period: { costCategoryId, period } },
  });

  if (existing) {
    // Update with audit trail
    const result = await prisma.$transaction(async (tx) => {
      const audit = await tx.costEntryAudit.create({
        data: {
          costEntryId: existing.id,
          previousAmount: existing.actualAmount,
          newAmount: new Prisma.Decimal(actualAmount),
          changedById: user.id,
          reason: notes || null,
        },
      });

      const updated = await tx.costEntry.update({
        where: { id: existing.id },
        data: {
          actualAmount: new Prisma.Decimal(actualAmount),
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: {
          costCategory: { select: { categoryType: true } },
          enteredBy: { select: { id: true, displayName: true } },
        },
      });

      return updated;
    });

    return {
      data: {
        id: result.id,
        projectId: result.projectId,
        costCategoryId: result.costCategoryId,
        categoryType: result.costCategory.categoryType,
        period: result.period,
        actualAmount: serializeDecimal(result.actualAmount),
        notes: result.notes,
        enteredBy: result.enteredBy,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    };
  }

  // Create new entry
  const entry = await prisma.costEntry.create({
    data: {
      projectId,
      costCategoryId,
      period,
      actualAmount: new Prisma.Decimal(actualAmount),
      notes: notes || null,
      enteredById: user.id,
    },
    include: {
      costCategory: { select: { categoryType: true } },
      enteredBy: { select: { id: true, displayName: true } },
    },
  });

  return {
    data: {
      id: entry.id,
      projectId: entry.projectId,
      costCategoryId: entry.costCategoryId,
      categoryType: entry.costCategory.categoryType,
      period: entry.period,
      actualAmount: serializeDecimal(entry.actualAmount),
      notes: entry.notes,
      enteredBy: entry.enteredBy,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    },
  };
}

export async function batchUpsertCostEntries(
  projectId: number,
  items: Array<{ costCategoryId: number; period: string; actualAmount: string; notes?: string }>,
  user: AuthUser,
) {
  await getProjectOrThrow(projectId, user, true);

  // Verify all categories belong to project
  const categoryIds = [...new Set(items.map((i) => i.costCategoryId))];
  const categories = await prisma.costCategory.findMany({
    where: { id: { in: categoryIds }, projectId },
    select: { id: true },
  });
  if (categories.length !== categoryIds.length) {
    throw new AppError(400, 'INVALID_CATEGORY', 'One or more cost categories do not belong to this project');
  }

  const results = await prisma.$transaction(async (tx) => {
    const txResults = [];
    for (const item of items) {
      const existing = await tx.costEntry.findUnique({
        where: { costCategoryId_period: { costCategoryId: item.costCategoryId, period: item.period } },
      });

      if (existing) {
        await tx.costEntryAudit.create({
          data: {
            costEntryId: existing.id,
            previousAmount: existing.actualAmount,
            newAmount: new Prisma.Decimal(item.actualAmount),
            changedById: user.id,
            reason: item.notes || null,
          },
        });
        const updated = await tx.costEntry.update({
          where: { id: existing.id },
          data: {
            actualAmount: new Prisma.Decimal(item.actualAmount),
            notes: item.notes !== undefined ? item.notes : existing.notes,
          },
          include: { costCategory: { select: { categoryType: true } } },
        });
        txResults.push({
          id: updated.id, projectId, costCategoryId: updated.costCategoryId,
          categoryType: updated.costCategory.categoryType, period: updated.period,
          actualAmount: serializeDecimal(updated.actualAmount),
        });
      } else {
        const created = await tx.costEntry.create({
          data: {
            projectId, costCategoryId: item.costCategoryId, period: item.period,
            actualAmount: new Prisma.Decimal(item.actualAmount),
            notes: item.notes || null, enteredById: user.id,
          },
          include: { costCategory: { select: { categoryType: true } } },
        });
        txResults.push({
          id: created.id, projectId, costCategoryId: created.costCategoryId,
          categoryType: created.costCategory.categoryType, period: created.period,
          actualAmount: serializeDecimal(created.actualAmount),
        });
      }
    }
    return txResults;
  });

  return { data: results };
}

export async function getCostEntryAudit(projectId: number, costEntryId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const entry = await prisma.costEntry.findFirst({
    where: { id: costEntryId, projectId },
  });
  if (!entry) throw new AppError(404, 'NOT_FOUND', 'Cost entry not found');

  const auditLog = await prisma.costEntryAudit.findMany({
    where: { costEntryId },
    orderBy: { changedAt: 'desc' },
  });

  return {
    data: auditLog.map((a) => ({
      id: a.id,
      costEntryId: a.costEntryId,
      previousAmount: serializeDecimal(a.previousAmount),
      newAmount: serializeDecimal(a.newAmount),
      changedById: a.changedById,
      changedAt: a.changedAt.toISOString(),
      reason: a.reason,
    })),
  };
}

// ─── Variance & Burn Rate Calculations (PRT-25) ───

const RAG_THRESHOLDS = { green: 5, amber: 15 }; // percentage

function computeRag(variancePct: number): string {
  const abs = Math.abs(variancePct);
  if (abs <= RAG_THRESHOLDS.green) return 'GREEN';
  if (abs <= RAG_THRESHOLDS.amber) return 'AMBER';
  return 'RED';
}

export async function getVariance(projectId: number, period: string, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const categories = await prisma.costCategory.findMany({
    where: { projectId },
    include: {
      plannedAmounts: { where: { period } },
      costEntries: { where: { period } },
    },
    orderBy: { id: 'asc' },
  });

  const data = categories.map((cat) => {
    const planned = new Decimal(cat.plannedAmounts[0]?.amount?.toString() || '0');
    const actual = new Decimal(cat.costEntries[0]?.actualAmount?.toString() || '0');
    const variance = actual.minus(planned);
    const variancePct = planned.isZero() ? 0 : variance.div(planned).mul(100).toDecimalPlaces(2).toNumber();

    return {
      costCategoryId: cat.id,
      categoryType: cat.categoryType,
      planned: planned.toFixed(2),
      actual: actual.toFixed(2),
      variance: variance.toFixed(2),
      variancePct,
      rag: computeRag(variancePct),
    };
  });

  const totalPlanned = data.reduce((sum, d) => sum.plus(d.planned), new Decimal(0));
  const totalActual = data.reduce((sum, d) => sum.plus(d.actual), new Decimal(0));
  const totalVariance = totalActual.minus(totalPlanned);
  const totalVariancePct = totalPlanned.isZero() ? 0 : totalVariance.div(totalPlanned).mul(100).toDecimalPlaces(2).toNumber();

  return {
    data: {
      period,
      categories: data,
      totals: {
        planned: totalPlanned.toFixed(2),
        actual: totalActual.toFixed(2),
        variance: totalVariance.toFixed(2),
        variancePct: totalVariancePct,
        rag: computeRag(totalVariancePct),
      },
    },
  };
}

export async function getBurnRate(projectId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);

  const entries = await prisma.costEntry.findMany({
    where: { projectId },
    select: { period: true, actualAmount: true },
    orderBy: { period: 'asc' },
  });

  // Group by period
  const byPeriod = new Map<string, Decimal>();
  for (const e of entries) {
    const current = byPeriod.get(e.period) || new Decimal(0);
    byPeriod.set(e.period, current.plus(e.actualAmount.toString()));
  }

  const periods = [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, total]) => ({
      period,
      burn: total.toFixed(2),
    }));

  // Cumulative
  let cumulative = new Decimal(0);
  const cumulativeData = periods.map((p) => {
    cumulative = cumulative.plus(p.burn);
    return {
      period: p.period,
      monthlyBurn: p.burn,
      cumulativeBurn: cumulative.toFixed(2),
    };
  });

  return {
    data: {
      contractValue: project.contractValue.toString(),
      periods: cumulativeData,
    },
  };
}

export async function getDashboard(projectId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  const contractValue = new Decimal(project.contractValue.toString());

  // Get all cost entries
  const entries = await prisma.costEntry.findMany({
    where: { projectId },
    select: { actualAmount: true },
  });

  const totalSpend = entries.reduce(
    (sum, e) => sum.plus(e.actualAmount.toString()),
    new Decimal(0),
  );

  // Get all planned amounts
  const planned = await prisma.plannedAmount.findMany({
    where: { costCategory: { projectId } },
    select: { amount: true },
  });

  const totalPlanned = planned.reduce(
    (sum, p) => sum.plus(p.amount.toString()),
    new Decimal(0),
  );

  const budgetRemaining = contractValue.minus(totalSpend);
  const spendPct = contractValue.isZero() ? 0 : totalSpend.div(contractValue).mul(100).toDecimalPlaces(2).toNumber();
  const totalVariance = totalSpend.minus(totalPlanned);
  const variancePct = totalPlanned.isZero() ? 0 : totalVariance.div(totalPlanned).mul(100).toDecimalPlaces(2).toNumber();

  return {
    data: {
      contractValue: contractValue.toFixed(2),
      totalSpend: totalSpend.toFixed(2),
      totalPlanned: totalPlanned.toFixed(2),
      budgetRemaining: budgetRemaining.toFixed(2),
      spendPct,
      variance: totalVariance.toFixed(2),
      variancePct,
      varianceRag: computeRag(variancePct),
    },
  };
}
