import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, getRoleDashboard } from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { ROUTES } from './config/routes';
import { LoginPage } from './features/auth';
import '@progress/kendo-theme-default/dist/all.css';
import './styles/tokens.css';

// Placeholder pages — will be replaced in later stories
function PMDashboard() {
  return <div>PM Dashboard</div>;
}
function Portfolio() {
  return <div>BU Head Portfolio</div>;
}
function CommandCenter() {
  return <div>CFO Command Center</div>;
}

/** Redirects authenticated users to their role-appropriate dashboard */
function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={getRoleDashboard(user.role as 'PM' | 'BU_HEAD' | 'CFO')} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />

            {/* Role redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* PM routes */}
            <Route
              path={ROUTES.PM_DASHBOARD}
              element={
                <PrivateRoute allowedRoles={['PM']}>
                  <PMDashboard />
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
