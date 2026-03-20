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
      {/* ── Left Brand Panel ── */}
      <div className="login-brand-panel">
        <div className="login-brand-panel__content">
          <div className="login-brand-panel__logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.2)" />
              <rect x="9" y="17" width="5" height="14" rx="1.5" fill="white" />
              <rect x="17.5" y="12" width="5" height="19" rx="1.5" fill="white" />
              <rect x="26" y="7" width="5" height="24" rx="1.5" fill="white" />
            </svg>
            <span className="login-brand-panel__name">ProjectReporting</span>
          </div>

          <h1 className="login-brand-panel__headline">
            Enterprise Project<br />
            Financial Intelligence
          </h1>

          <p className="login-brand-panel__tagline">
            Gain full visibility into your global project portfolio with
            real-time financial tracking and predictive analytics.
          </p>
        </div>

        <div className="login-brand-panel__footer">
          <span>ENTERPRISE V4.2.0</span>
          <span>ISO 27001 CERTIFIED</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-panel__content">
          <h2 className="login-form-panel__title">Sign In</h2>
          <p className="login-form-panel__subtitle">
            Enter your corporate credentials to access the portal.
          </p>

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

          {/* SSO Section */}
          <div className="login-sso">
            <div className="login-sso__divider">
              <span>OR CONTINUE WITH SSO</span>
            </div>
            <div className="login-sso__buttons">
              <button type="button" className="login-sso__btn" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#1a73e8" strokeWidth="1.5" />
                </svg>
                Okta
              </button>
              <button type="button" className="login-sso__btn" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" fill="#f25022" />
                  <rect x="9" y="1" width="6" height="6" fill="#7fba00" />
                  <rect x="1" y="9" width="6" height="6" fill="#00a4ef" />
                  <rect x="9" y="9" width="6" height="6" fill="#ffb900" />
                </svg>
                Azure AD
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="login-security-notice">
            <div className="login-security-notice__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                <path d="M10 1L3 5v4c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V5L10 1z" />
                <path d="M7 10l2 2 4-4" />
              </svg>
            </div>
            <div className="login-security-notice__text">
              <strong>Security Notice:</strong> Secure internal application. All activities are
              logged and monitored. Unauthorized access is strictly prohibited.
            </div>
          </div>

          {/* Footer */}
          <div className="login-form-footer">
            <div className="login-form-footer__links">
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a>
            </div>
            <p className="login-form-footer__copyright">
              &copy; 2024 ProjectReporting Enterprise Solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
