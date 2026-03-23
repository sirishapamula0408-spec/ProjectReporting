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
          <h1 className="pgm-dash__title">Program Dashboard</h1>
          <p className="pgm-dash__subtitle">Financial year 2024 Q3 Performance Analysis</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="pgm-dash__kpi-row">
        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">TOTAL MANAGED</span>
            {totalManaged > 0 && <span className="pgm-dash__kpi-badge pgm-dash__kpi-badge--green">+{totalManaged}</span>}
          </div>
          <div className="pgm-dash__kpi-value">{totalManaged}</div>
          <p className="pgm-dash__kpi-desc">Capital investment across {totalManaged} projects</p>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">AT RISK</span>
            {(atRisk as number) > 0 && <span className="pgm-dash__kpi-badge pgm-dash__kpi-badge--red">CRITICAL</span>}
          </div>
          <div className="pgm-dash__kpi-value">{atRisk as number}</div>
          <p className="pgm-dash__kpi-desc">
            {(atRisk as number) > 0 ? 'Action required for at-risk projects' : 'No projects at risk'}
          </p>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">BURN RATE</span>
            <span className="pgm-dash__kpi-trend">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l4-4 4 4" /></svg>
            </span>
          </div>
          <div className="pgm-dash__kpi-value">{formatINRCompact(burnRate)} <span className="pgm-dash__kpi-unit">/mo</span></div>
          <p className="pgm-dash__kpi-desc">Aligned with quarterly baseline projections</p>
        </div>

        <div className="pgm-dash__kpi-card">
          <div className="pgm-dash__kpi-top">
            <span className="pgm-dash__kpi-label">UTILIZATION</span>
            <span className="pgm-dash__kpi-badge pgm-dash__kpi-badge--green">OPTIMAL</span>
          </div>
          <div className="pgm-dash__kpi-value">94.2%</div>
          <div className="pgm-dash__kpi-progress">
            <div className="pgm-dash__kpi-progress-fill" style={{ width: '94.2%' }} />
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
              <Link to="/projects" className="pgm-dash__view-all">View All Portfolio →</Link>
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
                    <th>PROJECT NAME</th>
                    <th>HEALTH</th>
                    <th>TIMELINE PROGRESS</th>
                    <th>BURN RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.slice(0, 5).map((p) => {
                    const rag = p.healthRag as string | null;
                    const budget = typeof p.budgetUsedPercent === 'number' ? p.budgetUsedPercent : 0;
                    return (
                      <tr key={p.id as number}>
                        <td>
                          <Link to={`/projects/${p.id}`} className="pgm-dash__project-link">
                            <span className="pgm-dash__project-name">{p.name as string}</span>
                            <span className="pgm-dash__project-sub">{p.client as string}</span>
                          </Link>
                        </td>
                        <td>
                          {rag ? (
                            <span className={`pgm-dash__health-dot pgm-dash__health-dot--${rag.toLowerCase()}`} />
                          ) : (
                            <span className="pgm-dash__health-dot pgm-dash__health-dot--none" />
                          )}
                        </td>
                        <td>
                          <div className="pgm-dash__timeline">
                            <div className="pgm-dash__timeline-bar">
                              <div className="pgm-dash__timeline-fill" style={{ width: `${Math.min(budget, 100)}%` }} />
                            </div>
                            <span className="pgm-dash__timeline-pct">{budget.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="pgm-dash__burn-cell">
                          {formatINRCompact(p.burnRate as string)}/mo
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
