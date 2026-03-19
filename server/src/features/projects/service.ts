import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, getProjectScope, canAccessProject, canModifyProject } from '../../shared/dataScope.js';
import { validateTransition, getValidTransitions } from './stateMachine.js';
import type { CreateProjectInput, UpdateProjectInput } from './validation.js';
import type { ProjectStatus } from '@prisma/client';

// Select fields — never return sensitive data, always return decimals as strings
const projectSelect = {
  id: true,
  code: true,
  name: true,
  client: true,
  contractValue: true,
  startDate: true,
  endDate: true,
  status: true,
  businessUnit: true,
  description: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
  manager: {
    select: { id: true, displayName: true, username: true },
  },
} satisfies Prisma.ProjectSelect;

function serializeProject(project: any) {
  return {
    ...project,
    contractValue: project.contractValue.toString(),
    startDate: project.startDate.toISOString().split('T')[0],
    endDate: project.endDate.toISOString().split('T')[0],
  };
}

export async function listProjects(user: AuthUser, page = 1, pageSize = 20) {
  const where = getProjectScope(user);
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data: projects.map(serializeProject),
    meta: { total, page, pageSize },
  };
}

export async function getProjectById(id: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: projectSelect,
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!canAccessProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  return { data: serializeProject(project) };
}

export async function createProject(input: CreateProjectInput, user: AuthUser) {
  const project = await prisma.project.create({
    data: {
      code: input.code,
      name: input.name,
      client: input.client,
      contractValue: new Prisma.Decimal(input.contractValue),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      businessUnit: input.businessUnit,
      description: input.description ?? null,
      managerId: user.id,
      status: 'PROPOSAL',
    },
    select: projectSelect,
  });

  // Auto-create all 8 cost categories for the project
  const costCategoryTypes = [
    'EMPLOYEE_SALARY', 'SUBSCRIPTIONS', 'TRAVEL', 'ACCOMMODATION',
    'FOOD_ALLOWANCE', 'GIFTS', 'INFRASTRUCTURE', 'CONTRACTOR',
  ] as const;

  await prisma.costCategory.createMany({
    data: costCategoryTypes.map((type) => ({
      projectId: project.id,
      categoryType: type,
    })),
  });

  return { data: serializeProject(project) };
}

export async function updateProject(id: number, input: UpdateProjectInput, user: AuthUser) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  if (!canModifyProject(user, existing)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can edit this project');
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.client !== undefined) updateData.client = input.client;
  if (input.contractValue !== undefined) updateData.contractValue = new Prisma.Decimal(input.contractValue);
  if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
  if (input.businessUnit !== undefined) updateData.businessUnit = input.businessUnit;
  if (input.description !== undefined) updateData.description = input.description;

  const project = await prisma.project.update({
    where: { id },
    data: updateData,
    select: projectSelect,
  });

  return { data: serializeProject(project) };
}

export async function transitionProjectStatus(id: number, newStatus: ProjectStatus, user: AuthUser) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  if (!canModifyProject(user, existing)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project manager can change project status');
  }

  // Validate the transition using state machine
  validateTransition(existing.status, newStatus);

  const project = await prisma.project.update({
    where: { id },
    data: { status: newStatus },
    select: projectSelect,
  });

  return {
    data: {
      ...serializeProject(project),
      validTransitions: getValidTransitions(newStatus),
    },
  };
}
