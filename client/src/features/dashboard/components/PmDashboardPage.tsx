import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import { usePmDashboard } from '../hooks/useDashboard';
import type { ProjectSummary } from '../hooks/useDashboard';
import './PmDashboardPage.css';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROPOSAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

function getBudgetColor(pct: number): string {
  if (pct >= 90) return 'var(--color-red)';
  if (pct >= 70) return 'var(--color-amber)';
  return 'var(--color-green)';
}

export function PmDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePmDashboard();

  if (isLoading) {
    return (
      <div className="pm-dashboard">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={{ marginTop: 24 }}>
          <SkeletonLoader type="grid" count={5} />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const projects = data?.projects ?? [];

  return (
    <div className="pm-dashboard">
      {/* Header */}
      <div className="pm-dashboard__header">
        <div>
          <h1 className="pm-dashboard__title">My Dashboard</h1>
          <p className="pm-dashboard__subtitle">
            Overview of your active projects and key metrics.
          </p>
        </div>
        <Button themeColor="primary" onClick={() => navigate(ROUTES.PROJECT_NEW)}>
          + New Project
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="pm-dashboard__kpis">
          <div className="pm-dashboard__kpi-card">
            <p className="pm-dashboard__kpi-label">Total Active Projects</p>
            <p className="pm-dashboard__kpi-value">{kpis.totalActiveProjects}</p>
          </div>
          <div className="pm-dashboard__kpi-card">
            <p className="pm-dashboard__kpi-label">Projects At Risk</p>
            <p
              className={`pm-dashboard__kpi-value ${
                kpis.projectsAtRisk > 0 ? 'pm-dashboard__kpi-value--alert' : ''
              }`}
            >
              {kpis.projectsAtRisk}
            </p>
          </div>
          <div className="pm-dashboard__kpi-card">
            <p className="pm-dashboard__kpi-label">Total Portfolio Burn Rate</p>
            <p className="pm-dashboard__kpi-value pm-dashboard__kpi-value--money">
              {formatINR(kpis.totalPortfolioBurnRate)}
            </p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="pm-dashboard__empty">
          <h3>No projects yet</h3>
          <p>Click "New Project" to get started.</p>
          <Button themeColor="primary" onClick={() => navigate(ROUTES.PROJECT_NEW)}>
            + New Project
          </Button>
        </div>
      ) : (
        <div className="pm-dashboard__grid-section">
          <h2 className="pm-dashboard__grid-title">Projects</h2>
          <Grid
            data={projects}
            sortable
            className="pm-dashboard__grid"
            onRowClick={(e) => navigate(`/projects/${e.dataItem.id}`)}
          >
            <GridColumn field="code" title="Code" width="110" />
            <GridColumn field="name" title="Project Name" />
            <GridColumn field="client" title="Client" width="150" />
            <GridColumn
              field="status"
              title="Status"
              width="120"
              cell={(props) => {
                const status = props.dataItem.status;
                const style = STATUS_COLORS[status] || STATUS_COLORS.PROPOSAL;
                return (
                  <td>
                    <span
                      className="pm-dashboard__status"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {status.replace('_', ' ')}
                    </span>
                  </td>
                );
              }}
            />
            <GridColumn
              field="healthRag"
              title="Health"
              width="80"
              cell={(props) => {
                const rag: string | null = props.dataItem.healthRag;
                return (
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`pm-dashboard__rag-dot pm-dashboard__rag-dot--${rag ?? 'null'}`}
                      title={rag ?? 'No health data'}
                    />
                  </td>
                );
              }}
            />
            <GridColumn
              field="currentBurnRate"
              title="Burn Rate"
              width="150"
              cell={(props) => (
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(props.dataItem.currentBurnRate)}
                </td>
              )}
            />
            <GridColumn
              field="budgetUsedPct"
              title="Budget Used"
              width="160"
              cell={(props) => {
                const pct: number = props.dataItem.budgetUsedPct;
                return (
                  <td>
                    <div className="pm-dashboard__budget-bar">
                      <div className="pm-dashboard__budget-track">
                        <div
                          className="pm-dashboard__budget-fill"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: getBudgetColor(pct),
                          }}
                        />
                      </div>
                      <span className="pm-dashboard__budget-label">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                );
              }}
            />
            <GridColumn
              field="updatedAt"
              title="Last Updated"
              width="140"
              cell={(props) => (
                <td style={{ fontSize: 'var(--text-caption)', color: 'var(--color-gray-500)' }}>
                  {new Date(props.dataItem.updatedAt).toLocaleDateString('en-IN')}
                </td>
              )}
            />
          </Grid>
        </div>
      )}
    </div>
  );
}
