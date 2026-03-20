import { useState, useCallback, useEffect } from 'react';
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
  placeholder?: boolean;
}

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="7" height="7" rx="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" />
  </svg>
);

const ProjectsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="16" height="13" rx="2" />
    <path d="M7 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
    <path d="M2 9h16" />
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

const FinancialsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2v16" />
    <path d="M14 5H8.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H6" />
  </svg>
);

const RisksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3L2 17h16L10 3z" />
    <path d="M10 8v4" />
    <circle cx="10" cy="14" r="0.5" fill="currentColor" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="2" width="14" height="16" rx="2" />
    <path d="M7 6h6" />
    <path d="M7 10h6" />
    <path d="M7 14h3" />
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

const NewEntryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 3v12M3 9h12" />
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="9" r="7.5" />
    <path d="M6.5 6.5a2.5 2.5 0 014.5 1.5c0 1.5-2 2-2 3.5" />
    <circle cx="9" cy="14" r="0.5" fill="currentColor" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 15H3a1 1 0 01-1-1V4a1 1 0 011-1h3" />
    <path d="M11 12l4-3-4-3" />
    <path d="M15 9H7" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3l5 5-5 5" />
  </svg>
);

const STORAGE_KEY = 'prt-sidebar-collapsed';

const NAV_ITEMS: Record<Role, NavItem[]> = {
  PM: [
    { path: ROUTES.PM_DASHBOARD, label: 'Dashboard', iconSvg: <DashboardIcon /> },
    { path: ROUTES.PROJECTS, label: 'Projects', iconSvg: <ProjectsIcon /> },
    { path: ROUTES.TEAM_REGISTRY, label: 'Team', iconSvg: <TeamIcon /> },
    { path: '#financials', label: 'Financials', iconSvg: <FinancialsIcon />, placeholder: true },
    { path: '#risks', label: 'Risks', iconSvg: <RisksIcon />, placeholder: true },
    { path: '#reports', label: 'Reports', iconSvg: <ReportsIcon />, placeholder: true },
  ],
  BU_HEAD: [
    { path: ROUTES.PORTFOLIO, label: 'Portfolio', iconSvg: <PortfolioIcon /> },
    { path: ROUTES.PROJECTS, label: 'All Projects', iconSvg: <DashboardIcon /> },
    { path: '#financials', label: 'Financials', iconSvg: <FinancialsIcon />, placeholder: true },
    { path: '#reports', label: 'Reports', iconSvg: <ReportsIcon />, placeholder: true },
  ],
  CFO: [
    { path: ROUTES.COMMAND_CENTER, label: 'Command Center', iconSvg: <CommandIcon /> },
    { path: ROUTES.PORTFOLIO, label: 'Portfolio', iconSvg: <PortfolioIcon /> },
    { path: '#financials', label: 'Financials', iconSvg: <FinancialsIcon />, placeholder: true },
    { path: '#reports', label: 'Reports', iconSvg: <ReportsIcon />, placeholder: true },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); }
    catch { /* ignore */ }
    document.documentElement.style.setProperty(
      '--sidebar-current-width',
      collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
    );
  }, [collapsed]);

  const handleToggle = useCallback(() => setCollapsed((prev) => !prev), []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role as Role] || [];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} id="sidebar-nav">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
            <rect x="8" y="14" width="4" height="10" rx="1" fill="white" />
            <rect x="14" y="10" width="4" height="14" rx="1" fill="white" />
            <rect x="20" y="6" width="4" height="18" rx="1" fill="white" />
          </svg>
        </div>
        {!collapsed && <span className="sidebar__brand-name">ProjectReporting</span>}
      </div>

      {/* Toggle */}
      <button
        className="sidebar__toggle"
        onClick={handleToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ExpandIcon /> : <CollapseIcon />}
      </button>

      {/* Menu Label */}
      {!collapsed && (
        <div className="sidebar__menu-header">
          <span className="sidebar__menu-label">MAIN MENU</span>
          <span className="sidebar__menu-subtitle">Enterprise Suite</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) =>
          item.placeholder ? (
            <span
              key={item.path}
              className="sidebar__link sidebar__link--placeholder"
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar__link-icon">{item.iconSvg}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </span>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar__link-icon">{item.iconSvg}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* New Entry Button */}
      <div className="sidebar__action">
        <Button
          themeColor="primary"
          className="sidebar__new-btn"
          onClick={() => navigate(ROUTES.PROJECT_NEW)}
          title={collapsed ? 'New Entry' : undefined}
        >
          <NewEntryIcon />
          {!collapsed && <span>New Entry</span>}
        </Button>
      </div>

      {/* Bottom links */}
      <div className="sidebar__bottom-links">
        <button
          className="sidebar__bottom-link"
          title={collapsed ? 'Help Center' : undefined}
          onClick={() => { /* placeholder */ }}
        >
          <HelpIcon />
          {!collapsed && <span>Help Center</span>}
        </button>
        <button
          className="sidebar__bottom-link sidebar__bottom-link--logout"
          onClick={handleLogout}
          title={collapsed ? 'Log Out' : undefined}
        >
          <LogOutIcon />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* User info */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.displayName}</span>
              <span className="sidebar__user-role">
                {{ PM: 'Project Manager', BU_HEAD: 'BU Head', CFO: 'CFO' }[user.role as string] ?? user.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
