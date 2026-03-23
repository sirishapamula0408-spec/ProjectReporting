import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { SaveBudgetPlanInput } from './validation.js';

async function getProjectOrThrow(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Access denied');
  return project;
}

export async function getBudgetPlan(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const costCategories = await prisma.costCategory.findMany({
    where: { projectId },
    include: { plannedAmounts: true },
  });

  const items = costCategories.flatMap((cat) =>
    cat.plannedAmounts.map((pa) => ({
      categoryType: cat.categoryType,
      period: pa.period,
      amount: pa.amount.toString(),
    })),
  );

  return { data: items };
}

export async function saveBudgetPlan(projectId: number, input: SaveBudgetPlanInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can update the budget plan');
  }

  for (const item of input.items) {
    // Find or create the CostCategory
    let costCategory = await prisma.costCategory.findFirst({
      where: { projectId, categoryType: item.categoryType },
    });

    if (!costCategory) {
      costCategory = await prisma.costCategory.create({
        data: {
          projectId,
          categoryType: item.categoryType,
        },
      });
    }

    // Upsert the PlannedAmount
    const existing = await prisma.plannedAmount.findFirst({
      where: { costCategoryId: costCategory.id, period: item.period },
    });

    if (existing) {
      await prisma.plannedAmount.update({
        where: { id: existing.id },
        data: { amount: new Prisma.Decimal(item.amount) },
      });
    } else {
      await prisma.plannedAmount.create({
        data: {
          costCategoryId: costCategory.id,
          period: item.period,
          amount: new Prisma.Decimal(item.amount),
        },
      });
    }
  }

  // Return the full updated budget plan
  return getBudgetPlan(projectId, user);
}
