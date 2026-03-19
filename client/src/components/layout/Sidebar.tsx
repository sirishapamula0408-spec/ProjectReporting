import { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@progress/kendo-react-buttons';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import type { Role } from '@prt/shared';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  PM: [
    { path: ROUTES.PM_DASHBOARD, label: 'My Projects', icon: '📊' },
    { path: ROUTES.TEAM_REGISTRY, label: 'Team Registry', icon: '👥' },
    { path: ROUTES.PROJECT_NEW, label: 'New Project', icon: '➕' },
  ],
  BU_HEAD: [
    { path: ROUTES.PORTFOLIO, label: 'Portfolio', icon: '📁' },
    { path: ROUTES.PROJECTS, label: 'All Projects', icon: '📋' },
  ],
  CFO: [
    { path: ROUTES.COMMAND_CENTER, label: 'Command Center', icon: '🎯' },
    { path: ROUTES.PORTFOLIO, label: 'Portfolio Overview', icon: '📁' },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role as Role] || [];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
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
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.displayName}</span>
              <span className="sidebar__user-role">{user.role.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        <Button
          fillMode="flat"
          size="small"
          className="sidebar__logout"
          onClick={handleLogout}
          title="Logout"
        >
          {collapsed ? '🚪' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}
