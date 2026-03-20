import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { usePortfolioDashboard, useExportPortfolioPdf, useExportPortfolioExcel } from '../hooks/usePortfolio';
import { ExportButtons } from './ExportButtons';
import { SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import './PortfolioDashboardPage.css';

const RAG_ORDER: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };
const RAG_STYLES: Record<string, { dotColor: string; label: string }> = {
  RED: { dotColor: 'var(--color-red)', label: 'Red' },
  AMBER: { dotColor: 'var(--color-amber)', label: 'Amber' },
  GREEN: { dotColor: 'var(--color-green)', label: 'Green' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROPOSAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

export function PortfolioDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, isLoading, isError } = usePortfolioDashboard();
  const exportPdf = useExportPortfolioPdf();
  const exportExcel = useExportPortfolioExcel();

  const handleExportPdf = async () => {
    try {
      await exportPdf.mutateAsync();
      showToast('Portfolio PDF exported successfully', 'success');
    } catch {
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportExcel.mutateAsync();
      showToast('Portfolio Excel exported successfully', 'success');
    } catch {
      showToast('Failed to export Excel', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="portfolio-dashboard">
        <SkeletonLoader type="text" count={2} />
        <div style={{ marginTop: 24 }}>
          <SkeletonLoader type="kpi-row" count={4} />
        </div>
        <div style={{ marginTop: 24 }}>
          <SkeletonLoader type="grid" count={5} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="portfolio-dashboard portfolio-dashboard__empty">
        <h2>Unable to load portfolio data</h2>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  // Sort projects by RAG severity (red first)
  const sortedProjects = [...data.projects].sort((a, b) => {
    const aOrder = a.healthRag ? (RAG_ORDER[a.healthRag] ?? 3) : 3;
    const bOrder = b.healthRag ? (RAG_ORDER[b.healthRag] ?? 3) : 3;
    return aOrder - bOrder;
  });

  // Cell renderers
  const StatusCell = (props: GridCellProps) => {
    const status = props.dataItem.status as string;
    const style = STATUS_COLORS[status] || STATUS_COLORS.PROPOSAL;
    return (
      <td>
        <span
          className="portfolio-dashboard__status-badge"
          style={{ background: style.bg, color: style.color }}
        >
          {status.replace('_', ' ')}
        </span>
      </td>
    );
  };

  const HealthCell = (props: GridCellProps) => {
    const rag = props.dataItem.healthRag as string | null;
    if (!rag) {
      return <td><span className="portfolio-dashboard__rag-text">N/A</span></td>;
    }
    const ragStyle = RAG_STYLES[rag] || RAG_STYLES.GREEN;
    return (
      <td>
        <span className="portfolio-dashboard__rag">
          <span className="portfolio-dashboard__rag-dot" style={{ background: ragStyle.dotColor }} />
          <span className="portfolio-dashboard__rag-text">{ragStyle.label}</span>
        </span>
      </td>
    );
  };

  const BurnRateCell = (props: GridCellProps) => {
    return (
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {formatINR(props.dataItem.burnRate)}
      </td>
    );
  };

  const MarginCell = (props: GridCellProps) => {
    const val = props.dataItem.marginPercent;
    return (
      <td style={{ textAlign: 'right' }}>
        {val != null ? `${val.toFixed(1)}%` : 'N/A'}
      </td>
    );
  };

  const BudgetUsedCell = (props: GridCellProps) => {
    const val = props.dataItem.budgetUsedPercent;
    if (val == null) return <td style={{ textAlign: 'right' }}>N/A</td>;
    const isOver = val > 90;
    return (
      <td style={{ textAlign: 'right' }}>
        <span style={{ color: isOver ? 'var(--color-red)' : undefined, fontWeight: isOver ? 600 : undefined }}>
          {val.toFixed(1)}%
        </span>
      </td>
    );
  };

  const UpdatedCell = (props: GridCellProps) => {
    return (
      <td className="portfolio-dashboard__updated-cell">
        {new Date(props.dataItem.updatedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
    );
  };

  return (
    <div className="portfolio-dashboard">
      {/* Header */}
      <div className="portfolio-dashboard__header">
        <div>
          <h1 className="portfolio-dashboard__title">BU Portfolio Overview</h1>
          <p className="portfolio-dashboard__subtitle">
            Real-time health and margin-risk summary for your business unit.
          </p>
        </div>
        <ExportButtons
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          isPdfLoading={exportPdf.isPending}
          isExcelLoading={exportExcel.isPending}
        />
      </div>

      {/* KPI Cards */}
      <div className="portfolio-dashboard__kpis">
        <div className="portfolio-dashboard__kpi-card">
          <span className="portfolio-dashboard__kpi-label">Total Projects</span>
          <span className="portfolio-dashboard__kpi-value">{data.totalProjects}</span>
        </div>
        <div className="portfolio-dashboard__kpi-card">
          <span className="portfolio-dashboard__kpi-label">Active Projects</span>
          <span className="portfolio-dashboard__kpi-value">{data.activeProjects}</span>
        </div>
        <div className="portfolio-dashboard__kpi-card portfolio-dashboard__kpi-card--risk">
          <span className="portfolio-dashboard__kpi-label">Projects at Risk</span>
          <span className="portfolio-dashboard__kpi-value portfolio-dashboard__kpi-value--risk">
            {data.atRiskProjects}
          </span>
        </div>
        <div className="portfolio-dashboard__kpi-card">
          <span className="portfolio-dashboard__kpi-label">Total Burn Rate</span>
          <span className="portfolio-dashboard__kpi-value portfolio-dashboard__kpi-value--money">
            {formatINR(data.totalBurnRate)}
          </span>
        </div>
      </div>

      {/* Project Grid */}
      <div className="portfolio-dashboard__grid-section">
        <h2 className="portfolio-dashboard__grid-title">Project Portfolio Grid</h2>
        {sortedProjects.length === 0 ? (
          <div className="portfolio-dashboard__empty-grid">
            <p>No projects found in your portfolio.</p>
          </div>
        ) : (
          <Grid
            data={sortedProjects}
            style={{ maxHeight: '600px' }}
            onRowClick={(e) => {
              navigate(`/projects/${e.dataItem.id}`);
            }}
            className="portfolio-dashboard__grid"
          >
            <GridColumn field="name" title="Project Name" width="200px" />
            <GridColumn field="managerName" title="PM" width="150px" />
            <GridColumn field="status" title="Status" width="120px" cell={StatusCell} />
            <GridColumn field="healthRag" title="Health" width="100px" cell={HealthCell} />
            <GridColumn field="burnRate" title="Burn Rate" width="150px" cell={BurnRateCell} />
            <GridColumn field="marginPercent" title="Margin %" width="100px" cell={MarginCell} />
            <GridColumn field="budgetUsedPercent" title="Budget Used %" width="130px" cell={BudgetUsedCell} />
            <GridColumn field="updatedAt" title="Last Updated" width="130px" cell={UpdatedCell} />
          </Grid>
        )}
      </div>
    </div>
  );
}
