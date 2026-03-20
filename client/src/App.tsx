import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, getRoleDashboard } from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { ROUTES } from './config/routes';
import { AuthLayout, DashboardLayout } from './components/layout';
import { ToastProvider, ErrorBoundary, SkipLinks, LoadingSpinner } from './components/shared';
import '@progress/kendo-theme-default/dist/all.css';
import './styles/tokens.css';
import './styles/buttons.css';
import './styles/breakpoints.css';

// Route-level code splitting
const LoginPage = lazy(() => import('./features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })));
const ProjectListPage = lazy(() => import('./features/projects/components/ProjectListPage').then(m => ({ default: m.ProjectListPage })));
const ProjectDetailPage = lazy(() => import('./features/projects/components/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const CreateProjectPage = lazy(() => import('./features/projects/components/CreateProjectPage').then(m => ({ default: m.CreateProjectPage })));
const EditProjectPage = lazy(() => import('./features/projects/components/EditProjectPage').then(m => ({ default: m.EditProjectPage })));
const PMDashboardPage = lazy(() => import('./features/dashboard/components/PmDashboardPage').then(m => ({ default: m.PMDashboardPage })));

const placeholderStyle = { padding: '24px' } as const;

function Portfolio() {
  return <div style={placeholderStyle}><h1>BU Head Portfolio</h1><p>Coming in PRT-33</p></div>;
}
function CommandCenter() {
  return <div style={placeholderStyle}><h1>CFO Command Center</h1><p>Coming in PRT-44</p></div>;
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
              <Suspense fallback={<LoadingSpinner />}>
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
                    <PMDashboardPage />
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
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
