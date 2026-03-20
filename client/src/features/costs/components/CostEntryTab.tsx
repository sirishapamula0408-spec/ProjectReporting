import { useState, useMemo, useCallback } from 'react';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { NumericTextBox } from '@progress/kendo-react-inputs';
import {
  Chart,
  ChartSeries,
  ChartSeriesItem,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartValueAxis,
  ChartValueAxisItem,
  ChartLegend,
  ChartTooltip,
} from '@progress/kendo-react-charts';
import { LoadingSpinner } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import {
  useCostCategories,
  usePlannedAmounts,
  useCostEntries,
  useBatchUpsertPlannedAmounts,
  useBatchUpsertCostEntries,
  useVariance,
  useBurnRate,
  useCostDashboard,
} from '../hooks/useCosts';
import { PeriodSelector } from './PeriodSelector';
import './CostEntryTab.css';

const CATEGORY_LABELS: Record<string, string> = {
  EMPLOYEE_SALARY: 'Employee Salary',
  SUBSCRIPTIONS: 'Subscriptions',
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  FOOD_ALLOWANCE: 'Food Allowance',
  GIFTS: 'Gifts',
  INFRASTRUCTURE: 'Infrastructure',
  CONTRACTOR: 'Contractor',
};

interface CostGridRow {
  costCategoryId: number;
  categoryType: string;
  categoryLabel: string;
  planned: number;
  actual: number;
  variance: number;
  variancePct: number;
  rag: string;
  plannedDirty: boolean;
  actualDirty: boolean;
}

