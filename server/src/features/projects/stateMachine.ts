import { ProjectStatus } from '@prisma/client';
import { AppError } from '../../shared/AppError.js';

/**
 * Valid project status transitions.
 * Matches PRD: PROPOSAL→ACTIVE, ACTIVE→ON_HOLD/COMPLETED/CLOSED,
 * ON_HOLD→ACTIVE/CLOSED, COMPLETED→CLOSED, CLOSED→(none)
 */
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  PROPOSAL: [ProjectStatus.ACTIVE],
  ACTIVE: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CLOSED],
  ON_HOLD: [ProjectStatus.ACTIVE, ProjectStatus.CLOSED],
  COMPLETED: [ProjectStatus.CLOSED],
  CLOSED: [],
};

/**
 * Validates a status transition and throws AppError if invalid.
 */
export function validateTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): void {
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed || allowed.length === 0) {
    throw new AppError(
      400,
      'INVALID_TRANSITION',
      `Project in ${currentStatus} status cannot be transitioned to any other status`,
    );
  }

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      400,
      'INVALID_TRANSITION',
      `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowed.join(', ')}`,
    );
  }
}

/**
 * Returns the list of valid next statuses for a given current status.
 */
export function getValidTransitions(currentStatus: ProjectStatus): ProjectStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}
