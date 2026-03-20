import { useState, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { useScopeCreep, useCreateScopeCreep, useDeleteScopeCreep } from '../hooks/useScopeCreep';
import { SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import './ScopeCreepTab.css';

interface ScopeCreepTabProps {
  projectId: number;
}

const DECISION_OPTIONS = [
  { text: 'Absorbed', value: 'ABSORBED' },
  { text: 'Change Request', value: 'CHANGE_REQUEST' },
  { text: 'Declined', value: 'DECLINED' },
];

const DECISION_LABELS: Record<string, string> = {
  ABSORBED: 'Absorbed',
  CHANGE_REQUEST: 'Change Request',
  DECLINED: 'Declined',
};

const DECISION_CSS: Record<string, string> = {
  ABSORBED: 'sct__decision--amber',
  CHANGE_REQUEST: 'sct__decision--blue',
  DECLINED: 'sct__decision--gray',
};

export function ScopeCreepTab({ projectId }: ScopeCreepTabProps) {
  const { data, isLoading } = useScopeCreep(projectId);
  const createMutation = useCreateScopeCreep(projectId);
  const deleteMutation = useDeleteScopeCreep(projectId);
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [effortHours, setEffortHours] = useState<number | null>(0);
  const [costImpact, setCostImpact] = useState<number | null>(0);
  const [decision, setDecision] = useState(DECISION_OPTIONS[0]);

  const resetForm = useCallback(() => {
    setDescription('');
    setEffortHours(0);
    setCostImpact(0);
    setDecision(DECISION_OPTIONS[0]!);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }
    try {
      await createMutation.mutateAsync({
        description: description.trim(),
        effortHours: (effortHours ?? 0).toFixed(2),
        costImpact: (costImpact ?? 0).toFixed(2),
        decision: decision?.value as 'ABSORBED' | 'CHANGE_REQUEST' | 'DECLINED',
      });
      showToast('Scope creep entry added', 'success');
      resetForm();
    } catch {
      showToast('Failed to add entry', 'error');
    }
  }, [description, effortHours, costImpact, decision, createMutation, showToast, resetForm]);

  const handleDelete = useCallback(async (entryId: number) => {
    try {
      await deleteMutation.mutateAsync(entryId);
      showToast('Entry deleted', 'success');
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  }, [deleteMutation, showToast]);

  if (isLoading) {
    return (
      <div className="sct">
        <SkeletonLoader type="kpi-row" count={4} />
        <SkeletonLoader type="grid" count={5} />
      </div>
    );
  }

  const agg = data?.aggregation;
  const entries = data?.entries ?? [];

  return (
    <div className="sct">
      {/* Header */}
      <div className="sct__header">
        <div>
          <h2 className="sct__title">Scope Creep Log</h2>
          <p className="sct__subtitle">Monitor and track unscheduled project changes and their impacts.</p>
        </div>
        {!showForm && (
          <Button themeColor="primary" onClick={() => setShowForm(true)}>
            + Add Entry
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      {agg && (
        <div className="sct__kpi-row">
          <div className="sct__kpi-card">
            <span className="sct__kpi-label">TOTAL ENTRIES</span>
            <span className="sct__kpi-value">{agg.totalEntries}</span>
          </div>
          <div className="sct__kpi-card">
            <span className="sct__kpi-label">TOTAL EFFORT HOURS</span>
            <span className="sct__kpi-value">{agg.totalEffortHours} hrs</span>
          </div>
          <div className="sct__kpi-card">
            <span className="sct__kpi-label">TOTAL COST IMPACT</span>
            <span className="sct__kpi-value">{formatINR(agg.totalCostImpact)}</span>
          </div>
          <div className="sct__kpi-card">
            <span className="sct__kpi-label">DECISION BREAKDOWN</span>
            <div className="sct__breakdown-bar">
              {agg.totalEntries > 0 && (
                <>
                  <div
                    className="sct__bar-segment sct__bar-segment--absorbed"
                    style={{ width: `${(agg.byDecision.ABSORBED.count / agg.totalEntries) * 100}%` }}
                  />
                  <div
                    className="sct__bar-segment sct__bar-segment--cr"
                    style={{ width: `${(agg.byDecision.CHANGE_REQUEST.count / agg.totalEntries) * 100}%` }}
                  />
                  <div
                    className="sct__bar-segment sct__bar-segment--declined"
                    style={{ width: `${(agg.byDecision.DECLINED.count / agg.totalEntries) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="sct__breakdown-legend">
              <span><span className="sct__legend-dot sct__legend-dot--absorbed" /> Absorbed</span>
              <span><span className="sct__legend-dot sct__legend-dot--cr" /> CR</span>
              <span><span className="sct__legend-dot sct__legend-dot--declined" /> Declined</span>
            </div>
          </div>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="sct__form">
          <div className="sct__form-row">
            <div className="sct__form-field sct__form-field--desc">
              <label>Description</label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.value ?? '')}
                placeholder="e.g. Additional UI revisions for dashboard"
                rows={1}
              />
            </div>
            <div className="sct__form-field">
              <label>Effort Hours</label>
              <NumericTextBox
                value={effortHours}
                onChange={(e) => setEffortHours(e.value)}
                min={0}
                max={9999.99}
                format="n2"
              />
            </div>
            <div className="sct__form-field">
              <label>Cost Impact (₹)</label>
              <NumericTextBox
                value={costImpact}
                onChange={(e) => setCostImpact(e.value)}
                min={0}
                format="c2"
              />
            </div>
            <div className="sct__form-field">
              <label>Decision</label>
              <DropDownList
                data={DECISION_OPTIONS}
                value={decision}
                onChange={(e) => setDecision(e.value)}
                textField="text"
                dataItemKey="value"
              />
            </div>
            <div className="sct__form-actions">
              <Button themeColor="primary" onClick={handleSave} disabled={createMutation.isPending}>
                Save
              </Button>
              <Button onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      {entries.length === 0 ? (
        <div className="sct__empty">
          <h3>No scope creep entries</h3>
          <p>Click "+ Add Entry" to log unscheduled project changes.</p>
        </div>
      ) : (
        <>
          <table className="sct__table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>DESCRIPTION</th>
                <th>EFFORT HOURS</th>
                <th>COST IMPACT</th>
                <th>DECISION</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="sct__cell-date">
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>{entry.description}</td>
                  <td className="sct__cell-right">{entry.effortHours}</td>
                  <td className="sct__cell-right">{formatINR(entry.costImpact)}</td>
                  <td>
                    <span className={`sct__decision-badge ${DECISION_CSS[entry.decision] ?? ''}`}>
                      {DECISION_LABELS[entry.decision] ?? entry.decision}
                    </span>
                  </td>
                  <td>
                    <button
                      className="sct__delete-btn"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete entry"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Footer */}
          {agg && (
            <div className="sct__summary-footer">
              <span className="sct__summary-icon">ℹ</span>
              <span className="sct__summary-label">Summary of Absorbed Changes</span>
              <span className="sct__summary-stat">
                Total Absorbed Cost: <strong>{formatINR(agg.byDecision.ABSORBED.cost)}</strong>
              </span>
              <span className="sct__summary-stat">
                Total Effort Absorbed: <strong>{agg.byDecision.ABSORBED.hours} hrs</strong>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
