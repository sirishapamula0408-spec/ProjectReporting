import { formatINR } from '../../../config/constants';
import './CFOCommandCenter.css';

const criticalProjects = [
  { name: 'Project Atlas', pm: 'Rajesh Kumar', health: 'RED', burnRate: '1850000', margin: -4.2, issue: 'Scope creep, 3 CRs pending' },
  { name: 'Project Beacon', pm: 'Priya Sharma', health: 'AMBER', burnRate: '920000', margin: 8.1, issue: 'Key resource attrition' },
  { name: 'Project Citadel', pm: 'Amit Patel', health: 'RED', burnRate: '2100000', margin: -1.5, issue: 'Client escalation, timeline slip' },
];

const HEALTH_STYLES: Record<string, { bg: string; color: string }> = {
  RED: { bg: 'var(--color-red-light, #FEE2E2)', color: 'var(--color-red, #DC2626)' },
  AMBER: { bg: 'var(--color-amber-light, #FEF3C7)', color: 'var(--color-amber, #D97706)' },
  GREEN: { bg: 'var(--color-green-light, #D1FAE5)', color: 'var(--color-green, #059669)' },
};

export function CFOCommandCenter() {
  return (
    <div className="cfo-command-center">
      <div className="cfo-command-center__header">
        <div>
          <h1 className="cfo-command-center__title">CFO Command Center</h1>
          <p className="cfo-command-center__subtitle">
            Organization-wide financial oversight and strategic decision support.
          </p>
        </div>
      </div>

      <div className="cfo-command-center__kpis">
        <div className="cfo-command-center__kpi-card">
          <span className="cfo-command-center__kpi-label">Total Portfolio Value</span>
          <span className="cfo-command-center__kpi-value">{'\u20B9'}42.8Cr</span>
        </div>
        <div className="cfo-command-center__kpi-card">
          <span className="cfo-command-center__kpi-label">Burn Rate</span>
          <span className="cfo-command-center__kpi-value">{'\u20B9'}32L/mo</span>
        </div>
        <div className="cfo-command-center__kpi-card">
          <span className="cfo-command-center__kpi-label">Projected Margin</span>
          <span className="cfo-command-center__kpi-value cfo-command-center__kpi-value--positive">24.8%</span>
        </div>
      </div>

      <div className="cfo-command-center__sections">
        <div className="cfo-command-center__section-card">
          <h2 className="cfo-command-center__section-title">Forecast to Completion</h2>
          <div className="cfo-command-center__placeholder">
            <span className="cfo-command-center__placeholder-text">Forecast chart will be rendered here</span>
          </div>
        </div>

        <div className="cfo-command-center__section-card">
          <h2 className="cfo-command-center__section-title">Revenue vs Direct Costs</h2>
          <div className="cfo-command-center__placeholder">
            <span className="cfo-command-center__placeholder-text">Revenue vs costs chart will be rendered here</span>
          </div>
        </div>
      </div>

      <div className="cfo-command-center__section-card">
        <h2 className="cfo-command-center__section-title">Critical Review List</h2>
        <table className="cfo-command-center__table">
          <thead>
            <tr>
              <th>Project</th>
              <th>PM</th>
              <th>Health</th>
              <th>Burn Rate</th>
              <th>Margin %</th>
              <th>Key Issue</th>
            </tr>
          </thead>
          <tbody>
            {criticalProjects.map((p) => {
              const style = HEALTH_STYLES[p.health] || HEALTH_STYLES.GREEN;
              return (
                <tr key={p.name}>
                  <td className="cfo-command-center__cell--name">{p.name}</td>
                  <td>{p.pm}</td>
                  <td>
                    <span
                      className="cfo-command-center__badge"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {p.health}
                    </span>
                  </td>
                  <td className="cfo-command-center__cell--money">{formatINR(p.burnRate)}</td>
                  <td className="cfo-command-center__cell--money" style={{ color: p.margin < 0 ? 'var(--color-red, #DC2626)' : undefined }}>
                    {p.margin.toFixed(1)}%
                  </td>
                  <td>{p.issue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
