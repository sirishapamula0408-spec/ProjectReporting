import { useState, useCallback, useEffect } from 'react';
import { TextArea } from '@progress/kendo-react-inputs';
import { NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Button } from '@progress/kendo-react-buttons';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import {
  useHealthUpdate,
  useUpsertHealthUpdate,
  useRisks,
  useCreateRisk,
  useUpdateRiskStatus,
} from '../hooks/useHealth';
import type { Risk } from '../hooks/useHealth';
import './HealthTab.css';

interface HealthTabProps {
  projectId: number;
}

type RagValue = 'GREEN' | 'AMBER' | 'RED';

const PROBABILITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const RISK_STATUS_OPTIONS = ['OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED'];

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  // Past 12 months + current
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
}

export function HealthTab({ projectId }: HealthTabProps) {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

  // Form state
  const [rag, setRag] = useState<RagValue>('GREEN');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');

  // Risk form state
  const [riskDesc, setRiskDesc] = useState('');
  const [riskProb, setRiskProb] = useState('MEDIUM');
  const [riskCost, setRiskCost] = useState<number | null>(null);

  // Queries
  const { data: healthUpdate, isLoading: healthLoading } = useHealthUpdate(projectId, selectedPeriod);
  const { data: risks } = useRisks(projectId);
  const upsertMutation = useUpsertHealthUpdate(projectId);
  const createRiskMutation = useCreateRisk(projectId);
  const updateRiskStatusMutation = useUpdateRiskStatus(projectId);

  // Sync form when health update data loads
  useEffect(() => {
    if (healthUpdate) {
      setRag(healthUpdate.clientSatisfactionRag);
      setAchievements(healthUpdate.achievements.join('\n'));
      setChallenges(healthUpdate.challenges.join('\n'));
    } else {
      setRag('GREEN');
      setAchievements('');
      setChallenges('');
    }
  }, [healthUpdate]);

  const periodOptions = getPeriodOptions();

  const handleSave = useCallback(async () => {
    try {
      await upsertMutation.mutateAsync({
        period: selectedPeriod,
        clientSatisfactionRag: rag,
        achievements: achievements
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        challenges: challenges
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      showToast('Health update saved successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to save health update', 'error');
    }
  }, [upsertMutation, selectedPeriod, rag, achievements, challenges, showToast]);

  const handleAddRisk = useCallback(async () => {
    if (!riskDesc.trim() || riskCost === null || riskCost < 0) {
      showToast('Please fill in risk description and cost impact', 'warning');
      return;
    }
    try {
      await createRiskMutation.mutateAsync({
        description: riskDesc.trim(),
        probability: riskProb as 'LOW' | 'MEDIUM' | 'HIGH',
        costImpact: riskCost.toFixed(2),
      });
      setRiskDesc('');
      setRiskProb('MEDIUM');
      setRiskCost(null);
      showToast('Risk added successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to add risk', 'error');
    }
  }, [createRiskMutation, riskDesc, riskProb, riskCost, showToast]);

  const handleStatusChange = useCallback(
    async (riskId: number, status: string) => {
      try {
        await updateRiskStatusMutation.mutateAsync({ riskId, status });
        showToast('Risk status updated', 'success');
      } catch (err: any) {
        showToast(err?.response?.data?.error?.message || 'Failed to update risk status', 'error');
      }
    },
    [updateRiskStatusMutation, showToast],
  );

  return (
    <div className="health-tab">
      {/* Period Selector */}
      <div className="health-tab__period-row">
        <label>Period</label>
        <DropDownList
          data={periodOptions}
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.value)}
          itemRender={(li, itemProps) => {
            const period = itemProps.dataItem as string;
            return (
              <li {...li.props}>
                {formatPeriodLabel(period)}
              </li>
            );
          }}
          valueRender={(el, value) => {
            return (
              <span {...(el as any).props}>
                {value ? formatPeriodLabel(value as string) : 'Select period'}
              </span>
            );
          }}
          style={{ width: 220 }}
        />
      </div>

      {/* Overall Project Health */}
      <div className="health-tab__section">
        <h3>Overall Project Health</h3>
        <div className="health-tab__rag-group">
          {(['GREEN', 'AMBER', 'RED'] as RagValue[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`health-tab__rag-btn health-tab__rag-btn--${value.toLowerCase()} ${
                rag === value ? 'health-tab__rag-btn--selected' : ''
              }`}
              onClick={() => setRag(value)}
            >
              <span className={`health-tab__rag-dot health-tab__rag-dot--${value.toLowerCase()}`} />
              {value === 'GREEN' ? 'On Track' : value === 'AMBER' ? 'At Risk' : 'Critical'}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements & Challenges */}
      <div className="health-tab__section">
        <h3>Progress Notes</h3>
        <div className="health-tab__field">
          <label>Key Achievements (one per line)</label>
          <TextArea
            value={achievements}
            onChange={(e) => setAchievements(e.value ?? '')}
            rows={4}
            placeholder="Enter key achievements for this period..."
            className="health-tab__textarea"
          />
        </div>
        <div className="health-tab__field">
          <label>Challenges &amp; Obstacles (one per line)</label>
          <TextArea
            value={challenges}
            onChange={(e) => setChallenges(e.value ?? '')}
            rows={4}
            placeholder="Enter challenges and obstacles..."
            className="health-tab__textarea"
          />
        </div>
      </div>

      {/* Save Health Update */}
      <div className="health-tab__actions">
        <Button
          themeColor="primary"
          onClick={handleSave}
          disabled={upsertMutation.isPending || healthLoading}
        >
          {upsertMutation.isPending ? 'Saving...' : 'Save Health Update'}
        </Button>
      </div>

      {/* Risks */}
      <div className="health-tab__section">
        <h3>Risks</h3>
        {risks && risks.length > 0 ? (
          <Grid data={risks} style={{ maxHeight: 400 }}>
            <GridColumn
              field="description"
              title="Description"
            />
            <GridColumn
              field="probability"
              title="Probability"
              width="120"
              cell={(props) => (
                <td>
                  <span className={`health-tab__prob health-tab__prob--${props.dataItem.probability}`}>
                    {props.dataItem.probability}
                  </span>
                </td>
              )}
            />
            <GridColumn
              field="costImpact"
              title="Cost Impact"
              width="150"
              cell={(props) => (
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(props.dataItem.costImpact)}
                </td>
              )}
            />
            <GridColumn
              field="status"
              title="Status"
              width="150"
              cell={(props) => {
                const risk: Risk = props.dataItem;
                return (
                  <td>
                    <DropDownList
                      data={RISK_STATUS_OPTIONS}
                      value={risk.status}
                      onChange={(e) => handleStatusChange(risk.id, e.value)}
                      size="small"
                      style={{ width: 130 }}
                    />
                  </td>
                );
              }}
            />
          </Grid>
        ) : (
          <p style={{ color: 'var(--color-gray-400)', fontSize: 'var(--text-body)' }}>
            No risks recorded for this project.
          </p>
        )}

        {/* Add Risk Form */}
        <div className="health-tab__risk-form">
          <div className="health-tab__field">
            <label>Description</label>
            <TextArea
              value={riskDesc}
              onChange={(e) => setRiskDesc(e.value ?? '')}
              rows={1}
              placeholder="Describe the risk..."
            />
          </div>
          <div className="health-tab__field health-tab__field--small">
            <label>Probability</label>
            <DropDownList
              data={PROBABILITY_OPTIONS}
              value={riskProb}
              onChange={(e) => setRiskProb(e.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="health-tab__field health-tab__field--small">
            <label>Cost Impact</label>
            <NumericTextBox
              value={riskCost}
              onChange={(e) => setRiskCost(e.value)}
              format="n2"
              min={0}
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </div>
          <div className="health-tab__field health-tab__field--btn">
            <Button
              themeColor="primary"
              onClick={handleAddRisk}
              disabled={createRiskMutation.isPending}
            >
              {createRiskMutation.isPending ? 'Adding...' : 'Add Risk'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
