import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { CreateHealthUpdateInput } from './validation.js';

function serializeHealthUpdate(h: any) {
  return {
    ...h,
    avgResponseTimeDays: h.avgResponseTimeDays ? h.avgResponseTimeDays.toString() : null,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
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

export async function listHealthUpdates(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const healthUpdates = await prisma.healthUpdate.findMany({
    where: { projectId },
    orderBy: { period: 'desc' },
  });

  return { data: healthUpdates.map(serializeHealthUpdate) };
}

export async function getHealthUpdate(projectId: number, period: string, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const healthUpdate = await prisma.healthUpdate.findUnique({
    where: { projectId_period: { projectId, period } },
  });
  if (!healthUpdate) throw new AppError(404, 'NOT_FOUND', 'Health update not found');

  return { data: serializeHealthUpdate(healthUpdate) };
}

export async function upsertHealthUpdate(
  projectId: number,
  input: CreateHealthUpdateInput,
  user: AuthUser,
) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can manage health updates');
  }

  const data = {
    achievements: input.achievements ?? [],
    challenges: input.challenges ?? [],
    clientSatisfactionRag: input.clientSatisfactionRag,
    clientSatisfactionNote: input.clientSatisfactionNote ?? null,
    escalationCount: input.escalationCount ?? null,
    changeRequestVolume: input.changeRequestVolume ?? null,
    avgResponseTimeDays: input.avgResponseTimeDays
      ? new Prisma.Decimal(input.avgResponseTimeDays)
      : null,
    enteredById: user.id,
  };

  const healthUpdate = await prisma.healthUpdate.upsert({
    where: { projectId_period: { projectId, period: input.period! } },
    create: {
      projectId,
      period: input.period!,
      ...data,
    },
    update: data,
  });

  return { data: serializeHealthUpdate(healthUpdate) };
}
