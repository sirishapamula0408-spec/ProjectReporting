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
          <div className="project-detail__tab-content">
            <div className="project-detail__card">
              <h3>Monthly Cost Entry</h3>
              <table className="project-detail__data-table">
                <thead>
                  <tr>
                    <th>CATEGORY</th>
                    <th>PLANNED</th>
                    <th>ACTUAL</th>
                    <th>VARIANCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Employee Salary</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                  <tr><td>Subscriptions</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                  <tr><td>Travel</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                  <tr><td>Accommodation</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                  <tr><td>Infrastructure</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                  <tr><td>Contractor</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                </tbody>
                <tfoot>
                  <tr className="project-detail__total-row"><td>TOTAL</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td><td>{formatINR('0')}</td></tr>
                </tfoot>
              </table>
              <p className="project-detail__hint">Add cost entries from the Budget Planning section in Edit Project.</p>
            </div>
          </div>
        </TabStripTab>

        <TabStripTab title="Health">
          <div className="project-detail__tab-content">
            <div className="project-detail__card">
              <h3>Health Status</h3>
              <div className="project-detail__health-grid">
                <div className="project-detail__health-item">
                  <span className="project-detail__health-label">CLIENT SATISFACTION</span>
                  <span className="project-detail__health-value">Not assessed</span>
                </div>
                <div className="project-detail__health-item">
                  <span className="project-detail__health-label">ESCALATION COUNT</span>
                  <span className="project-detail__health-value">0</span>
                </div>
                <div className="project-detail__health-item">
                  <span className="project-detail__health-label">CHANGE REQUESTS</span>
                  <span className="project-detail__health-value">0</span>
                </div>
                <div className="project-detail__health-item">
                  <span className="project-detail__health-label">AVG RESPONSE TIME</span>
                  <span className="project-detail__health-value">—</span>
                </div>
              </div>
              <p className="project-detail__hint">Submit a health update to populate this section.</p>
            </div>
            <div className="project-detail__card">
              <h3>Achievements &amp; Challenges</h3>
              <div className="project-detail__two-col">
                <div>
                  <h4 className="project-detail__sub-label">KEY ACHIEVEMENTS</h4>
                  <p className="project-detail__muted">No achievements recorded yet.</p>
                </div>
                <div>
                  <h4 className="project-detail__sub-label">ACTIVE CHALLENGES</h4>
                  <p className="project-detail__muted">No challenges reported yet.</p>
                </div>
              </div>
            </div>
          </div>
        </TabStripTab>

        <TabStripTab title="Team">
          <div className="project-detail__tab-content">
            <div className="project-detail__card">
              <h3>Team Allocation</h3>
              <table className="project-detail__data-table">
                <thead>
                  <tr>
                    <th>TEAM MEMBER</th>
                    <th>ROLE</th>
                    <th>ALLOCATION %</th>
                    <th>START DATE</th>
                    <th>END DATE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="project-detail__empty-cell">
                      No team members assigned. Add resources from the Edit Project page.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabStripTab>
      </TabStrip>
    </div>
  );
}
