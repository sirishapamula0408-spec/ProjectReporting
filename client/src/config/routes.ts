/**
 * Route path constants — single source of truth for all routes.
 */
export const ROUTES = {
  LOGIN: '/login',

  // PM routes
  PM_DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_NEW: '/projects/new',
  PROJECT_EDIT: '/projects/:id/edit',
  TEAM_REGISTRY: '/team-registry',

  // BU Head routes
  PORTFOLIO: '/portfolio',

  // CFO routes
  COMMAND_CENTER: '/command-center',
} as const;
