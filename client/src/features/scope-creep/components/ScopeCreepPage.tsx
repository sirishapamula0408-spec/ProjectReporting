import { formatINR } from '../../../config/constants';
import './ScopeCreepPage.css';

const DECISION_STYLES: Record<string, { bg: string; color: string }> = {
  ABSORBED: { bg: 'var(--color-amber-light, #FEF3C7)', color: 'var(--color-amber, #D97706)' },
  CHANGE_REQUEST: { bg: 'var(--color-primary-light, #DBEAFE)', color: 'var(--color-primary, #2563EB)' },
  DECLINED: { bg: 'var(--color-red-light, #FEE2E2)', color: 'var(--color-red, #DC2626)' },
};

const entries = [
  { date: '2026-03-15', description: 'Additional reporting module for client stakeholders', effortHours: 32, costImpact: '128000', decision: 'CHANGE_REQUEST' },
  { date: '2026-03-08', description: 'Mobile-responsive dashboard requirement added', effortHours: 48, costImpact: '192000', decision: 'ABSORBED' },
  { date: '2026-02-28', description: 'Integration with legacy billing system', effortHours: 24, costImpact: '96000', decision: 'DECLINED' },
  { date: '2026-02-20', description: 'Additional user roles and permissions matrix', effortHours: 18, costImpact: '72000', decision: 'ABSORBED' },
  { date: '2026-02-10', description: 'Real-time notification system for approvals', effortHours: 20, costImpact: '52000', decision: 'CHANGE_REQUEST' },
];

const decisionLabel = (d: string) => {
  if (d === 'CHANGE_REQUEST') return 'Change Request';
  return d.charAt(0) + d.slice(1).toLowerCase();
};

export function ScopeCreepPage() {
  const totalEffort = entries.reduce((s, e) => s + e.effortHours, 0);
  const totalCost = entries.reduce((s, e) => s + parseFloat(e.costImpact), 0);

  const absorbed = entries.filter((e) => e.decision === 'ABSORBED').length;
  const cr = entries.filter((e) => e.decision === 'CHANGE_REQUEST').length;
  const declined = entries.filter((e) => e.decision === 'DECLINED').length;
  const total = entries.length;

  return (
    <div className="scope-creep">
      <div className="scope-creep__header">
        <div>
          <h1 className="scope-creep__title">Scope Creep Log</h1>
          <p className="scope-creep__subtitle">Track and manage unplanned scope changes across the project lifecycle.</p>
        </div>
      </div>

      <div className="scope-creep__kpis">
        <div className="scope-creep__kpi-card">
          <span className="scope-creep__kpi-label">Total Entries</span>
          <span className="scope-creep__kpi-value">12</span>
        </div>
        <div className="scope-creep__kpi-card">
          <span className="scope-creep__kpi-label">Effort Hours</span>
          <span className="scope-creep__kpi-value">142 hrs</span>
        </div>
        <div className="scope-creep__kpi-card scope-creep__kpi-card--alert">
          <span className="scope-creep__kpi-label">Cost Impact</span>
          <span className="scope-creep__kpi-value">{formatINR('540000')}</span>
        </div>
        <div className="scope-creep__kpi-card">
          <span className="scope-creep__kpi-label">Decision Breakdown</span>
          <div className="scope-creep__decision-bar">
            <div className="scope-creep__bar-segment scope-creep__bar-segment--absorbed" style={{ width: `${(absorbed / total) * 100}%` }} title={`Absorbed: ${absorbed}`} />
            <div className="scope-creep__bar-segment scope-creep__bar-segment--cr" style={{ width: `${(cr / total) * 100}%` }} title={`Change Request: ${cr}`} />
            <div className="scope-creep__bar-segment scope-creep__bar-segment--declined" style={{ width: `${(declined / total) * 100}%` }} title={`Declined: ${declined}`} />
          </div>
          <div className="scope-creep__bar-legend">
            <span className="scope-creep__legend-item"><span className="scope-creep__legend-dot scope-creep__legend-dot--absorbed" /> Absorbed</span>
            <span className="scope-creep__legend-item"><span className="scope-creep__legend-dot scope-creep__legend-dot--cr" /> CR</span>
            <span className="scope-creep__legend-item"><span className="scope-creep__legend-dot scope-creep__legend-dot--declined" /> Declined</span>
          </div>
        </div>
      </div>

      <div className="scope-creep__section-card">
        <table className="scope-creep__table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Effort Hours</th>
              <th>Cost Impact</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const style = DECISION_STYLES[e.decision] || DECISION_STYLES.ABSORBED;
              return (
                <tr key={i}>
                  <td className="scope-creep__cell--date">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{e.description}</td>
                  <td className="scope-creep__cell--number">{e.effortHours} hrs</td>
                  <td className="scope-creep__cell--money">{formatINR(e.costImpact)}</td>
                  <td>
                    <span className="scope-creep__badge" style={{ background: style.bg, color: style.color }}>
                      {decisionLabel(e.decision)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="scope-creep__summary-bar">
        <span>Total Impact: <strong>{totalEffort} hrs</strong></span>
        <span className="scope-creep__summary-divider" />
        <span>Cost: <strong>{formatINR(totalCost)}</strong></span>
      </div>
    </div>
  );
}
