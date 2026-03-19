import type { Role } from '@prisma/client';

/**
 * Represents the authenticated user context for data scoping.
 * Used by service layer to filter data based on role (NFR7).
 */
export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  businessUnit: string | null;
  displayName: string;
}

/**
 * Builds a Prisma `where` clause for project queries based on user role.
 *
 * - PM: sees only projects where manager_id = user.id (FR35)
 * - BU_HEAD: sees projects in their business_unit (FR36)
 * - CFO: sees all projects, no filtering (FR37)
 */
export function getProjectScope(user: AuthUser): Record<string, unknown> {
  switch (user.role) {
    case 'PM':
      return { managerId: user.id };
    case 'BU_HEAD':
      return { businessUnit: user.businessUnit };
    case 'CFO':
      return {};
    default:
      return { managerId: user.id }; // Fallback: most restrictive
  }
}

/**
 * Checks if a user can access a specific project.
 * Used for single-project operations (GET/PUT by id).
 */
export function canAccessProject(
  user: AuthUser,
  project: { managerId: number; businessUnit: string },
): boolean {
  switch (user.role) {
    case 'PM':
      return project.managerId === user.id;
    case 'BU_HEAD':
      return project.businessUnit === user.businessUnit;
    case 'CFO':
      return true;
    default:
      return false;
  }
}

/**
 * Checks if a user can modify (write to) a project.
 * Only PMs who manage the project can modify it.
 * BU_HEAD and CFO have read-only access to project data
 * (except review notes for BU_HEAD/CFO).
 */
export function canModifyProject(
  user: AuthUser,
  project: { managerId: number },
): boolean {
  return user.role === 'PM' && project.managerId === user.id;
}
