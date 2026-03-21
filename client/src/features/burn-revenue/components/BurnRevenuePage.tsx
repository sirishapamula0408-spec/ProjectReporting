import { formatINR } from '../../../config/constants';
import './BurnRevenuePage.css';

const milestones = [
  { milestone: 'Requirements Sign-off', dueDate: '2026-01-15', amount: '1200000', status: 'PAID' },
  { milestone: 'Design Approval', dueDate: '2026-02-28', amount: '800000', status: 'PAID' },
  { milestone: 'UAT Completion', dueDate: '2026-04-30', amount: '1500000', status: 'UPCOMING' },
  { milestone: 'Go-Live & Handover', dueDate: '2026-06-30', amount: '2000000', status: 'UPCOMING' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PAID: { bg: 'var(--color-green-light, #D1FAE5)', color: 'var(--color-green, #059669)' },
  UPCOMING: { bg: 'var(--color-primary-light, #DBEAFE)', color: 'var(--color-primary, #2563EB)' },
  OVERDUE: { bg: 'var(--color-red-light, #FEE2E2)', color: 'var(--color-red, #DC2626)' },
};

export function BurnRevenuePage() {
  return (
    <div className="burn-revenue">
      <div className="burn-revenue__header">
        <div>
          <h1 className="burn-revenue__title">Burn vs Revenue Timeline</h1>
        </div>
      </div>

      <div className="burn-revenue__kpis">
        <div className="burn-revenue__kpi-card burn-revenue__kpi-card--alert">
          <span className="burn-revenue__kpi-label">Current Gap</span>
          <span className="burn-revenue__kpi-value burn-revenue__kpi-value--negative">{formatINR('-1245000')}</span>
        </div>
        <div className="burn-revenue__kpi-card">
          <span className="burn-revenue__kpi-label">Next Milestone</span>
          <span className="burn-revenue__kpi-value burn-revenue__kpi-value--text">UAT Completion</span>
        </div>
      </div>

      <div className="burn-revenue__section-card">
        <h2 className="burn-revenue__section-title">Cumulative Performance</h2>
        <div className="burn-revenue__placeholder">
          <span className="burn-revenue__placeholder-text">Cumulative burn vs revenue line chart will be rendered here</span>
        </div>
      </div>

      <div className="burn-revenue__section-card">
        <h2 className="burn-revenue__section-title">Payment Milestones</h2>
        <table className="burn-revenue__table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m) => {
              const style = STATUS_STYLES[m.status] || STATUS_STYLES.UPCOMING;
              return (
                <tr key={m.milestone}>
                  <td className="burn-revenue__cell--name">{m.milestone}</td>
                  <td className="burn-revenue__cell--date">
                    {new Date(m.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="burn-revenue__cell--money">{formatINR(m.amount)}</td>
                  <td>
                    <span className="burn-revenue__badge" style={{ background: style.bg, color: style.color }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
