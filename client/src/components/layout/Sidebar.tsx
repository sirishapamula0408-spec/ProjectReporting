import { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@progress/kendo-react-buttons';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import type { Role } from '@prt/shared';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  iconSvg: React.ReactNode;
}

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="7" height="7" rx="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" />
  </svg>
);

const FinancialsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2v16M6 6l4-4 4 4M4 10h12M4 14h12M7 18h6" />
  </svg>
);

const TeamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="6" r="3" />
    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="16" cy="6" r="2" />
    <path d="M18 15c0-2-1.3-3.7-3-4.5" />
  </svg>
);

const RisksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2L18 17H2L10 2z" />
    <path d="M10 8v4M10 14v1" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="2" width="14" height="16" rx="2" />
    <path d="M7 6h6M7 10h6M7 14h3" />
  </svg>
);

const PortfolioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="16" height="13" rx="2" />
    <path d="M7 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
    <path d="M2 9h16" />
  </svg>
);

const CommandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v4l3 2" />
  </svg>
);

const NewProjectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v8M6 10h8" />
  </svg>
);

const NAV_ITEMS: Record<Role, NavItem[]> = {
  PM: [
    { path: ROUTES.PM_DASHBOARD, label: 'Dashboard', iconSvg: <DashboardIcon /> },
    { path: ROUTES.PROJECTS, label: 'Projects', iconSvg: <PortfolioIcon /> },
    { path: ROUTES.TEAM_REGISTRY, label: 'Team', iconSvg: <TeamIcon /> },
  ],
  BU_HEAD: [
    { path: ROUTES.PORTFOLIO, label: 'Portfolio', iconSvg: <PortfolioIcon /> },
    { path: ROUTES.PROJECTS, label: 'All Projects', iconSvg: <DashboardIcon /> },
  ],
  CFO: [
    { path: ROUTES.COMMAND_CENTER, label: 'Command Center', iconSvg: <CommandIcon /> },
    { path: ROUTES.PORTFOLIO, label: 'Portfolio', iconSvg: <PortfolioIcon /> },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role as Role] || [];

  return (
    <aside className="sidebar" id="sidebar-nav">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="white" />
            <rect x="8" y="14" width="4" height="10" rx="1" fill="var(--color-primary)" />
            <rect x="14" y="10" width="4" height="14" rx="1" fill="var(--color-primary)" />
            <rect x="20" y="6" width="4" height="18" rx="1" fill="var(--color-primary)" />
          </svg>
        </div>
        <span className="sidebar__brand-name">ProjectReporting</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{item.iconSvg}</span>
            <span className="sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* New Project Button (PM only) */}
      {user.role === 'PM' && (
        <div className="sidebar__action">
          <Button
            themeColor="light"
            className="sidebar__new-btn"
            onClick={() => navigate(ROUTES.PROJECT_NEW)}
          >
            <NewProjectIcon />
            <span>New Project</span>
          </Button>
        </div>
      )}

      {/* User info + Logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user.displayName}</span>
            <span className="sidebar__user-role">
              {user.role === 'PM' ? 'Project Manager' : user.role === 'BU_HEAD' ? 'BU Head' : 'CFO'}
            </span>
          </div>
        </div>
        <Button
          fillMode="flat"
          size="small"
          className="sidebar__logout"
          onClick={handleLogout}
          title="Logout"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
