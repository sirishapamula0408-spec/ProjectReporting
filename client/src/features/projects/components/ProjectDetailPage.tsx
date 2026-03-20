import { useParams, useNavigate } from 'react-router-dom';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { useState, useCallback } from 'react';
import { useProjectDetail, useMilestones, useTransitionStatus } from '../hooks/useProjects';
import { Breadcrumbs, LoadingSpinner, SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import { ProjectOverviewTab } from '../../dashboard';
import './ProjectDetailPage.css';

const skeletonMarginStyle = { marginTop: 24 } as const;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROPOSAL: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  ACTIVE: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  ON_HOLD: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  COMPLETED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-600)' },
  CLOSED: { bg: 'var(--color-gray-200)', color: 'var(--color-gray-500)' },
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id!, 10);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabSelect = useCallback((e: any) => setSelectedTab(e.selected), []);

  const { data: project, isLoading } = useProjectDetail(projectId);
  const { data: milestones } = useMilestones(projectId);
  const transitionStatus = useTransitionStatus(projectId);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    try {
      await transitionStatus.mutateAsync(newStatus);
      showToast(`Project status changed to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to change status', 'error');
    }
  }, [transitionStatus, showToast]);

  if (isLoading) {
    return (
      <div>
        <SkeletonLoader type="text" count={2} />
        <div style={skeletonMarginStyle}>
          <SkeletonLoader type="kpi-row" count={4} />
        </div>
        <div style={skeletonMarginStyle}>
          <SkeletonLoader type="chart" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail__empty">
        <h2>Project not found</h2>
        <Button themeColor="primary" onClick={() => navigate(ROUTES.PROJECTS)}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS.PROPOSAL;

  return (
    <div className="project-detail">
      <Breadcrumbs
        items={[
          { label: 'My Projects', path: ROUTES.PM_DASHBOARD },
          { label: project.name },
        ]}
      />

      {/* Header */}
      <div className="project-detail__header">
        <div>
          <h1 className="project-detail__title">
            {project.name}
            <span
              className="project-detail__status"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {project.status.replace('_', ' ')}
            </span>
          </h1>
          <p className="project-detail__meta">
            {project.code} · {project.client} · {project.manager.displayName}
          </p>
        </div>
        <div className="project-detail__actions">
          <Button
            className="btn-secondary"
            onClick={() => navigate(`/projects/${projectId}/edit`)}
          >
            Edit Project
          </Button>
          {project.status === 'PROPOSAL' && (
            <Button themeColor="primary" onClick={() => handleStatusChange('ACTIVE')}>
              Activate
            </Button>
          )}
          {project.status === 'ACTIVE' && (
            <>
              <Button onClick={() => handleStatusChange('ON_HOLD')}>Put On Hold</Button>
              <Button onClick={() => handleStatusChange('COMPLETED')}>Complete</Button>
            </>
          )}
          {project.status === 'ON_HOLD' && (
            <Button themeColor="primary" onClick={() => handleStatusChange('ACTIVE')}>
              Resume
            </Button>
          )}
          {project.status === 'COMPLETED' && (
            <Button onClick={() => handleStatusChange('CLOSED')}>Close / Archive</Button>
          )}
        </div>
      </div>

      {/* Data freshness */}
      <div className="project-detail__freshness">
        Last updated: {new Date(project.updatedAt).toLocaleString('en-IN')}
      </div>

      {/* Tabs */}
      <TabStrip selected={selectedTab} onSelect={handleTabSelect}>
        <TabStripTab title="Overview">
          <ProjectOverviewTab projectId={projectId} />
        </TabStripTab>

        <TabStripTab title="Costs">
          <div className="project-detail__placeholder">
            <p>Cost tracking coming in Epic 4 (PRT-26)</p>
          </div>
        </TabStripTab>

        <TabStripTab title="Health">
          <div className="project-detail__placeholder">
            <p>Health updates coming in Epic 5 (PRT-29)</p>
          </div>
        </TabStripTab>

        <TabStripTab title="Team">
          <div className="project-detail__placeholder">
            <p>Team allocation coming in Epic 3 (PRT-22)</p>
          </div>
        </TabStripTab>
      </TabStrip>
    </div>
  );
}
