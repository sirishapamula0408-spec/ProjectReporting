import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Checkbox, type InputChangeEvent, type CheckboxChangeEvent } from '@progress/kendo-react-inputs';
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
  const [keepSignedIn, setKeepSignedIn] = useState(false);

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
      {/* Top Navigation Bar */}
      <header className="login-topbar">
        <div className="login-topbar__left">
          <div className="login-topbar__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
              <rect x="8" y="14" width="4" height="10" rx="1" fill="white" />
              <rect x="14" y="10" width="4" height="14" rx="1" fill="white" />
              <rect x="20" y="6" width="4" height="18" rx="1" fill="white" />
            </svg>
          </div>
          <span className="login-topbar__brand">ProjectReporting</span>
        </div>
        <div className="login-topbar__right">
          <Button themeColor="primary" fillMode="outline" size="small">
            Help
          </Button>
        </div>
      </header>

      {/* Blue accent line under topbar */}
      <div className="login-topbar__accent" />

      {/* Main content area */}
      <div className="login-content">
        <div className="login-container">
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
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                    <rect x="1" y="3" width="14" height="10" rx="2" />
                    <path d="M1 5l7 4 7-4" />
                  </svg>
                </span>
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
                      className="login-input login-input--with-icon"
                    />
                  )}
                />
              </div>
              {errors.username && <span className="login-error">{errors.username.message}</span>}
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <a href="#" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                    <rect x="3" y="7" width="10" height="8" rx="2" />
                    <path d="M5 7V5a3 3 0 016 0v2" />
                  </svg>
                </span>
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
                      className="login-input login-input--with-icon"
                    />
                  )}
                />
              </div>
              {errors.password && <span className="login-error">{errors.password.message}</span>}
            </div>

            <div className="login-keep-signed-in">
              <Checkbox
                label="Keep me signed in on this device"
                value={keepSignedIn}
                onChange={(e: CheckboxChangeEvent) => setKeepSignedIn(e.value ?? false)}
              />
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

          {/* Footer text */}
          <p className="login-footer">
            Secure internal application. All activities are logged and monitored.
          </p>
          <p className="login-copyright">&copy; 2024 ProjectReporting Enterprise Solutions.</p>
        </div>
      </div>

      {/* Bottom footer bar */}
      <footer className="login-bottom-bar">
        <div className="login-bottom-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <span className="login-bottom-divider">|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <span className="login-bottom-divider">|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Security Overview</a>
          <span className="login-bottom-divider">|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
