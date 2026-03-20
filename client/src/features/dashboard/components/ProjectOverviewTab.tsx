import { Suspense, lazy } from 'react';
import { useProjectDashboard } from '../hooks/useDashboard';
import { KPICard } from './KPICard';
import { KPICardRow } from './KPICardRow';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import './ProjectOverviewTab.css';

// Lazy-load chart components to avoid Kendo Charts class constructor issue
const BurnRateChart = lazy(() => import('./BurnRateChart'));
const CostBreakdownChart = lazy(() => import('./CostBreakdownChart'));

interface ProjectOverviewTabProps {
  projectId: number;
}

export function ProjectOverviewTab({ projectId }: ProjectOverviewTabProps) {
  const { data, isLoading } = useProjectDashboard(projectId);

  if (isLoading) {
    return (
      <div className="project-overview">
        <SkeletonLoader type="kpi-row" count={5} />
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="project-overview">
        <div className="project-overview__empty">No dashboard data available yet.</div>
      </div>
    );
  }

  const { kpis, burnRateHistory, costBreakdown, healthSummary, teamComposition } = data;

  const teamRoles = teamComposition?.roles ?? [];
  const totalMembers = teamComposition?.totalMembers ?? 0;

  return (
    <div className="project-overview">
      {/* KPI Cards */}
      <KPICardRow>
        <KPICard
          label="Total Burn Rate"
          value={kpis.totalBurnRate != null ? formatINR(kpis.totalBurnRate) : '-'}
        />
        <KPICard
          label="Cumulative Spend"
          value={kpis.cumulativeSpend != null ? formatINR(kpis.cumulativeSpend) : '-'}
        />
        <KPICard
          label="Contract Value"
          value={kpis.contractValue != null ? formatINR(kpis.contractValue) : '-'}
        />
        <KPICard
          label="Budget Remaining"
          value={kpis.budgetRemaining != null ? formatINR(kpis.budgetRemaining) : '-'}
          variant={
            kpis.budgetRemaining != null && parseFloat(kpis.budgetRemaining) < 0
              ? 'red'
              : undefined
          }
        />
        <KPICard
          label="Health RAG"
          value={kpis.healthRag || 'N/A'}
          variant={kpis.healthRag ? kpis.healthRag.toLowerCase() : undefined}
        />
      </KPICardRow>

      {/* Charts Row */}
      <div className="project-overview__charts-row">
        <div className="project-overview__section">
          <h3>Burn Rate Trend</h3>
          {burnRateHistory && burnRateHistory.length > 0 ? (
            <Suspense fallback={<SkeletonLoader type="chart" />}>
              <BurnRateChart data={burnRateHistory} />
            </Suspense>
          ) : (
            <div className="project-overview__empty">
              No burn rate data available. Add cost entries to see the trend.
            </div>
          )}
        </div>

        <div className="project-overview__section">
          <h3>Cost Breakdown (Planned vs Actual)</h3>
          {costBreakdown && costBreakdown.length > 0 ? (
            <Suspense fallback={<SkeletonLoader type="chart" />}>
              <CostBreakdownChart data={costBreakdown} />
            </Suspense>
          ) : (
            <div className="project-overview__empty">
              No cost breakdown data available.
            </div>
          )}
        </div>
      </div>

      {/* Health Summary */}
      <div className="project-overview__section">
        <h3>Health Summary</h3>
        {healthSummary ? (
          <div className="project-overview__health-panel">
            <div className="project-overview__health-item">
              <h4>Client Satisfaction</h4>
              <span
                className={`project-overview__rag-badge project-overview__rag-badge--${healthSummary.clientSatisfactionRag?.toLowerCase()}`}
              >
                {healthSummary.clientSatisfactionRag}
              </span>
            </div>
            <div className="project-overview__health-item">
              <h4>Key Achievements</h4>
              {healthSummary.achievements && healthSummary.achievements.length > 0 ? (
                <ul>
                  {healthSummary.achievements.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="project-overview__muted">No achievements recorded.</p>
              )}
            </div>
            <div className="project-overview__health-item">
              <h4>Challenges</h4>
              {healthSummary.challenges && healthSummary.challenges.length > 0 ? (
                <ul>
                  {healthSummary.challenges.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="project-overview__muted">No challenges reported.</p>
              )}
            </div>
            {healthSummary.period && (
              <div className="project-overview__health-item">
                <h4>Period</h4>
                <p>{healthSummary.period}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="project-overview__empty">
            No health update submitted yet. Add a health update from the Health tab.
          </div>
        )}
      </div>

      {/* Team Composition */}
      <div className="project-overview__section">
        <h3>Team Composition ({totalMembers} members)</h3>
        {teamRoles.length > 0 ? (
          <div className="project-overview__team-grid">
            {teamRoles.map((role: { role: string; count: number }) => (
              <div key={role.role} className="project-overview__team-item">
                <div className="role-count">{role.count}</div>
                <div className="role-name">{role.role}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="project-overview__empty">
            No team members assigned. Add team members from the Team tab.
          </div>
        )}
      </div>
    </div>
  );
}
