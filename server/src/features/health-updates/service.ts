/**
 * Health Updates Service with Proxy Satisfaction Signals (PRT-41 / FR23).
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, canModifyProject, type AuthUser } from '../../shared/dataScope.js';
import type { CreateHealthUpdateInput, UpdateHealthUpdateInput } from './validation.js';

function serializeHealthUpdate(entry: any) {
  return {
    id: entry.id,
    projectId: entry.projectId,
    period: entry.period,
    achievements: entry.achievements,
    challenges: entry.challenges,
    clientSatisfactionRag: entry.clientSatisfactionRag,
    clientSatisfactionNote: entry.clientSatisfactionNote,
    escalationCount: entry.escalationCount ?? 0,
    changeRequestVolume: entry.changeRequestVolume ?? 0,
    avgResponseTimeDays: entry.avgResponseTimeDays?.toString() ?? null,
    enteredById: entry.enteredById,
    enteredBy: entry.enteredBy
      ? { id: entry.enteredBy.id, displayName: entry.enteredBy.displayName }
      : undefined,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

const healthUpdateSelect = {
  id: true,
  projectId: true,
  period: true,
  achievements: true,
  challenges: true,
  clientSatisfactionRag: true,
  clientSatisfactionNote: true,
  escalationCount: true,
  changeRequestVolume: true,
  avgResponseTimeDays: true,
  enteredById: true,
  enteredBy: { select: { id: true, displayName: true } },
  createdAt: true,
  updatedAt: true,
};

async function verifyProjectAccess(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project))
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  return project;
}

export async function listHealthUpdates(projectId: number, user: AuthUser) {
  await verifyProjectAccess(projectId, user);

  const updates = await prisma.healthUpdate.findMany({
    where: { projectId },
    select: healthUpdateSelect,
    orderBy: { period: 'desc' },
  });

  return { data: updates.map(serializeHealthUpdate) };
}

export async function getHealthUpdate(projectId: number, period: string, user: AuthUser) {
  await verifyProjectAccess(projectId, user);

  const update = await prisma.healthUpdate.findUnique({
    where: { projectId_period: { projectId, period } },
    select: healthUpdateSelect,
  });

  if (!update) throw new AppError(404, 'NOT_FOUND', 'Health update not found');
  return { data: serializeHealthUpdate(update) };
}

export async function createHealthUpdate(
  projectId: number,
  input: CreateHealthUpdateInput,
  user: AuthUser,
) {
  const project = await verifyProjectAccess(projectId, user);
  if (!canModifyProject(user, project))
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can create health updates');

  // Check for duplicate period
  const existing = await prisma.healthUpdate.findUnique({
    where: { projectId_period: { projectId, period: input.period } },
  });
  if (existing) throw new AppError(409, 'CONFLICT', `Health update already exists for period ${input.period}`);

  const update = await prisma.healthUpdate.create({
    data: {
      projectId,
      period: input.period,
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
    },
    select: healthUpdateSelect,
  });

  return { data: serializeHealthUpdate(update) };
}

export async function updateHealthUpdate(
  projectId: number,
  period: string,
  input: UpdateHealthUpdateInput,
  user: AuthUser,
) {
  const project = await verifyProjectAccess(projectId, user);
  if (!canModifyProject(user, project))
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can update health updates');

  const existing = await prisma.healthUpdate.findUnique({
    where: { projectId_period: { projectId, period } },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Health update not found');

  const updateData: any = {};
  if (input.achievements !== undefined) updateData.achievements = input.achievements;
  if (input.challenges !== undefined) updateData.challenges = input.challenges;
  if (input.clientSatisfactionRag !== undefined)
    updateData.clientSatisfactionRag = input.clientSatisfactionRag;
  if (input.clientSatisfactionNote !== undefined)
    updateData.clientSatisfactionNote = input.clientSatisfactionNote;
  if (input.escalationCount !== undefined)
    updateData.escalationCount = input.escalationCount;
  if (input.changeRequestVolume !== undefined)
    updateData.changeRequestVolume = input.changeRequestVolume;
  if (input.avgResponseTimeDays !== undefined)
    updateData.avgResponseTimeDays = input.avgResponseTimeDays
      ? new Prisma.Decimal(input.avgResponseTimeDays)
      : null;

  const update = await prisma.healthUpdate.update({
    where: { projectId_period: { projectId, period } },
    data: updateData,
    select: healthUpdateSelect,
  });

  return { data: serializeHealthUpdate(update) };
}
