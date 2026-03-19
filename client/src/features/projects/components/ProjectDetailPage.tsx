import { useParams, useNavigate } from 'react-router-dom';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { useState, useCallback } from 'react';
import { useProjectDetail, useMilestones, useTransitionStatus } from '../hooks/useProjects';
import { Breadcrumbs, LoadingSpinner, SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import './ProjectDetailPage.css';

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
        <div style={{ marginTop: 24 }}>
          <SkeletonLoader type="kpi-row" count={4} />
        </div>
        <div style={{ marginTop: 24 }}>
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
      <TabStrip selected={selectedTab} onSelect={(e) => setSelectedTab(e.selected)}>
        <TabStripTab title="Overview">
          <div className="project-detail__overview">
            {/* Project Info Card */}
            <div className="project-detail__card">
              <h3>Project Details</h3>
              <div className="project-detail__info-grid">
                <div><span className="label">Client</span><span className="value">{project.client}</span></div>
                <div><span className="label">Contract Value</span><span className="value">{formatINR(project.contractValue)}</span></div>
                <div><span className="label">Start Date</span><span className="value">{project.startDate}</span></div>
                <div><span className="label">End Date</span><span className="value">{project.endDate}</span></div>
                <div><span className="label">Business Unit</span><span className="value">{project.businessUnit}</span></div>
                <div><span className="label">Manager</span><span className="value">{project.manager.displayName}</span></div>
              </div>
              {project.description && (
                <p className="project-detail__description">{project.description}</p>
              )}
            </div>

            {/* Payment Milestones */}
            <div className="project-detail__card">
              <h3>Payment Milestones</h3>
              {(!milestones || milestones.length === 0) ? (
                <p className="project-detail__empty-text">No milestones defined. Edit the project to add milestones.</p>
              ) : (
                <table className="project-detail__milestone-table">
                  <thead>
                    <tr>
                      <th>Milestone</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {formatINR(m.amount)}
                        </td>
                        <td>{m.dueDate}</td>
                        <td>
                          <span className={`milestone-status ${m.isPaid ? 'milestone-status--paid' : 'milestone-status--due'}`}>
                            {m.isPaid ? 'PAID' : 'DUE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