interface CostEntryTabProps {
  projectId: number;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ragColor(rag: string): string {
  switch (rag) {
    case 'GREEN': return 'var(--color-green)';
    case 'AMBER': return 'var(--color-amber)';
    case 'RED': return 'var(--color-red, #ef4444)';
    default: return 'var(--color-gray-500)';
  }
}

export function CostEntryTab({ projectId }: CostEntryTabProps) {
  const { showToast } = useToast();
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [editedRows, setEditedRows] = useState<Map<number, { planned?: number; actual?: number }>>(new Map());

  const { data: categories, isLoading: catLoading } = useCostCategories(projectId);
  const { data: plannedAmounts } = usePlannedAmounts(projectId, period);
  const { data: costEntries } = useCostEntries(projectId, period);
  const { data: variance } = useVariance(projectId, period);
  const { data: burnRate } = useBurnRate(projectId);
  const { data: dashboard } = useCostDashboard(projectId);

  const savePlanned = useBatchUpsertPlannedAmounts(projectId);
  const saveActual = useBatchUpsertCostEntries(projectId);

  // Build grid data
  const gridData = useMemo<CostGridRow[]>(() => {
    if (!categories) return [];

    return categories.map((cat) => {
      const pa = plannedAmounts?.find((p) => p.costCategoryId === cat.id);
      const ce = costEntries?.find((e) => e.costCategoryId === cat.id);
      const vc = variance?.categories.find((v) => v.costCategoryId === cat.id);
      const edits = editedRows.get(cat.id);

      const planned = edits?.planned ?? (pa ? parseFloat(pa.amount) : 0);
      const actual = edits?.actual ?? (ce ? parseFloat(ce.actualAmount) : 0);
      const v = actual - planned;
      const vPct = planned === 0 ? 0 : (v / planned) * 100;

      return {
        costCategoryId: cat.id,
        categoryType: cat.categoryType,
        categoryLabel: CATEGORY_LABELS[cat.categoryType] || cat.categoryType,
        planned,
        actual,
        variance: v,
        variancePct: Math.round(vPct * 100) / 100,
        rag: vc?.rag || (Math.abs(vPct) <= 5 ? 'GREEN' : Math.abs(vPct) <= 15 ? 'AMBER' : 'RED'),
        plannedDirty: edits?.planned !== undefined,
        actualDirty: edits?.actual !== undefined,
      };
    });
  }, [categories, plannedAmounts, costEntries, variance, editedRows]);

  const hasDirtyRows = useMemo(() => editedRows.size > 0, [editedRows]);

  const handleCellEdit = useCallback((categoryId: number, field: 'planned' | 'actual', value: number | null) => {
    setEditedRows((prev) => {
      const next = new Map(prev);
      const existing = next.get(categoryId) || {};
      next.set(categoryId, { ...existing, [field]: value ?? 0 });
      return next;
    });
  }, []);

  const handleSaveAll = useCallback(async () => {
    const plannedItems: Array<{ costCategoryId: number; period: string; amount: string }> = [];
    const actualItems: Array<{ costCategoryId: number; period: string; actualAmount: string }> = [];

    for (const [categoryId, edits] of editedRows) {
      if (edits.planned !== undefined) {
        plannedItems.push({ costCategoryId: categoryId, period, amount: edits.planned.toFixed(2) });
      }
      if (edits.actual !== undefined) {
        actualItems.push({ costCategoryId: categoryId, period, actualAmount: edits.actual.toFixed(2) });
      }
    }

    try {
      const promises: Promise<unknown>[] = [];
      if (plannedItems.length > 0) promises.push(savePlanned.mutateAsync(plannedItems));
      if (actualItems.length > 0) promises.push(saveActual.mutateAsync(actualItems));
      await Promise.all(promises);
      setEditedRows(new Map());
      showToast('All changes saved', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to save changes', 'error');
    }
  }, [editedRows, period, savePlanned, saveActual, showToast]);

  // Totals
  const totals = useMemo(() => {
    const totalPlanned = gridData.reduce((sum, r) => sum + r.planned, 0);
    const totalActual = gridData.reduce((sum, r) => sum + r.actual, 0);
    const totalVariance = totalActual - totalPlanned;
    const totalVarPct = totalPlanned === 0 ? 0 : (totalVariance / totalPlanned) * 100;
    return { totalPlanned, totalActual, totalVariance, totalVarPct };
  }, [gridData]);

  if (catLoading) return <LoadingSpinner size="large" />;

  return (
    <div className="cost-entry-tab">
      {/* KPI Cards */}
      <div className="cost-entry-tab__kpi-row">
        <div className="kpi-card">
          <span className="kpi-card__label">Total Burn</span>
          <span className="kpi-card__value">{formatINR(dashboard?.totalSpend || '0')}</span>
          <span className="kpi-card__unit">cumulative spend</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card__label">Budget Remaining</span>
          <span className="kpi-card__value" style={{ color: parseFloat(dashboard?.budgetRemaining || '0') >= 0 ? 'var(--color-green)' : 'var(--color-red, #ef4444)' }}>
            {formatINR(dashboard?.budgetRemaining || '0')}
          </span>
          <span className="kpi-card__unit">of {formatINR(dashboard?.contractValue || '0')}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card__label">Variance</span>
          <span className="kpi-card__value" style={{ color: ragColor(dashboard?.varianceRag || 'GREEN') }}>
            {dashboard?.variancePct !== undefined ? `${dashboard.variancePct > 0 ? '+' : ''}${dashboard.variancePct.toFixed(1)}%` : '—'}
          </span>
          <span className="kpi-card__unit">overall</span>
        </div>
      </div>

      {/* Period Selector + Save */}
      <div className="cost-entry-tab__toolbar">
        <PeriodSelector value={period} onChange={setPeriod} />
        <Button
          themeColor="primary"
          disabled={!hasDirtyRows || savePlanned.isPending || saveActual.isPending}
          onClick={handleSaveAll}
        >
          {savePlanned.isPending || saveActual.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Cost Entry Grid */}
      <Grid data={gridData} style={{ minHeight: 350 }}>
        <GridColumn field="categoryLabel" title="Category" width={200} />
        <GridColumn
          field="planned"
          title="Planned (₹)"
          width={180}
          cell={(props) => (
            <td>
              <NumericTextBox
                value={props.dataItem.planned}
                onChange={(e) => handleCellEdit(props.dataItem.costCategoryId, 'planned', e.value)}
                format="n2"
                min={0}
                spinners={false}
                style={{
                  width: '100%',
                  background: props.dataItem.plannedDirty ? 'var(--color-primary-light)' : undefined,
                }}
              />
            </td>
          )}
        />
        <GridColumn
          field="actual"
          title="Actual (₹)"
          width={180}
          cell={(props) => (
            <td>
              <NumericTextBox
                value={props.dataItem.actual}
                onChange={(e) => handleCellEdit(props.dataItem.costCategoryId, 'actual', e.value)}
                format="n2"
                min={0}
                spinners={false}
                style={{
                  width: '100%',
                  background: props.dataItem.actualDirty ? 'var(--color-primary-light)' : undefined,
                }}
              />
            </td>
          )}
        />
        <GridColumn
          field="variance"
          title="Variance (₹)"
          width={160}
          cell={(props) => {
            const v = props.dataItem.variance;
            const color = ragColor(props.dataItem.rag);
            return (
              <td style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {v > 0 ? '+' : ''}{formatINR(v.toFixed(2))}
              </td>
            );
          }}
        />
        <GridColumn
          field="variancePct"
          title="Variance %"
          width={120}
          cell={(props) => {
            const pct = props.dataItem.variancePct;
            const color = ragColor(props.dataItem.rag);
            return (
              <td style={{ color, fontWeight: 600 }}>
                {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
              </td>
            );
          }}
        />
      </Grid>

      {/* Totals row */}
      <div className="cost-entry-tab__totals">
        <span className="cost-entry-tab__totals-label">TOTAL</span>
        <span className="cost-entry-tab__totals-value">{formatINR(totals.totalPlanned.toFixed(2))}</span>
        <span className="cost-entry-tab__totals-value">{formatINR(totals.totalActual.toFixed(2))}</span>
        <span className="cost-entry-tab__totals-value" style={{ color: ragColor(totals.totalVarPct <= 5 ? 'GREEN' : totals.totalVarPct <= 15 ? 'AMBER' : 'RED') }}>
          {totals.totalVariance > 0 ? '+' : ''}{formatINR(totals.totalVariance.toFixed(2))}
        </span>
        <span style={{ color: ragColor(Math.abs(totals.totalVarPct) <= 5 ? 'GREEN' : Math.abs(totals.totalVarPct) <= 15 ? 'AMBER' : 'RED'), fontWeight: 600 }}>
          {totals.totalVarPct > 0 ? '+' : ''}{totals.totalVarPct.toFixed(1)}%
        </span>
      </div>

      {/* Burn Rate Chart */}
      {burnRate && burnRate.periods.length > 0 && (
        <div className="cost-entry-tab__chart">
          <h3 className="cost-entry-tab__chart-title">Burn Rate Trend</h3>
          <Chart style={{ height: 300 }}>
            <ChartLegend position="bottom" />
            <ChartTooltip />
            <ChartCategoryAxis>
              <ChartCategoryAxisItem
                categories={burnRate.periods.map((p) => p.period)}
                labels={{ rotation: -45 }}
              />
            </ChartCategoryAxis>
            <ChartValueAxis>
              <ChartValueAxisItem
                title={{ text: 'Amount (₹)' }}
                labels={{ format: '{0:N0}' }}
              />
            </ChartValueAxis>
            <ChartSeries>
              <ChartSeriesItem
                type="column"
                data={burnRate.periods.map((p) => parseFloat(p.monthlyBurn))}
                name="Monthly Burn"
                color="var(--color-primary)"
              />
              <ChartSeriesItem
                type="line"
                data={burnRate.periods.map((p) => parseFloat(p.cumulativeBurn))}
                name="Cumulative Spend"
                color="var(--color-amber)"
                style="smooth"
              />
            </ChartSeries>
          </Chart>

          {/* Contract Value Reference */}
          <div className="cost-entry-tab__contract-ref">
            <span>Contract Value: <strong>{formatINR(burnRate.contractValue)}</strong></span>
            {burnRate.periods.length > 0 && (
              <span>
                Cumulative Spend: <strong>{formatINR(burnRate.periods[burnRate.periods.length - 1].cumulativeBurn)}</strong>
                {' '}({((parseFloat(burnRate.periods[burnRate.periods.length - 1].cumulativeBurn) / parseFloat(burnRate.contractValue)) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty state for chart */}
      {(!burnRate || burnRate.periods.length === 0) && (
        <div className="cost-entry-tab__empty-chart">
          <p>No cost data yet. Enter actual costs above to see the burn rate trend.</p>
        </div>
      )}
    </div>
  );
}
