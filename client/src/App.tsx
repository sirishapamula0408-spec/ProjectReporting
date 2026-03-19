import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, getRoleDashboard } from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { ROUTES } from './config/routes';
import { LoginPage } from './features/auth';
import { CreateProjectPage, EditProjectPage, ProjectListPage, ProjectDetailPage } from './features/projects';
import { AuthLayout, DashboardLayout } from './components/layout';
import { ToastProvider, ErrorBoundary, SkipLinks } from './components/shared';
import '@progress/kendo-theme-default/dist/all.css';
import './styles/tokens.css';
import './styles/buttons.css';
import './styles/breakpoints.css';

// Placeholder pages — will be replaced in later stories
function PMDashboard() {
  return <div style={{ padding: '24px' }}><h1>PM Dashboard</h1><p>Coming in PRT-30/31</p></div>;
}
function Portfolio() {
  return <div style={{ padding: '24px' }}><h1>BU Head Portfolio</h1><p>Coming in PRT-33</p></div>;
}
function CommandCenter() {
  return <div style={{ padding: '24px' }}><h1>CFO Command Center</h1><p>Coming in PRT-44</p></div>;
}

/** Redirects authenticated users to their role-appropriate dashboard */
function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={getRoleDashboard(user.role as 'PM' | 'BU_HEAD' | 'CFO')} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <SkipLinks />
            <AuthProvider>
              <Routes>
            {/* Public — Auth layout (no sidebar) */}
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Role redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Authenticated — Dashboard layout (with sidebar) */}
            <Route
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              {/* PM routes */}
              <Route
                path={ROUTES.PM_DASHBOARD}
                element={
                  <PrivateRoute allowedRoles={['PM']}>
                    <PMDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path={ROUTES.PROJECTS}
                element={
                  <PrivateRoute allowedRoles={['PM', 'BU_HEAD', 'CFO']}>
                    <ProjectListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path={ROUTES.PROJECT_NEW}
                element={
                  <PrivateRoute allowedRoles={['PM']}>
                    <CreateProjectPage />
                  </PrivateRoute>
                }
              />
              <Route
                path={ROUTES.PROJECT_DETAIL}
                element={
                  <PrivateRoute allowedRoles={['PM', 'BU_HEAD', 'CFO']}>
                    <ProjectDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path={ROUTES.PROJECT_EDIT}
                element={
                  <PrivateRoute allowedRoles={['PM']}>
                    <EditProjectPage />
                  </PrivateRoute>
                }
              />

              {/* BU Head routes */}
              <Route
                path={ROUTES.PORTFOLIO}
                element={
                  <PrivateRoute allowedRoles={['BU_HEAD', 'CFO']}>
                    <Portfolio />
                  </PrivateRoute>
                }
              />

              {/* CFO routes */}
              <Route
                path={ROUTES.COMMAND_CENTER}
                element={
                  <PrivateRoute allowedRoles={['CFO']}>
                    <CommandCenter />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
