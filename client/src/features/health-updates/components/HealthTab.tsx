import { useState, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { NumericTextBox, TextArea, Input } from '@progress/kendo-react-inputs';
import { useHealthUpdates, useCreateHealthUpdate } from '../hooks/useHealthUpdates';
import { SkeletonLoader, useToast } from '../../../components/shared';
import './HealthTab.css';

interface HealthTabProps {
  projectId: number;
}

const RAG_OPTIONS = [
  { value: 'GREEN' as const, label: 'Green', sublabel: 'On Track', icon: '✓' },
  { value: 'AMBER' as const, label: 'Amber', sublabel: 'Minor Issues', icon: '⚠' },
  { value: 'RED' as const, label: 'Red', sublabel: 'Critical Risks', icon: '!' },
];

const PROXY_THRESHOLDS = { escalation: 3, changeRequest: 5, responseTime: 3.0 };

function getProxyChipClass(value: number, threshold: number): string {
  if (value >= threshold * 2) return 'ht__chip--red';
  if (value >= threshold) return 'ht__chip--amber';
  return '';
}

export function HealthTab({ projectId }: HealthTabProps) {
  const { data: updates, isLoading } = useHealthUpdates(projectId);
  const createMutation = useCreateHealthUpdate(projectId);
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState('');
  const [rag, setRag] = useState<'RED' | 'AMBER' | 'GREEN'>('GREEN');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [note, setNote] = useState('');
  const [escalationCount, setEscalationCount] = useState<number | null>(0);
  const [changeRequestVol, setChangeRequestVol] = useState<number | null>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    setPeriod('');
    setRag('GREEN');
    setAchievements('');
    setChallenges('');
    setNote('');
    setEscalationCount(0);
    setChangeRequestVol(0);
    setAvgResponseTime(null);
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!period) { showToast('Period is required (YYYY-MM)', 'error'); return; }
    try {
      await createMutation.mutateAsync({
        period,
        clientSatisfactionRag: rag,
        clientSatisfactionNote: note || null,
        achievements: achievements ? achievements.split('\n').filter(Boolean) : [],
        challenges: challenges ? challenges.split('\n').filter(Boolean) : [],
        escalationCount: escalationCount ?? 0,
        changeRequestVolume: changeRequestVol ?? 0,
        avgResponseTimeDays: avgResponseTime != null ? avgResponseTime.toFixed(2) : null,
      });
      showToast('Health update submitted', 'success');
      resetForm();
    } catch {
      showToast('Failed to submit health update', 'error');
    }
  }, [period, rag, note, achievements, challenges, escalationCount, changeRequestVol, avgResponseTime, createMutation, showToast, resetForm]);

  if (isLoading) {
    return <div className="ht"><SkeletonLoader type="grid" count={3} /></div>;
  }

  const latestUpdate = updates && updates.length > 0 ? updates[0] : null;

  return (
    <div className="ht">
      {/* Header */}
      <div className="ht__header">
        <h2 className="ht__title">Health Updates</h2>
        {!showForm && (
          <Button themeColor="primary" onClick={() => setShowForm(true)}>
            + New Health Update
          </Button>
        )}
      </div>

      {/* Latest Health Summary with Proxy Signals */}
      {latestUpdate && (
        <div className="ht__summary-card">
          <div className="ht__summary-header">
            <h3>Latest Update: {latestUpdate.period}</h3>
            <span className={`ht__rag-badge ht__rag-badge--${latestUpdate.clientSatisfactionRag.toLowerCase()}`}>
              {latestUpdate.clientSatisfactionRag}
            </span>
          </div>
          <div className="ht__proxy-signals">
            <span className={`ht__chip ${getProxyChipClass(latestUpdate.escalationCount, PROXY_THRESHOLDS.escalation)}`}>
              {latestUpdate.escalationCount} Escalations
            </span>
            <span className={`ht__chip ${getProxyChipClass(latestUpdate.changeRequestVolume, PROXY_THRESHOLDS.changeRequest)}`}>
              {latestUpdate.changeRequestVolume} CRs
            </span>
            <span className={`ht__chip ${latestUpdate.avgResponseTimeDays ? getProxyChipClass(parseFloat(latestUpdate.avgResponseTimeDays), PROXY_THRESHOLDS.responseTime) : ''}`}>
              {latestUpdate.avgResponseTimeDays ? `${latestUpdate.avgResponseTimeDays}d Avg Response` : 'N/A'}
            </span>
          </div>
          {latestUpdate.clientSatisfactionNote && (
            <p className="ht__summary-note">{latestUpdate.clientSatisfactionNote}</p>
          )}
        </div>
      )}

      {/* New Health Update Form */}
      {showForm && (
        <div className="ht__form">
          <h3>Monthly Health Update</h3>

          <div className="ht__form-field">
            <label>Reporting Period</label>
            <Input
              value={period}
              onChange={(e) => setPeriod(e.value ?? '')}
              placeholder="YYYY-MM"
            />
          </div>

          {/* RAG Selector */}
          <div className="ht__form-field">
            <label>Overall Project Health (RAG)</label>
            <div className="ht__rag-selector">
              {RAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`ht__rag-option ht__rag-option--${opt.value.toLowerCase()} ${rag === opt.value ? 'ht__rag-option--selected' : ''}`}
                  onClick={() => setRag(opt.value)}
                  type="button"
                >
                  <span className="ht__rag-icon">{opt.icon}</span>
                  <span className="ht__rag-label">{opt.label}</span>
                  <span className="ht__rag-sublabel">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Proxy Satisfaction Signals */}
          <div className="ht__form-field">
            <label>Client Satisfaction Signals</label>
            <div className="ht__proxy-inputs">
              <div className="ht__proxy-field">
                <span className="ht__proxy-label">Escalation Count</span>
                <NumericTextBox value={escalationCount} onChange={(e) => setEscalationCount(e.value)} min={0} max={999} format="n0" />
              </div>
              <div className="ht__proxy-field">
                <span className="ht__proxy-label">Change Request Volume</span>
                <NumericTextBox value={changeRequestVol} onChange={(e) => setChangeRequestVol(e.value)} min={0} max={999} format="n0" />
              </div>
              <div className="ht__proxy-field">
                <span className="ht__proxy-label">Avg Response Time (days)</span>
                <NumericTextBox value={avgResponseTime} onChange={(e) => setAvgResponseTime(e.value)} min={0} max={99.99} format="n2" step={0.5} />
              </div>
            </div>
          </div>

          <div className="ht__form-field">
            <label>Key Achievements</label>
            <TextArea value={achievements} onChange={(e) => setAchievements(e.value ?? '')} placeholder="One achievement per line..." rows={3} />
          </div>

          <div className="ht__form-field">
            <label>Challenges & Obstacles</label>
            <TextArea value={challenges} onChange={(e) => setChallenges(e.value ?? '')} placeholder="One challenge per line..." rows={3} />
          </div>

          <div className="ht__form-field">
            <label>Satisfaction Note</label>
            <TextArea value={note} onChange={(e) => setNote(e.value ?? '')} placeholder="Additional notes on client satisfaction..." rows={2} />
          </div>

          <div className="ht__form-actions">
            <Button onClick={resetForm}>Cancel</Button>
            <Button themeColor="primary" onClick={handleSubmit} disabled={createMutation.isPending}>
              Submit Monthly Update
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {updates && updates.length > 0 && (
        <div className="ht__history">
          <h3>Update History</h3>
          <table className="ht__table">
            <thead>
              <tr>
                <th>PERIOD</th>
                <th>RAG</th>
                <th>ESCALATIONS</th>
                <th>CRs</th>
                <th>AVG RESPONSE</th>
                <th>ENTERED BY</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u.id}>
                  <td>{u.period}</td>
                  <td>
                    <span className={`ht__rag-dot ht__rag-dot--${u.clientSatisfactionRag.toLowerCase()}`} />
                    {u.clientSatisfactionRag}
                  </td>
                  <td className="ht__cell-center">{u.escalationCount}</td>
                  <td className="ht__cell-center">{u.changeRequestVolume}</td>
                  <td className="ht__cell-center">{u.avgResponseTimeDays ?? 'N/A'}</td>
                  <td>{u.enteredBy?.displayName ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!updates || updates.length === 0) && !showForm && (
        <div className="ht__empty">
          <h3>No health updates yet</h3>
          <p>Submit your first monthly health update to start tracking project health.</p>
        </div>
      )}
    </div>
  );
}
