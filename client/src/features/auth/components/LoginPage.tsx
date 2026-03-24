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
  username: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

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
      const user = await login(data.username, data.password, keepSignedIn);
      navigate(getRoleDashboard(user.role as Role), { replace: true });
    } catch {
      setError('Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left Brand Panel ── */}
      <div className="login-brand-panel">
        <div className="login-brand-panel__content">
          <div className="login-brand-panel__logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="rgba(255,255,255,0.2)" />
              <rect x="8" y="15" width="5" height="13" rx="1.5" fill="white" />
              <rect x="15.5" y="11" width="5" height="17" rx="1.5" fill="white" />
              <rect x="23" y="7" width="5" height="21" rx="1.5" fill="white" />
            </svg>
            <span className="login-brand-panel__name">ProjectReporting</span>
          </div>

          <div className="login-brand-panel__hero">
            <h2 className="login-brand-panel__division">ECM DIVISION</h2>
            <p className="login-brand-panel__division-sub">PROJECT FINANCIAL INTELLIGENCE</p>
            <h1 className="login-brand-panel__headline">
              Financial tracking, simplified.
            </h1>
          </div>

          <div className="login-brand-panel__features">
            <div className="login-brand-panel__feature-card">
              <span className="login-brand-panel__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M6 20h12" />
                </svg>
              </span>
              <span>Real-time cost &amp; burn tracking</span>
            </div>
            <div className="login-brand-panel__feature-card">
              <span className="login-brand-panel__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                  <circle cx="9" cy="7" r="3" />
                  <circle cx="17" cy="7" r="2" />
                  <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  <path d="M19 16c0-1.7-1-3.2-2.5-4" />
                </svg>
              </span>
              <span>Resource allocation &amp; loaded costs</span>
            </div>
            <div className="login-brand-panel__feature-card">
              <span className="login-brand-panel__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                  <path d="M3 17l4-4 4 4 4-8 6 6" />
                  <path d="M21 7v4h-4" />
                </svg>
              </span>
              <span>Forward-looking margin forecasting</span>
            </div>
          </div>
        </div>

        <div className="login-brand-panel__footer">
          <span>&copy; 2026 PROJECTREPORTING ENTERPRISE. ALL RIGHTS RESERVED.</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-panel__content">
          <h2 className="login-form-panel__title">
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="login-form-panel__subtitle">
            {activeTab === 'login'
              ? 'Sign in to continue to your workspace.'
              : 'Enter your details to get started.'}
          </p>

          {/* Tab toggle */}
          <div className="login-tabs">
            <Button
              fillMode="flat"
              className={`login-tabs__tab ${activeTab === 'login' ? 'login-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab('login')}
              type="button"
            >
              LOG IN
            </Button>
            <Button
              fillMode="flat"
              className={`login-tabs__tab ${activeTab === 'signup' ? 'login-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab('signup')}
              type="button"
            >
              SIGN UP
            </Button>
          </div>

          {activeTab === 'signup' ? (
            <div className="login-form">
              <div className="login-field">
                <label className="login-label">FULL NAME</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                      <circle cx="8" cy="5" r="3" />
                      <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                    </svg>
                  </span>
                  <Input placeholder="John Doe" className="login-input login-input--with-icon" disabled />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">EMAIL ADDRESS</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                      <rect x="1" y="3" width="14" height="10" rx="2" />
                      <path d="M1 5l7 4 7-4" />
                    </svg>
                  </span>
                  <Input placeholder="name@company.com" className="login-input login-input--with-icon" disabled />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">PASSWORD</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                      <rect x="3" y="7" width="10" height="8" rx="2" />
                      <path d="M5 7V5a3 3 0 016 0v2" />
                    </svg>
                  </span>
                  <Input type="password" placeholder="Create a password" className="login-input login-input--with-icon" disabled />
                </div>
              </div>
              <Button themeColor="primary" size="large" className="login-button" disabled>
                Sign Up →
              </Button>
              <p className="login-signup-note">Contact your administrator for account creation.</p>
            </div>
          ) : (

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="login-field">
              <label className="login-label" htmlFor="username">
                USERNAME
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  </svg>
                </span>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="username"
                      placeholder="priya.sharma"
                      value={field.value}
                      onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                      onBlur={field.onBlur}
                      valid={!errors.username}
                      autoComplete="username"
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
                  PASSWORD
                </label>
                <span className="login-forgot-link">
                  CONTACT ADMIN TO RESET
                </span>
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={field.value}
                      onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                      onBlur={field.onBlur}
                      valid={!errors.password}
                      autoComplete="current-password"
                      className="login-input login-input--with-icon login-input--with-suffix"
                    />
                  )}
                />
                <Button
                  type="button"
                  fillMode="flat"
                  className="login-input-suffix"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
                    {showPassword ? (
                      <>
                        <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
                        <circle cx="9" cy="9" r="2.5" />
                        <path d="M3 15L15 3" />
                      </>
                    ) : (
                      <>
                        <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
                        <circle cx="9" cy="9" r="2.5" />
                      </>
                    )}
                  </svg>
                </Button>
              </div>
              {errors.password && <span className="login-error">{errors.password.message}</span>}
            </div>

            <div className="login-keep-signed-in">
              <Checkbox
                label="KEEP ME SIGNED IN"
                value={keepSignedIn}
                onChange={(e: CheckboxChangeEvent) => setKeepSignedIn(e.value ?? false)}
              />
            </div>

            <div aria-live="polite" role="alert">
              {error && <div className="login-error-message">{error}</div>}
            </div>

            <Button
              type="submit"
              themeColor="primary"
              size="large"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log In  →'}
            </Button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
