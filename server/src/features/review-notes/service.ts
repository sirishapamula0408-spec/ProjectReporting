import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject } from '../../shared/dataScope.js';
import type { CreateReviewNoteInput } from './validation.js';

async function getProjectOrThrow(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, businessUnit: true },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Access denied');
  return project;
}

function serializeReviewNote(rn: any) {
  return {
    id: rn.id,
    projectId: rn.projectId,
    period: rn.period,
    note: rn.note,
    decision: rn.decision,
    reviewerId: rn.reviewerId,
    reviewer: rn.reviewer
      ? { id: rn.reviewer.id, displayName: rn.reviewer.displayName }
      : undefined,
    createdAt: rn.createdAt.toISOString(),
  };
}

/**
 * List review notes for a project — all roles can read.
 */
export async function listReviewNotes(projectId: number, user: AuthUser) {
  await getProjectOrThrow(projectId, user);

  const reviewNotes = await prisma.reviewNote.findMany({
    where: { projectId },
    include: {
      reviewer: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { data: reviewNotes.map(serializeReviewNote) };
}

/**
 * Create a review note — only BU_HEAD and CFO can create.
 */
export async function createReviewNote(
  projectId: number,
  input: CreateReviewNoteInput,
  user: AuthUser,
) {
  if (user.role === 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Only BU_HEAD and CFO can create review notes');
  }

  await getProjectOrThrow(projectId, user);

  const reviewNote = await prisma.reviewNote.create({
    data: {
      projectId,
      period: input.period,
      note: input.note,
      decision: input.decision ?? null,
      reviewerId: user.id,
    },
    include: {
      reviewer: {
        select: { id: true, displayName: true },
      },
    },
  });

  return { data: serializeReviewNote(reviewNote) };
}
