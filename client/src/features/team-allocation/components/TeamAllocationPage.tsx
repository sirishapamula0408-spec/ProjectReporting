import { formatINR } from '../../../config/constants';
import './TeamAllocationPage.css';

const teamMembers = [
  { name: 'Rajesh Kumar', initials: 'RK', role: 'Tech Lead', allocation: 100, startDate: '2025-11-01', endDate: '2026-06-30', costRate: '185000' },
  { name: 'Priya Sharma', initials: 'PS', role: 'Senior Developer', allocation: 75, startDate: '2025-12-15', endDate: '2026-06-30', costRate: '145000' },
  { name: 'Amit Patel', initials: 'AP', role: 'QA Engineer', allocation: 50, startDate: '2026-01-10', endDate: '2026-05-31', costRate: '95000' },
];

function allocationColor(pct: number): string {
  if (pct >= 100) return 'var(--color-red, #DC2626)';
  if (pct >= 75) return 'var(--color-amber, #D97706)';
  return 'var(--color-green, #059669)';
}

export function TeamAllocationPage() {
  return (
    <div className="team-allocation">
      <div className="team-allocation__header">
        <div>
          <h1 className="team-allocation__title">Project Team &amp; Resource Allocation</h1>
          <p className="team-allocation__subtitle">Manage team composition, allocation percentages, and cost rates.</p>
        </div>
      </div>

      <div className="team-allocation__kpis">
        <div className="team-allocation__kpi-card">
          <span className="team-allocation__kpi-label">Team Size</span>
          <span className="team-allocation__kpi-value">8</span>
        </div>
        <div className="team-allocation__kpi-card">
          <span className="team-allocation__kpi-label">Total Allocation</span>
          <span className="team-allocation__kpi-value">625%</span>
        </div>
        <div className="team-allocation__kpi-card">
          <span className="team-allocation__kpi-label">Avg Cost Rate</span>
          <span className="team-allocation__kpi-value">{formatINR('135000')}/mo</span>
        </div>
      </div>

      <div className="team-allocation__section-card">
        <table className="team-allocation__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Allocation %</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => (
              <tr key={m.name}>
                <td>
                  <div className="team-allocation__member">
                    <span className="team-allocation__avatar">{m.initials}</span>
                    <span className="team-allocation__member-name">{m.name}</span>
                  </div>
                </td>
                <td>{m.role}</td>
                <td>
                  <div className="team-allocation__allocation">
                    <div className="team-allocation__progress-bar">
                      <div
                        className="team-allocation__progress-fill"
                        style={{ width: `${Math.min(m.allocation, 100)}%`, background: allocationColor(m.allocation) }}
                      />
                    </div>
                    <span className="team-allocation__allocation-text">{m.allocation}%</span>
                  </div>
                </td>
                <td className="team-allocation__cell--date">
                  {new Date(m.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="team-allocation__cell--date">
                  {new Date(m.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="team-allocation__section-card">
        <h2 className="team-allocation__section-title">Allocation Timeline</h2>
        <div className="team-allocation__placeholder">
          <span className="team-allocation__placeholder-text">Gantt-style allocation timeline will be rendered here</span>
        </div>
      </div>
    </div>
  );
}
