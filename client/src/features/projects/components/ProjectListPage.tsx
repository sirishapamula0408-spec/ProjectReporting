import { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@progress/kendo-react-buttons';
import { useProjects } from '../hooks/useProjects';
import { SkeletonLoader } from '../../../components/shared';
import { ROUTES } from '../../../config/routes';
import './ProjectListPage.css';

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bg: string; color: string }> = {
  PROPOSAL: { label: 'Proposal', dotColor: 'var(--color-primary)', bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { label: 'Active', dotColor: 'var(--color-green)', bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { label: 'On Hold', dotColor: 'var(--color-amber)', bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { label: 'Completed', dotColor: 'var(--color-gray-500)', bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { label: 'Closed', dotColor: 'var(--color-gray-400)', bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

const ICON_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const TABS = ['All', 'Active', 'On Hold', 'Completed'] as const;

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  return `Updated ${Math.floor(hrs / 24)}d ago`;
}

const skeletonMarginStyle = { marginTop: 24 } as const;

export function ProjectListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useProjects();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');

  const projects = data?.data ?? [];

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab !== 'All') {
      const statusKey = activeTab === 'On Hold' ? 'ON_HOLD' : activeTab.toUpperCase();
      list = list.filter((p: Record<string, unknown>) => p.status === statusKey);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: Record<string, unknown>) =>
        (p.name as string).toLowerCase().includes(q) ||
        (p.client as string).toLowerCase().includes(q) ||
        ((p.manager as Record<string, unknown>)?.displayName as string || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, activeTab, search]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  if (isLoading) {
    return (
      <div className="pf-list">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={skeletonMarginStyle}><SkeletonLoader type="grid" count={5} /></div>
      </div>
    );
  }

  return (
    <div className="pf-list">
      {/* Header */}
      <div className="pf-list__header">
        <div>
          <h1 className="pf-list__title">Project Portfolio</h1>
          <p className="pf-list__subtitle">Monitor progress and health across all organizational projects.</p>
        </div>
        <Button themeColor="primary" className="pf-list__new-btn" onClick={() => navigate(ROUTES.PROJECT_NEW)}>
          + New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="pf-list__filters">
        <div className="pf-list__tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`pf-list__tab ${activeTab === tab ? 'pf-list__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="pf-list__search-row">
          <div className="pf-list__search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="text"
              placeholder="Filter by client or manager..."
              value={search}
              onChange={handleSearch}
              className="pf-list__search-input"
            />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="pf-list__table-header">
        <span className="pf-list__col pf-list__col--name">PROJECT NAME</span>
        <span className="pf-list__col pf-list__col--code">CODE</span>
        <span className="pf-list__col pf-list__col--client">CLIENT</span>
        <span className="pf-list__col pf-list__col--status">STATUS</span>
        <span className="pf-list__col pf-list__col--manager">MANAGER</span>
        <span className="pf-list__col pf-list__col--actions">ACTIONS</span>
      </div>

      {/* Project Rows */}
      {filteredProjects.length === 0 ? (
        <div className="pf-list__empty">
          <h3>No projects found</h3>
          <p>{search ? 'Try a different search term.' : 'Click "+ New Project" to create your first project.'}</p>
        </div>
      ) : (
        <div className="pf-list__rows">
          {filteredProjects.map((p: Record<string, unknown>, idx: number) => {
            const status = STATUS_CONFIG[(p.status as string)] || STATUS_CONFIG.PROPOSAL;
            const manager = p.manager as Record<string, unknown> | undefined;
            const managerName = (manager?.displayName as string) || 'Unassigned';
            const iconColor = ICON_COLORS[idx % ICON_COLORS.length];
            const initial = (p.name as string).charAt(0).toUpperCase();

            return (
              <Link
                key={p.id as number}
                to={`/projects/${p.id}`}
                className="pf-list__row"
              >
                <div className="pf-list__col pf-list__col--name">
                  <div className="pf-list__project-icon" style={{ background: iconColor }}>
                    {initial}
                  </div>
                  <div className="pf-list__project-info">
                    <span className="pf-list__project-name">{p.name as string}</span>
                    <span className="pf-list__project-updated">
                      {p.updatedAt ? getRelativeTime(p.updatedAt as string) : ''}
                    </span>
                  </div>
                </div>
                <div className="pf-list__col pf-list__col--code">
                  <span className="pf-list__code">{p.code as string}</span>
                </div>
                <div className="pf-list__col pf-list__col--client">{p.client as string}</div>
                <div className="pf-list__col pf-list__col--status">
                  <span className="pf-list__status-badge" style={{ background: status.bg, color: status.color }}>
                    <span className="pf-list__status-dot" style={{ background: status.dotColor }} />
                    {status.label}
                  </span>
                </div>
                <div className="pf-list__col pf-list__col--manager">
                  <div className="pf-list__manager-avatar">
                    {managerName.charAt(0).toUpperCase()}
                  </div>
                  <span>{managerName}</span>
                </div>
                <div className="pf-list__col pf-list__col--actions">
                  <button className="pf-list__menu-btn" onClick={(e) => e.preventDefault()}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-gray-400)">
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="pf-list__pagination">
          <span className="pf-list__showing">
            Showing 1-{filteredProjects.length} of {filteredProjects.length} projects
          </span>
        </div>
      )}
    </div>
  );
}
