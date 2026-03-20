import { useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { usePMDashboard } from '../hooks/useDashboard';
import { KPICard } from './KPICard';
import { KPICardRow } from './KPICardRow';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import './PMDashboardPage.css';

const RAG_ORDER: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PROPOSAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

/** Custom cell: project name as a link */
function ProjectNameCell(props: GridCellProps) {
  const { dataItem, field } = props;
  return (
    <td>
      <Link to={`/projects/${dataItem.id}`} className="pm-dashboard__project-link">
        {dataItem[field!]}
      </Link>
    </td>
  );
}

/** Custom cell: colored status badge */
function StatusCell(props: GridCellProps) {
  const { dataItem } = props;
  const style = STATUS_STYLES[dataItem.status] || STATUS_STYLES.PROPOSAL;
  return (
    <td>
      <span
        className="pm-dashboard__status-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {dataItem.status.replace('_', ' ')}
      </span>
    </td>
  );
}

/** Custom cell: RAG dot + text */
function RagCell(props: GridCellProps) {
  const rag = props.dataItem.healthRag;
  if (!rag) {
    return <td><span style={{ color: 'var(--color-gray-400)' }}>N/A</span></td>;
  }
  return (
    <td>
      <span className="pm-dashboard__rag">
        <span className={`pm-dashboard__rag-dot pm-dashboard__rag-dot--${rag}`} />
        {rag}
      </span>
    </td>
  );
}

/** Custom cell: burn rate formatted as INR */
function BurnRateCell(props: GridCellProps) {
  const value = props.dataItem.burnRate;
  return (
    <td className="pm-dashboard__tabular-nums">
      {value != null ? formatINR(value) : '-'}
    </td>
  );
}

/** Custom cell: budget progress bar */
function BudgetCell(props: GridCellProps) {
  const pct = props.dataItem.budgetUsedPct;
  if (pct == null) {
    return <td>-</td>;
  }
  const num = typeof pct === 'string' ? parseFloat(pct) : pct;
  const colorClass =
    num >= 90 ? 'pm-dashboard__progress-fill--red' :
    num >= 75 ? 'pm-dashboard__progress-fill--amber' :
    'pm-dashboard__progress-fill--green';

  return (
    <td>
      <div className="pm-dashboard__progress-bar">
        <div
          className={`pm-dashboard__progress-fill ${colorClass}`}
          style={{ width: `${Math.min(num, 100)}%` }}
        />
      </div>
      <span className="pm-dashboard__progress-label">{num.toFixed(0)}%</span>
    </td>
  );
}

/** Custom cell: relative time */
function LastUpdatedCell(props: GridCellProps) {
  const value = props.dataItem.lastUpdated;
  if (!value) return <td>-</td>;
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  let relative: string;
  if (minutes < 1) relative = 'Just now';
  else if (minutes < 60) relative = `${minutes}m ago`;
  else if (hours < 24) relative = `${hours}h ago`;
  else relative = `${days}d ago`;
  return <td title={date.toLocaleString('en-IN')}>{relative}</td>;
}

const gridStyle = { border: 'none' } as const;

export function PMDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, dataUpdatedAt } = usePMDashboard();
  const handleRowClick = useCallback((e: any) => navigate(`/projects/${e.dataItem.id}`), [navigate]);

  if (isLoading) {
    return (
      <div className="pm-dashboard">
        <SkeletonLoader type="kpi-row" count={3} />
        <SkeletonLoader type="grid" count={5} />
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const projects = data?.projects ?? [];

  // Sort projects by RAG severity (RED first, then AMBER, then GREEN, then null)
  const sortedProjects = [...projects].sort((a: any, b: any) => {
    const aOrder = a.healthRag ? (RAG_ORDER[a.healthRag] ?? 3) : 4;
    const bOrder = b.healthRag ? (RAG_ORDER[b.healthRag] ?? 3) : 4;
    return aOrder - bOrder;
  });

  const activeCount = summary.totalActiveProjects ?? 0;
  const atRiskCount = summary.projectsAtRisk ?? 0;
  const portfolioBurnRate = summary.totalPortfolioBurnRate ?? '0';

  if (projects.length === 0) {
    return (
      <div className="pm-dashboard">
        <div className="pm-dashboard__header">
          <h1 className="pm-dashboard__title">My Projects</h1>
        </div>
        <div className="pm-dashboard__empty">
          <h3>No projects yet</h3>
          <p>You don't have any projects assigned. Create your first project to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-dashboard">
      {/* Header */}
      <div className="pm-dashboard__header">
        <h1 className="pm-dashboard__title">My Projects</h1>
        {dataUpdatedAt > 0 && (
          <span className="pm-dashboard__freshness">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString('en-IN')}
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <KPICardRow>
        <KPICard label="Total Active Projects" value={activeCount} />
        <KPICard
          label="Projects At Risk"
          value={atRiskCount}
          variant={atRiskCount > 0 ? 'warning' : undefined}
        />
        <KPICard label="Total Portfolio Burn Rate" value={formatINR(portfolioBurnRate)} />
      </KPICardRow>

      {/* Projects Grid */}
      <div className="pm-dashboard__grid-section">
        <h2>Projects Overview</h2>
        <Grid
          data={sortedProjects}
          style={gridStyle}
          onRowClick={handleRowClick}
        >
          <GridColumn field="name" title="Project Name" cell={ProjectNameCell} width="220px" />
          <GridColumn field="status" title="Status" cell={StatusCell} width="120px" />
          <GridColumn field="healthRag" title="Health" cell={RagCell} width="100px" />
          <GridColumn field="burnRate" title="Burn Rate" cell={BurnRateCell} width="150px" />
          <GridColumn field="budgetUsedPct" title="Budget Used" cell={BudgetCell} width="140px" />
          <GridColumn field="lastUpdated" title="Last Updated" cell={LastUpdatedCell} width="120px" />
        </Grid>
      </div>
    </div>
  );
}
