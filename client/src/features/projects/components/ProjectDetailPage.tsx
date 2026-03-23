import { useParams, useNavigate } from 'react-router-dom';
import { TabStrip, TabStripTab, type TabStripSelectEventArguments } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { useState, useCallback } from 'react';
import { useProjectDetail, useMilestones, useTransitionStatus } from '../hooks/useProjects';
import { Breadcrumbs, LoadingSpinner, SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import { ProjectOverviewTab } from '../../dashboard';
import { useProjectDashboard } from '../../dashboard/hooks/useDashboard';
import { useAllocations } from '../hooks/useAllocations';
import { useBudgetPlan } from '../hooks/useBudget';
import './ProjectDetailPage.css';

const skeletonMarginStyle = { marginTop: 24 } as const;

const CATEGORY_LABELS: Record<string, string> = {
  EMPLOYEE_SALARY: 'Employee Salary',
  SUBSCRIPTIONS: 'Subscriptions',
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  FOOD_ALLOWANCE: 'Food Allowance',
  GIFTS: 'Gifts',
  INFRASTRUCTURE: 'Infrastructure',
  CONTRACTOR: 'Contractor',
};

/** Costs Tab — fetches budget plan data */
function CostsTab({ projectId }: { projectId: number }) {
  const { data: budgetItems = [] } = useBudgetPlan(projectId);
  const { data: dashData } = useProjectDashboard(projectId);
  const costBreakdown = dashData?.costBreakdown ?? [];

  // Group budget by category
  const categoryTotals: Record<string, number> = {};
  budgetItems.forEach((item: { categoryType: string; amount: string }) => {
    categoryTotals[item.categoryType] = (categoryTotals[item.categoryType] ?? 0) + parseFloat(item.amount || '0');
  });

  const categories = Object.keys(CATEGORY_LABELS);
  let totalPlanned = 0;
  let totalActual = 0;

  return (
    <div className="project-detail__tab-content">
      <div className="project-detail__card">
        <h3>Budget by Category</h3>
        <table className="project-detail__data-table">
          <thead>
            <tr><th>CATEGORY</th><th>PLANNED</th><th>ACTUAL</th><th>VARIANCE</th></tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const planned = categoryTotals[cat] ?? 0;
              const actualEntry = costBreakdown.find((c: { category: string }) => c.category === cat);
              const actual = actualEntry ? parseFloat(actualEntry.actual || '0') : 0;
              const variance = planned - actual;
              totalPlanned += planned;
              totalActual += actual;
              return (
                <tr key={cat}>
                  <td>{CATEGORY_LABELS[cat]}</td>
                  <td>{formatINR(String(planned))}</td>
                  <td>{formatINR(String(actual))}</td>
                  <td style={{ color: variance < 0 ? 'var(--color-red)' : 'var(--color-green)' }}>
                    {formatINR(String(variance))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="project-detail__total-row">
              <td>TOTAL</td>
              <td>{formatINR(String(totalPlanned))}</td>
              <td>{formatINR(String(totalActual))}</td>
              <td>{formatINR(String(totalPlanned - totalActual))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** Health Tab — fetches dashboard health data */
function HealthTab({ projectId }: { projectId: number }) {
  const { data: dashData } = useProjectDashboard(projectId);
  const health = dashData?.healthSummary;

  return (
    <div className="project-detail__tab-content">
      <div className="project-detail__card">
        <h3>Health Status</h3>
        <div className="project-detail__health-grid">
          <div className="project-detail__health-item">
            <span className="project-detail__health-label">CLIENT SATISFACTION</span>
            <span className="project-detail__health-value">
              {health?.clientSatisfactionRag ?? 'Not assessed'}
            </span>
          </div>
          <div className="project-detail__health-item">
            <span className="project-detail__health-label">ESCALATION COUNT</span>
            <span className="project-detail__health-value">
              {health?.escalationCount ?? 0}
            </span>
          </div>
          <div className="project-detail__health-item">
            <span className="project-detail__health-label">CHANGE REQUESTS</span>
            <span className="project-detail__health-value">
              {health?.changeRequestVolume ?? 0}
            </span>
          </div>
          <div className="project-detail__health-item">
            <span className="project-detail__health-label">AVG RESPONSE TIME</span>
            <span className="project-detail__health-value">
              {health?.avgResponseTimeDays ? `${health.avgResponseTimeDays}d` : '—'}
            </span>
          </div>
        </div>
        {health?.period && (
          <p className="project-detail__hint">Period: {health.period}</p>
        )}
        {!health && (
          <p className="project-detail__hint">No health update submitted yet.</p>
        )}
      </div>
      <div className="project-detail__card">
        <h3>Achievements &amp; Challenges</h3>
        <div className="project-detail__two-col">
          <div>
            <h4 className="project-detail__sub-label">KEY ACHIEVEMENTS</h4>
            {health?.achievements && health.achievements.length > 0 ? (
              <ul className="project-detail__list">
                {health.achievements.map((a: string, i: number) => <li key={i}>{a}</li>)}
              </ul>
            ) : (
              <p className="project-detail__muted">No achievements recorded yet.</p>
            )}
          </div>
          <div>
            <h4 className="project-detail__sub-label">ACTIVE CHALLENGES</h4>
            {health?.challenges && health.challenges.length > 0 ? (
              <ul className="project-detail__list">
                {health.challenges.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <p className="project-detail__muted">No challenges reported yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Team Tab — fetches allocations data */
function TeamTab({ projectId }: { projectId: number }) {
  const { data: allocations = [] } = useAllocations(projectId);

  return (
    <div className="project-detail__tab-content">
      <div className="project-detail__card">
        <h3>Team Allocation ({allocations.length} members)</h3>
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
            {allocations.length === 0 ? (
              <tr>
                <td colSpan={5} className="project-detail__empty-cell">
                  No team members assigned. Add resources from the Edit Project page.
                </td>
              </tr>
            ) : (
              allocations.map((alloc: { id: number; teamMember?: { name: string; role: string }; allocationPct: string; startDate: string; endDate: string | null }) => (
                <tr key={alloc.id}>
                  <td>{alloc.teamMember?.name ?? '—'}</td>
                  <td>{alloc.teamMember?.role || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(parseFloat(alloc.allocationPct), 100)}%`, background: 'var(--color-primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '12px', minWidth: 36 }}>{alloc.allocationPct}%</span>
                    </div>
                  </td>
                  <td>{alloc.startDate}</td>
                  <td>{alloc.endDate ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  const handleTabSelect = useCallback((e: TabStripSelectEventArguments) => setSelectedTab(e.selected), []);

  const { data: project, isLoading } = useProjectDetail(projectId);
  const { data: milestones } = useMilestones(projectId);
  const transitionStatus = useTransitionStatus(projectId);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    try {
      await transitionStatus.mutateAsync(newStatus);
      showToast(`Project status changed to ${newStatus}`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to change status';
      showToast(msg, 'error');
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
          <CostsTab projectId={projectId} />
        </TabStripTab>

        <TabStripTab title="Health">
          <HealthTab projectId={projectId} />
        </TabStripTab>

        <TabStripTab title="Team">
          <TeamTab projectId={projectId} />
        </TabStripTab>
      </TabStrip>
    </div>
  );
}
