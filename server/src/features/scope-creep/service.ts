/**
 * Scope Creep Service (PRT-40 / PRT-66).
 */
import { Decimal } from 'decimal.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, type AuthUser } from '../../shared/dataScope.js';
import type {
  ScopeCreepEntryResponse,
  ScopeCreepListResponse,
  DecisionBreakdown,
} from './types.js';
import type { CreateScopeCreepInput, UpdateScopeCreepInput } from './validation.js';

const ZERO = new Decimal(0);

function serializeEntry(entry: any): ScopeCreepEntryResponse {
  return {
    id: entry.id,
    projectId: entry.projectId,
    description: entry.description,
    effortHours: entry.effortHours.toString(),
    costImpact: entry.costImpact.toString(),
    decision: entry.decision,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

async function verifyProjectAccess(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!canAccessProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  return project;
}

export async function listScopeCreep(
  projectId: number,
  user: AuthUser,
): Promise<{ data: ScopeCreepListResponse }> {
  await verifyProjectAccess(projectId, user);

  const entries = await prisma.scopeCreepEntry.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  // Compute aggregation
  const decisions: Array<'ABSORBED' | 'CHANGE_REQUEST' | 'DECLINED'> = [
    'ABSORBED',
    'CHANGE_REQUEST',
    'DECLINED',
  ];

  let totalHours = ZERO;
  let totalCost = ZERO;
  const byDecision: Record<string, DecisionBreakdown> = {};

  for (const d of decisions) {
    byDecision[d] = { count: 0, hours: '0.00', cost: '0.00' };
  }

  for (const e of entries) {
    const hours = new Decimal(e.effortHours.toString());
    const cost = new Decimal(e.costImpact.toString());
    totalHours = totalHours.plus(hours);
    totalCost = totalCost.plus(cost);

    const bd = byDecision[e.decision]!;
    bd.count += 1;
    bd.hours = new Decimal(bd.hours).plus(hours).toFixed(2);
    bd.cost = new Decimal(bd.cost).plus(cost).toFixed(2);
  }

  return {
    data: {
      entries: entries.map(serializeEntry),
      aggregation: {
        totalEntries: entries.length,
        totalEffortHours: totalHours.toFixed(2),
        totalCostImpact: totalCost.toFixed(2),
        byDecision: byDecision as ScopeCreepListResponse['aggregation']['byDecision'],
      },
    },
  };
}

export async function createScopeCreep(
  projectId: number,
  input: CreateScopeCreepInput,
  user: AuthUser,
): Promise<{ data: ScopeCreepEntryResponse }> {
  await verifyProjectAccess(projectId, user);

  const entry = await prisma.scopeCreepEntry.create({
    data: {
      projectId,
      description: input.description,
      effortHours: new Prisma.Decimal(input.effortHours),
      costImpact: new Prisma.Decimal(input.costImpact),
      decision: input.decision,
    },
  });

  return { data: serializeEntry(entry) };
}

export async function updateScopeCreep(
  projectId: number,
  entryId: number,
  input: UpdateScopeCreepInput,
  user: AuthUser,
): Promise<{ data: ScopeCreepEntryResponse }> {
  await verifyProjectAccess(projectId, user);

  const existing = await prisma.scopeCreepEntry.findFirst({
    where: { id: entryId, projectId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Scope creep entry not found');
  }

  const updateData: any = {};
  if (input.description !== undefined) updateData.description = input.description;
  if (input.effortHours !== undefined)
    updateData.effortHours = new Prisma.Decimal(input.effortHours);
  if (input.costImpact !== undefined)
    updateData.costImpact = new Prisma.Decimal(input.costImpact);
  if (input.decision !== undefined) updateData.decision = input.decision;

  const entry = await prisma.scopeCreepEntry.update({
    where: { id: entryId },
    data: updateData,
  });

  return { data: serializeEntry(entry) };
}

export async function deleteScopeCreep(
  projectId: number,
  entryId: number,
  user: AuthUser,
): Promise<void> {
  await verifyProjectAccess(projectId, user);

  const existing = await prisma.scopeCreepEntry.findFirst({
    where: { id: entryId, projectId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Scope creep entry not found');
  }

  await prisma.scopeCreepEntry.delete({ where: { id: entryId } });
}
