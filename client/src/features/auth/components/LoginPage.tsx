import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { useAuth } from '../../../context/AuthContext';
import { getRoleDashboard } from '../../../components/PrivateRoute';
import type { Role } from '@prt/shared';
import './LoginPage.css';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(data.username, data.password);
      navigate(getRoleDashboard(user.role as Role), { replace: true });
    } catch {
      setError('Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-brand">
            <div className="login-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
                <rect x="8" y="14" width="4" height="10" rx="1" fill="white" />
                <rect x="14" y="10" width="4" height="14" rx="1" fill="white" />
                <rect x="20" y="6" width="4" height="18" rx="1" fill="white" />
              </svg>
            </div>
            <span className="login-brand-name">ProjectReporting</span>
          </div>
        </div>

        {/* Hero area */}
        <div className="login-hero">
          <div className="login-hero-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--color-primary)" opacity="0.15" />
              <rect x="10" y="18" width="5" height="12" rx="1" fill="var(--color-primary)" />
              <rect x="17.5" y="14" width="5" height="16" rx="1" fill="var(--color-primary)" />
              <rect x="25" y="10" width="5" height="20" rx="1" fill="var(--color-primary)" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Internal portal for enterprise reporting and analytics</p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="login-field">
            <label className="login-label" htmlFor="username">
              Username or Email
            </label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  id="username"
                  placeholder="name@company.com"
                  value={field.value}
                  onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  valid={!errors.username}
                  className="login-input"
                />
              )}
            />
            {errors.username && <span className="login-error">{errors.username.message}</span>}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={field.value}
                  onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  valid={!errors.password}
                  className="login-input"
                />
              )}
            />
            {errors.password && <span className="login-error">{errors.password.message}</span>}
          </div>

          {error && <div className="login-error-message">{error}</div>}

          <Button
            type="submit"
            themeColor="primary"
            size="large"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          Secure internal application. All activities are logged and monitored.
        </p>
        <p className="login-copyright">© 2024 ProjectReporting Enterprise Solutions.</p>
      </div>
    </div>
  );
}
