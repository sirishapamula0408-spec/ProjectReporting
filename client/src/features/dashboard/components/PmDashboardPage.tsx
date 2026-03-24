import { Link } from 'react-router-dom';
import { Button } from '@progress/kendo-react-buttons';
import { usePMDashboard } from '../hooks/useDashboard';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR, formatINRCompact } from '../../../config/constants';
import './PMDashboardPage.css';

const RAG_ORDER: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PMDashboardPage() {
  const { data, isLoading } = usePMDashboard();

  if (isLoading) {
    return (
      <div className="pgm-dash">
        <SkeletonLoader type="kpi-row" count={4} />
        <SkeletonLoader type="grid" count={5} />
      </div>
    );
  }

  const kpis = data?.kpis ?? { totalActiveProjects: 0, projectsAtRisk: 0, totalBurnRate: '0' };
  const projects: Array<Record<string, unknown>> = data?.projects ?? [];

  const sortedProjects = [...projects].sort((a, b) => {
    const aO = a.healthRag ? (RAG_ORDER[a.healthRag as string] ?? 3) : 4;
    const bO = b.healthRag ? (RAG_ORDER[b.healthRag as string] ?? 3) : 4;
    return aO - bO;
  });

  const totalManaged = projects.length;
  const atRisk = kpis.projectsAtRisk ?? 0;
  const burnRate = kpis.totalBurnRate ?? '0';

  return (
    <div className="pgm-dash">
      {/* Header */}
      <div className="pgm-dash__header">
        <div>
          <h1 className="pgm-dash__title">Project Portfolio</h1>
          <p className="pgm-dash__subtitle">Real-time status of all active projects under your management.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/projects/new">
            <Button themeColor="primary">+ Create New Project</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="pgm-dash__kpi-row">
        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">Total Managed</span>
          </div>
          <div className="pgm-dash__kpi-value">
            {totalManaged}
            {totalManaged > 0 && <span className="pgm-dash__kpi-trend" style={{ fontSize: 'var(--text-xs)', marginLeft: '8px' }}>+{totalManaged}</span>}
          </div>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">At Risk (R/A)</span>
          </div>
          <div className="pgm-dash__kpi-value">
            {atRisk as number}
            {(atRisk as number) > 0 && <span style={{ fontSize: 'var(--text-xs)', marginLeft: '8px', color: 'var(--text-negative)' }}>Action Needed</span>}
          </div>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">Monthly Burn Rate</span>
          </div>
          <div className="pgm-dash__kpi-value">{formatINRCompact(burnRate)}<span className="pgm-dash__kpi-unit">/mo</span></div>
          <p className="pgm-dash__kpi-desc">vs budget target</p>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">Resource Utilization</span>
          </div>
          <div className="pgm-dash__kpi-value">
            92%
            <span style={{ fontSize: 'var(--text-xs)', marginLeft: '8px', color: 'var(--text-positive)' }}>Optimized</span>
          </div>
          <div className="pgm-dash__kpi-progress">
            <div className="pgm-dash__kpi-progress-fill" style={{ width: '92%' }} />
          </div>
        </div>
      </div>

      {/* Main Content: two columns */}
      <div className="pgm-dash__body">
        {/* Left: Active Projects + Chart */}
        <div className="pgm-dash__main">
          {/* Active Projects */}
          <div className="pgm-dash__section">
            <div className="pgm-dash__section-header">
              <h2 className="pgm-dash__section-title">Active Projects</h2>
              <Link to="/projects" className="pgm-dash__view-all">View All Projects</Link>
            </div>

            {sortedProjects.length === 0 ? (
              <div className="pgm-dash__empty">
                <h3>No projects yet</h3>
                <p>Create your first project to get started.</p>
              </div>
            ) : (
              <table className="pgm-dash__table">
                <thead>
                  <tr>
                    <th>PROJECT DETAILS</th>
                    <th>HEALTH (RAG)</th>
                    <th>CURRENT BURN</th>
                    <th>TIMELINE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.slice(0, 5).map((p) => {
                    const rag = p.healthRag as string | null;
                    const ragLower = rag ? rag.toLowerCase() : 'none';
                    const ragLabel = rag === 'GREEN' ? 'On Track' : rag === 'AMBER' ? 'At Risk' : rag === 'RED' ? 'Critical' : '—';
                    const budget = typeof p.budgetUsedPercent === 'number' ? p.budgetUsedPercent : 0;
                    return (
                      <tr key={p.id as number}>
                        <td>
                          <Link to={`/projects/${p.id}`} className="pgm-dash__project-link">
                            <span className="pgm-dash__project-name">{p.name as string}</span>
                            <span className="pgm-dash__project-sub">Client: {p.client as string || '—'} · ID: #{p.projectCode as string || `PPM-${p.id}`}</span>
                          </Link>
                        </td>
                        <td>
                          <span className={`pgm-dash__health-badge pgm-dash__health-badge--${ragLower}`}>
                            <span className={`pgm-dash__health-dot pgm-dash__health-dot--${ragLower}`} />
                            {ragLabel}
                          </span>
                        </td>
                        <td className="pgm-dash__burn-cell">
                          {formatINR(p.contractValue as string)}
                        </td>
                        <td>
                          <div className="pgm-dash__timeline">
                            <div className="pgm-dash__timeline-bar">
                              <div className="pgm-dash__timeline-fill" style={{ width: `${Math.min(budget, 100)}%` }} />
                            </div>
                            <span className="pgm-dash__timeline-pct">{budget.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>
                          <Link to={`/projects/${p.id}`} className="pgm-dash__chevron">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4" /></svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {sortedProjects.length > 5 && (
              <p className="pgm-dash__showing">Showing 5 of {sortedProjects.length} projects</p>
            )}
          </div>

          {/* Budget Variance Analysis placeholder */}
          <div className="pgm-dash__section">
            <div className="pgm-dash__section-header">
              <div>
                <h2 className="pgm-dash__section-title">Budget Variance Analysis</h2>
                <p className="pgm-dash__section-sub">Variance tracking vs initial baseline across portfolio</p>
              </div>
              <div className="pgm-dash__toggle-group">
                <Button fillMode="flat" className="pgm-dash__toggle pgm-dash__toggle--active">Monthly</Button>
                <Button fillMode="flat" className="pgm-dash__toggle">Quarterly</Button>
              </div>
            </div>
            <div className="pgm-dash__chart-placeholder">
              <p>Chart data will appear when cost entries are available</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panels */}
        <div className="pgm-dash__side">
          {/* Urgent Actions */}
          <div className="pgm-dash__panel">
            <h3 className="pgm-dash__panel-title">
              <span className="pgm-dash__panel-icon pgm-dash__panel-icon--urgent">!</span>
              URGENT ACTIONS
            </h3>
            <div className="pgm-dash__action-card pgm-dash__action-card--amber">
              <strong>Review Budget Variance</strong>
              <span>Requested 2h ago · Finance Team</span>
            </div>
            <div className="pgm-dash__action-card pgm-dash__action-card--amber">
              <strong>Approve Resource Allocation</strong>
              <span>Due in 24h · Compliance</span>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="pgm-dash__panel">
            <h3 className="pgm-dash__panel-title">
              <span className="pgm-dash__panel-icon">📅</span>
              UPCOMING MILESTONES
            </h3>
            <div className="pgm-dash__milestone">
              <div className="pgm-dash__milestone-date">
                <span className="pgm-dash__milestone-month">MAR</span>
                <span className="pgm-dash__milestone-day">25</span>
              </div>
              <div className="pgm-dash__milestone-info">
                <strong>Architecture Freeze</strong>
                <span>Cloud Migration Alpha</span>
              </div>
            </div>
            <div className="pgm-dash__milestone">
              <div className="pgm-dash__milestone-date">
                <span className="pgm-dash__milestone-month">MAR</span>
                <span className="pgm-dash__milestone-day">31</span>
              </div>
              <div className="pgm-dash__milestone-info">
                <strong>UAT Commencement</strong>
                <span>Project Portfolio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
