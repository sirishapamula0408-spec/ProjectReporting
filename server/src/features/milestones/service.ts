import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import type { CreateMilestoneInput, UpdateMilestoneInput } from './validation.js';

function serializeMilestone(m: any) {
  return {
    ...m,
    amount: m.amount.toString(),
    dueDate: m.dueDate.toISOString().split('T')[0],
    paidDate: m.paidDate ? m.paidDate.toISOString().split('T')[0] : null,
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

export async function listMilestones(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const milestones = await prisma.paymentMilestone.findMany({
    where: { projectId },
    orderBy: { dueDate: 'asc' },
  });

  return { data: milestones.map(serializeMilestone) };
}

export async function createMilestone(projectId: number, input: CreateMilestoneInput, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can add milestones');
  }

  const milestone = await prisma.paymentMilestone.create({
    data: {
      projectId,
      name: input.name,
      amount: new Prisma.Decimal(input.amount),
      dueDate: new Date(input.dueDate),
    },
  });

  return { data: serializeMilestone(milestone) };
}

export async function updateMilestone(
  projectId: number,
  milestoneId: number,
  input: UpdateMilestoneInput,
  user: AuthUser,
) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can update milestones');
  }

  const existing = await prisma.paymentMilestone.findFirst({
    where: { id: milestoneId, projectId },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Milestone not found');

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.amount !== undefined) updateData.amount = new Prisma.Decimal(input.amount);
  if (input.dueDate !== undefined) updateData.dueDate = new Date(input.dueDate);
  if (input.isPaid !== undefined) updateData.isPaid = input.isPaid;
  if (input.paidDate !== undefined) updateData.paidDate = input.paidDate ? new Date(input.paidDate) : null;

  const milestone = await prisma.paymentMilestone.update({
    where: { id: milestoneId },
    data: updateData,
  });

  return { data: serializeMilestone(milestone) };
}

export async function deleteMilestone(projectId: number, milestoneId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);
  if (!canModifyProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can delete milestones');
  }

  const existing = await prisma.paymentMilestone.findFirst({
    where: { id: milestoneId, projectId },
  });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Milestone not found');

  await prisma.paymentMilestone.delete({ where: { id: milestoneId } });

  return { data: { message: 'Milestone deleted' } };
}
