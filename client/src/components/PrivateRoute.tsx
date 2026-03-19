import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../config/routes';
import type { Role } from '@prt/shared';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

/**
 * Route guard that checks authentication and optional role-based access.
 * Redirects to login if not authenticated.
 * Redirects to role-appropriate dashboard if role not allowed.
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as Role)) {
    // Redirect to their role-appropriate dashboard
    return <Navigate to={getRoleDashboard(user.role as Role)} replace />;
  }

  return <>{children}</>;
}

/**
 * Returns the default dashboard route for a given role.
 */
export function getRoleDashboard(role: Role): string {
  switch (role) {
    case 'PM':
      return ROUTES.PM_DASHBOARD;
    case 'BU_HEAD':
      return ROUTES.PORTFOLIO;
    case 'CFO':
      return ROUTES.COMMAND_CENTER;
    default:
      return ROUTES.PM_DASHBOARD;
  }
}
