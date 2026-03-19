import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { CreateAllocationInput, UpdateAllocationInput } from './validation.js';

function serializeAllocation(a: any) {
  return {
    ...a,
    allocationPct: a.allocationPct.toString(),
    startDate: a.startDate.toISOString().split('T')[0],
    endDate: a.endDate ? a.endDate.toISOString().split('T')[0] : null,
    onboardingDate: a.onboardingDate ? a.onboardingDate.toISOString().split('T')[0] : null,
    offboardingDate: a.offboardingDate ? a.offboardingDate.toISOString().split('T')[0] : null,
    ...(a.teamMember && {
      teamMember: {
        ...a.teamMember,
        loadedCostRate: a.teamMember.loadedCostRate.toString(),
      },
    }),
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
    include: {
      teamMember: { select: { id: true, name: true, role: true, department: true, loadedCostRate: true, skills: true } },
    },
    orderBy: { startDate: 'asc' },
  });
  return { data: allocations.map(serializeAllocation) };
}

export async function createAllocation(projectId: number, input: CreateAllocationInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Only PM can assign team');

  const allocation = await prisma.projectAllocation.create({
    data: {
      projectId,
      teamMemberId: input.teamMemberId,
      allocationPct: new Prisma.Decimal(input.allocationPct),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      onboardingDate: input.onboardingDate ? new Date(input.onboardingDate) : null,
      offboardingDate: input.offboardingDate ? new Date(input.offboardingDate) : null,
    },
    include: {
      teamMember: { select: { id: true, name: true, role: true, department: true, loadedCostRate: true, skills: true } },
    },
  });
  return { data: serializeAllocation(allocation) };
}

export async function updateAllocation(projectId: number, allocationId: number, input: UpdateAllocationInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Only PM can update allocations');

  const existing = await prisma.projectAllocation.findFirst({ where: { id: allocationId, projectId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Allocation not found');

  const updateData: any = {};
  if (input.allocationPct !== undefined) updateData.allocationPct = new Prisma.Decimal(input.allocationPct);
  if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.onboardingDate !== undefined) updateData.onboardingDate = input.onboardingDate ? new Date(input.onboardingDate) : null;
  if (input.offboardingDate !== undefined) updateData.offboardingDate = input.offboardingDate ? new Date(input.offboardingDate) : null;

  const allocation = await prisma.projectAllocation.update({
    where: { id: allocationId },
    data: updateData,
    include: {
      teamMember: { select: { id: true, name: true, role: true, department: true, loadedCostRate: true, skills: true } },
    },
  });
  return { data: serializeAllocation(allocation) };
}

export async function deleteAllocation(projectId: number, allocationId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Only PM can remove allocations');

  const existing = await prisma.projectAllocation.findFirst({ where: { id: allocationId, projectId } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Allocation not found');

  await prisma.projectAllocation.delete({ where: { id: allocationId } });
  return { data: { message: 'Allocation removed' } };
}

// Cross-project view: all allocations for a team member (FR11)
export async function getMemberAllocations(teamMemberId: number) {
  const allocations = await prisma.projectAllocation.findMany({
    where: { teamMemberId },
    include: {
      project: { select: { id: true, code: true, name: true, status: true } },
    },
    orderBy: { startDate: 'desc' },
  });
  return {
    data: allocations.map((a) => ({
      ...serializeAllocation(a),
      project: a.project,
    })),
  };
}
