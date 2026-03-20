import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { CreateRiskInput, UpdateRiskInput, UpdateRiskStatusInput } from './validation.js';

function serializeRisk(r: any) {
  return {
    ...r,
    costImpact: r.costImpact.toString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function getProjectOrThrow(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Access denied');
  return project;
}

export async function listRisks(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const risks = await prisma.risk.findMany({
    where: { projectId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return { data: risks.map(serializeRisk) };
}

export async function createRisk(projectId: number, input: CreateRiskInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can create risks');
  }

  const risk = await prisma.risk.create({
    data: {
      projectId,
      description: input.description,
      probability: input.probability,
      costImpact: new Prisma.Decimal(input.costImpact),
      status: 'OPEN',
      mitigationPlan: input.mitigationPlan ?? null,
    },
  });

  return { data: serializeRisk(risk) };
}

export async function updateRisk(
  projectId: number,
  riskId: number,
  input: UpdateRiskInput,
  user: AuthUser,
) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can update risks');
  }

  const existing = await prisma.risk.findFirst({
    where: { id: riskId, projectId },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Risk not found');

  const updateData: any = {};
  if (input.description !== undefined) updateData.description = input.description;
  if (input.probability !== undefined) updateData.probability = input.probability;
  if (input.costImpact !== undefined) updateData.costImpact = new Prisma.Decimal(input.costImpact);
  if (input.mitigationPlan !== undefined) updateData.mitigationPlan = input.mitigationPlan;
  if (input.status !== undefined) updateData.status = input.status;

  const risk = await prisma.risk.update({
    where: { id: riskId },
    data: updateData,
  });

  return { data: serializeRisk(risk) };
}

export async function updateRiskStatus(
  projectId: number,
  riskId: number,
  input: UpdateRiskStatusInput,
  user: AuthUser,
) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can update risk status');
  }

  const existing = await prisma.risk.findFirst({
    where: { id: riskId, projectId },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Risk not found');

  const risk = await prisma.risk.update({
    where: { id: riskId },
    data: { status: input.status },
  });

  return { data: serializeRisk(risk) };
}
