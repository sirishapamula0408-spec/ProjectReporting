import { useState } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { TextArea } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { useAuth } from '../../../context/AuthContext';
import { useReviewNotes, useCreateReviewNote } from '../hooks/usePortfolio';
import { useToast } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared';
import './ReviewNotesPanel.css';

const DECISION_OPTIONS = [
  { text: 'Approved', value: 'APPROVED' },
  { text: 'Needs Revision', value: 'NEEDS_REVISION' },
  { text: 'Acknowledged', value: 'ACKNOWLEDGED' },
];

const DECISION_STYLES: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: 'var(--color-green-light)', color: 'var(--color-green)' },
  NEEDS_REVISION: { bg: 'var(--color-amber-light)', color: 'var(--color-amber)' },
  ACKNOWLEDGED: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
};

const DECISION_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Needs Revision',
  ACKNOWLEDGED: 'Acknowledged',
};

interface ReviewNotesPanelProps {
  projectId: number;
}

export function ReviewNotesPanel({ projectId }: ReviewNotesPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: notes, isLoading } = useReviewNotes(projectId);
  const createNote = useCreateReviewNote(projectId);

  const [noteText, setNoteText] = useState('');
  const [decision, setDecision] = useState(DECISION_OPTIONS[0]);

  // Only BU_HEAD and CFO can see this panel
  if (!user || (user.role !== 'BU_HEAD' && user.role !== 'CFO')) {
    return null;
  }

  const handleSubmit = async () => {
    if (!noteText.trim()) {
      showToast('Please enter a review note', 'warning');
      return;
    }

    try {
      await createNote.mutateAsync({
        decision: decision.value,
        note: noteText.trim(),
      });
      setNoteText('');
      setDecision(DECISION_OPTIONS[0]);
      showToast('Review note posted successfully', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to post review note';
      showToast(msg, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="review-notes-panel">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="review-notes-panel">
      <h3 className="review-notes-panel__title">Review Notes &amp; Approvals</h3>

      {/* Add Review Form */}
      <div className="review-notes-panel__form">
        <h4 className="review-notes-panel__form-title">Add Review</h4>
        <div className="review-notes-panel__form-field">
          <label className="review-notes-panel__label">Review Decision</label>
          <DropDownList
            data={DECISION_OPTIONS}
            textField="text"
            dataItemKey="value"
            value={decision}
            onChange={(e) => setDecision(e.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="review-notes-panel__form-field">
          <label className="review-notes-panel__label">Review Notes</label>
          <TextArea
            value={noteText}
            onChange={(e) => setNoteText(e.value ?? '')}
            rows={3}
            placeholder="Enter your review notes..."
            style={{ width: '100%' }}
          />
        </div>
        <div className="review-notes-panel__form-actions">
          <Button
            themeColor="primary"
            onClick={handleSubmit}
            disabled={createNote.isPending}
          >
            {createNote.isPending ? 'Posting...' : 'Post Review'}
          </Button>
        </div>
      </div>

      {/* Review History */}
      <div className="review-notes-panel__history">
        <h4 className="review-notes-panel__history-title">Review History</h4>
        {(!notes || notes.length === 0) ? (
          <p className="review-notes-panel__empty">No review notes yet.</p>
        ) : (
          <div className="review-notes-panel__list">
            {notes.map((note) => {
              const style = DECISION_STYLES[note.decision] || DECISION_STYLES.ACKNOWLEDGED;
              return (
                <div key={note.id} className="review-notes-panel__item">
                  <div className="review-notes-panel__item-header">
                    <div className="review-notes-panel__item-reviewer">
                      <span className="review-notes-panel__reviewer-avatar">
                        {note.reviewerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="review-notes-panel__reviewer-name">{note.reviewerName}</span>
                        <span className="review-notes-panel__item-date">
                          {new Date(note.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <span
                      className="review-notes-panel__decision-badge"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {DECISION_LABELS[note.decision] || note.decision}
                    </span>
                  </div>
                  <p className="review-notes-panel__item-text">{note.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
