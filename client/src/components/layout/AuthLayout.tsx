import { Outlet } from 'react-router-dom';

/**
 * Layout for unauthenticated pages (login).
 * No sidebar, full-width centered content.
 */
export function AuthLayout() {
  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  );
}
