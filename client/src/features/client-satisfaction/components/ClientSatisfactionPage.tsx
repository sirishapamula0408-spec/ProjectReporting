import { useState } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import './ClientSatisfactionPage.css';

type RagOption = 'ON_TRACK' | 'MINOR_ISSUES' | 'CRITICAL_RISKS';

const ragOptions: { key: RagOption; label: string; color: string; bg: string }[] = [
  { key: 'ON_TRACK', label: 'On Track', color: 'var(--color-green, #059669)', bg: 'var(--color-green-light, #D1FAE5)' },
  { key: 'MINOR_ISSUES', label: 'Minor Issues', color: 'var(--color-amber, #D97706)', bg: 'var(--color-amber-light, #FEF3C7)' },
  { key: 'CRITICAL_RISKS', label: 'Critical Risks', color: 'var(--color-red, #DC2626)', bg: 'var(--color-red-light, #FEE2E2)' },
];

export function ClientSatisfactionPage() {
  const [selectedRag, setSelectedRag] = useState<RagOption>('MINOR_ISSUES');
  const [notes, setNotes] = useState('Client expressed concern about the delayed UAT phase. Requested weekly status calls instead of biweekly.');

  return (
    <div className="client-satisfaction">
      <div className="client-satisfaction__header">
        <div>
          <h1 className="client-satisfaction__title">Client Satisfaction Assessment</h1>
        </div>
      </div>

      {/* Part 1: RAG Selection */}
      <div className="client-satisfaction__section-card">
        <h2 className="client-satisfaction__section-title">Overall Satisfaction Status</h2>
        <div className="client-satisfaction__rag-options">
          {ragOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`client-satisfaction__rag-card ${selectedRag === opt.key ? 'client-satisfaction__rag-card--selected' : ''}`}
              style={{
                borderColor: selectedRag === opt.key ? opt.color : undefined,
                background: selectedRag === opt.key ? opt.bg : undefined,
              }}
              onClick={() => setSelectedRag(opt.key)}
            >
              <span className="client-satisfaction__rag-dot" style={{ background: opt.color }} />
              <span className="client-satisfaction__rag-label">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="client-satisfaction__notes-group">
          <label className="client-satisfaction__notes-label" htmlFor="satisfaction-notes">Assessment Notes</label>
          <textarea
            id="satisfaction-notes"
            className="client-satisfaction__textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter assessment notes..."
          />
        </div>
      </div>

      {/* Part 2: Key Metrics */}
      <div className="client-satisfaction__section-card">
        <h2 className="client-satisfaction__section-title">Key Metrics</h2>
        <div className="client-satisfaction__metrics">
          <div className="client-satisfaction__metric">
            <span className="client-satisfaction__metric-label">Escalation Count</span>
            <span className="client-satisfaction__metric-value client-satisfaction__metric-value--alert">2</span>
          </div>
          <div className="client-satisfaction__metric">
            <span className="client-satisfaction__metric-label">Change Requests</span>
            <span className="client-satisfaction__metric-value">5</span>
          </div>
          <div className="client-satisfaction__metric">
            <span className="client-satisfaction__metric-label">Avg Response Time</span>
            <span className="client-satisfaction__metric-value">3.5d</span>
          </div>
        </div>
      </div>

      {/* Part 3: Trend */}
      <div className="client-satisfaction__section-card">
        <h2 className="client-satisfaction__section-title">6-Month Satisfaction Trend</h2>
        <div className="client-satisfaction__placeholder">
          <span className="client-satisfaction__placeholder-text">Satisfaction trend bar chart will be rendered here</span>
        </div>
      </div>

      <div className="client-satisfaction__actions">
        <Button type="button" themeColor="primary" className="client-satisfaction__save-btn">Save Assessment</Button>
      </div>
    </div>
  );
}
