import { useNavigate } from 'react-router-dom';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { useProjects } from '../hooks/useProjects';
import { LoadingSpinner, SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import './ProjectListPage.css';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROPOSAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.PROPOSAL;
  return (
    <span
      className="status-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export function ProjectListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="project-list">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={{ marginTop: 24 }}>
          <SkeletonLoader type="grid" count={5} />
        </div>
      </div>
    );
  }

  const projects = data?.data ?? [];

  return (
    <div className="project-list">
      <div className="project-list__header">
        <div>
          <h1 className="project-list__title">Project Portfolio</h1>
          <p className="project-list__subtitle">Monitor progress and health across all organizational projects.</p>
        </div>
        <Button
          themeColor="primary"
          onClick={() => navigate(ROUTES.PROJECT_NEW)}
        >
          + New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="project-list__empty">
          <h3>No projects yet</h3>
          <p>Click "New Project" to create your first project.</p>
        </div>
      ) : (
        <Grid
          data={projects}
          sortable
          filterable
          pageable={{ pageSizes: [10, 20, 50] }}
          onRowClick={(e) => navigate(`/projects/${e.dataItem.id}`)}
          className="project-list__grid"
          style={{ cursor: 'pointer' }}
        >
          <GridColumn field="code" title="Code" width="120" />
          <GridColumn field="name" title="Project Name" />
          <GridColumn field="client" title="Client" width="180" />
          <GridColumn
            field="status"
            title="Status"
            width="130"
            cell={(props) => (
              <td>
                <StatusBadge status={props.dataItem.status} />
              </td>
            )}
          />
          <GridColumn field="startDate" title="Start Date" width="120" />
          <GridColumn field="endDate" title="End Date" width="120" />
          <GridColumn
            field="contractValue"
            title="Contract Value"
            width="160"
            cell={(props) => (
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatINR(props.dataItem.contractValue)}
              </td>
            )}
          />
          <GridColumn
            field="manager.displayName"
            title="Manager"
            width="150"
          />
        </Grid>
      )}
    </div>
  );
}
