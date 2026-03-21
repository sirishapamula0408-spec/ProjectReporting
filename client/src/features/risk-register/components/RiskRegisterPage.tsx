import { useState } from 'react';
import { formatINR } from '../../../config/constants';
import './RiskRegisterPage.css';

type FilterTab = 'ALL' | 'OPEN' | 'MITIGATED' | 'CLOSED';

const PROBABILITY_STYLES: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: 'var(--color-red-light, #FEE2E2)', color: 'var(--color-red, #DC2626)' },
  MEDIUM: { bg: 'var(--color-amber-light, #FEF3C7)', color: 'var(--color-amber, #D97706)' },
  LOW: { bg: 'var(--color-green-light, #D1FAE5)', color: 'var(--color-green, #059669)' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  OPEN: { bg: 'var(--color-red-light, #FEE2E2)', color: 'var(--color-red, #DC2626)' },
  MITIGATED: { bg: 'var(--color-green-light, #D1FAE5)', color: 'var(--color-green, #059669)' },
  CLOSED: { bg: 'var(--color-gray-200, #E5E7EB)', color: 'var(--color-gray-600, #4B5563)' },
};

const risks = [
  { id: 'RSK-001', description: 'Key developer resignation during critical phase', probability: 'HIGH', costImpact: '250000', status: 'OPEN', mitigation: 'Cross-train team members, maintain documentation' },
  { id: 'RSK-002', description: 'Third-party API integration delays', probability: 'MEDIUM', costImpact: '180000', status: 'OPEN', mitigation: 'Build mock interfaces, negotiate SLAs with vendor' },
  { id: 'RSK-003', description: 'Scope creep from client change requests', probability: 'HIGH', costImpact: '320000', status: 'MITIGATED', mitigation: 'Strict CR process implemented, weekly scope review' },
  { id: 'RSK-004', description: 'Infrastructure provisioning delays', probability: 'LOW', costImpact: '45000', status: 'CLOSED', mitigation: 'Pre-provisioned staging environment' },
  { id: 'RSK-005', description: 'Security audit findings requiring rework', probability: 'MEDIUM', costImpact: '50000', status: 'OPEN', mitigation: 'Scheduled early security review at sprint 4' },
];

export function RiskRegisterPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filteredRisks = activeTab === 'ALL'
    ? risks
    : risks.filter((r) => r.status === activeTab);

  const totalExposure = risks
    .filter((r) => r.status === 'OPEN')
    .reduce((sum, r) => sum + parseFloat(r.costImpact), 0);

  return (
    <div className="risk-register">
      <div className="risk-register__header">
        <div className="risk-register__header-left">
          <h1 className="risk-register__title">Risk Register</h1>
          <span className="risk-register__badge-count">{risks.length} risks</span>
        </div>
        <button className="risk-register__add-btn" type="button">+ Add Risk</button>
      </div>

      <div className="risk-register__kpis">
        <div className="risk-register__kpi-card">
          <span className="risk-register__kpi-label">Open Risks</span>
          <span className="risk-register__kpi-value">12</span>
        </div>
        <div className="risk-register__kpi-card risk-register__kpi-card--alert">
          <span className="risk-register__kpi-label">Total Exposure</span>
          <span className="risk-register__kpi-value">{formatINR('845000')}</span>
        </div>
        <div className="risk-register__kpi-card">
          <span className="risk-register__kpi-label">Mitigated</span>
          <span className="risk-register__kpi-value risk-register__kpi-value--positive">8</span>
        </div>
      </div>

      <div className="risk-register__tabs">
        {(['ALL', 'OPEN', 'MITIGATED', 'CLOSED'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`risk-register__tab ${activeTab === tab ? 'risk-register__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="risk-register__section-card">
        <table className="risk-register__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Probability</th>
              <th>Cost Impact</th>
              <th>Status</th>
              <th>Mitigation Plan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.map((r) => {
              const probStyle = PROBABILITY_STYLES[r.probability] || PROBABILITY_STYLES.LOW;
              const statusStyle = STATUS_STYLES[r.status] || STATUS_STYLES.OPEN;
              return (
                <tr key={r.id}>
                  <td className="risk-register__cell--id">{r.id}</td>
                  <td>{r.description}</td>
                  <td>
                    <span className="risk-register__badge" style={{ background: probStyle.bg, color: probStyle.color }}>
                      {r.probability}
                    </span>
                  </td>
                  <td className="risk-register__cell--money">{formatINR(r.costImpact)}</td>
                  <td>
                    <span className="risk-register__badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="risk-register__cell--plan">{r.mitigation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="risk-register__footer-banner">
        <span>Total Open Exposure:</span>
        <strong>{formatINR(totalExposure)}</strong>
      </div>
    </div>
  );
}
