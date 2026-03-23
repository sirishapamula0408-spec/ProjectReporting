import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { CreateAllocationInput } from './validation.js';

function serializeAllocation(a: any) {
  return {
    id: a.id,
    projectId: a.projectId,
    teamMemberId: a.teamMemberId,
    allocationPct: a.allocationPct.toString(),
    startDate: a.startDate.toISOString().split('T')[0],
    endDate: a.endDate ? a.endDate.toISOString().split('T')[0] : null,
    teamMember: a.teamMember
      ? { id: a.teamMember.id, name: a.teamMember.name, role: a.teamMember.role }
      : undefined,
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

export async function listAllocations(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const allocations = await prisma.projectAllocation.findMany({
    where: { projectId },
    include: { teamMember: { select: { id: true, name: true, role: true } } },
    orderBy: { startDate: 'asc' },
  });

  return { data: allocations.map(serializeAllocation) };
}

export async function createAllocation(projectId: number, input: CreateAllocationInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can add allocations');
  }

  const allocation = await prisma.projectAllocation.create({
    data: {
      projectId,
      teamMemberId: input.teamMemberId,
      allocationPct: new Prisma.Decimal(input.allocationPct),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
    include: { teamMember: { select: { id: true, name: true, role: true } } },
  });

  return { data: serializeAllocation(allocation) };
}

export async function deleteAllocation(projectId: number, allocationId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can remove allocations');
  }

  const existing = await prisma.projectAllocation.findFirst({
    where: { id: allocationId, projectId },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Allocation not found');

  await prisma.projectAllocation.delete({ where: { id: allocationId } });

  return { data: { message: 'Allocation deleted' } };
}
