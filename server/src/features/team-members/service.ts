import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import type { CreateTeamMemberInput, UpdateTeamMemberInput } from './validation.js';

function serializeMember(m: any) {
  const { _count, ...rest } = m;
  return {
    ...rest,
    loadedCostRate: m.loadedCostRate.toString(),
    projectCount: _count?.allocations,
  };
}

interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export async function listTeamMembers(params: ListParams = {}) {
  const { page = 1, pageSize = 50, search, isActive } = params;
  const where: Prisma.TeamMemberWhereInput = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { role: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      include: { _count: { select: { allocations: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.teamMember.count({ where }),
  ]);

  return {
    data: members.map(serializeMember),
    meta: { total, page, pageSize },
  };
}

export async function getTeamMemberById(id: number) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) throw new AppError(404, 'NOT_FOUND', 'Team member not found');
  return { data: serializeMember(member) };
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  const member = await prisma.teamMember.create({
    data: {
      name: input.name,
      role: input.role,
      department: input.department,
      loadedCostRate: new Prisma.Decimal(input.loadedCostRate),
      skills: input.skills,
    },
  });
  return { data: serializeMember(member) };
}

export async function updateTeamMember(id: number, input: UpdateTeamMemberInput) {
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Team member not found');

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.department !== undefined) updateData.department = input.department;
  if (input.loadedCostRate !== undefined) updateData.loadedCostRate = new Prisma.Decimal(input.loadedCostRate);
  if (input.skills !== undefined) updateData.skills = input.skills;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const member = await prisma.teamMember.update({
    where: { id },
    data: updateData,
  });
  return { data: serializeMember(member) };
}
