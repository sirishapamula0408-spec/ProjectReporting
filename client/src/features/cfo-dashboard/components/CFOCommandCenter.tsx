import { lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@progress/kendo-react-buttons';
import {
  Chart, ChartSeries, ChartSeriesItem, ChartCategoryAxis,
  ChartCategoryAxisItem, ChartValueAxis, ChartValueAxisItem, ChartLegend, ChartTooltip,
} from '@progress/kendo-react-charts';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { useCFODashboard } from '../hooks/useCFODashboard';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR, formatINRCompact } from '../../../config/constants';
import './CFOCommandCenter.css';

const MARGIN_COLORS: Record<string, string> = {
  GREEN: 'var(--color-green)',
  AMBER: 'var(--color-amber)',
  RED: 'var(--color-red)',
};

const CONFIDENCE_CSS: Record<string, string> = {
  HIGH: 'cfo__badge--green',
  MEDIUM: 'cfo__badge--amber',
  LOW: 'cfo__badge--red',
  INSUFFICIENT_DATA: 'cfo__badge--gray',
};

// Extracted grid cell renderers
function ProjectedCostCell(props: GridCellProps) {
  return (
    <td className="cfo__grid-currency">
      {formatINR(props.dataItem.projectedTotalCost)}
    </td>
  );
}

function ContractValueCell(props: GridCellProps) {
  return (
    <td className="cfo__grid-currency">
      {formatINR(props.dataItem.contractValue)}
    </td>
  );
}

function VarianceCell(props: GridCellProps) {
  const v = parseFloat(props.dataItem.variance);
  return (
    <td className={`cfo__grid-currency ${v > 0 ? 'cfo__var--red' : 'cfo__var--green'}`}>
      {formatINR(props.dataItem.variance)}
    </td>
  );
}

function ConfidenceCell(props: GridCellProps) {
  const conf = props.dataItem.confidence;
  return (
    <td>
      <span className={`cfo__badge ${CONFIDENCE_CSS[conf] ?? ''}`}>
        {conf === 'INSUFFICIENT_DATA' ? 'N/A' : conf}
      </span>
    </td>
  );
}

const QUARTER_MONTHS: Record<string, string[]> = {
  Q1: ['01', '02', '03'],
  Q2: ['04', '05', '06'],
  Q3: ['07', '08', '09'],
  Q4: ['10', '11', '12'],
};

type ViewMode = 'monthly' | 'quarterly';

export function CFOCommandCenter() {
  const { data, isLoading } = useCFODashboard();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const handleProjectClick = useCallback(
    (projectId: number) => navigate(`/projects/${projectId}`),
    [navigate],
  );

  // Quarterly aggregation of burn rate trend
  const burnChartData = useMemo(() => {
    if (!data) return { categories: [] as string[], values: [] as number[] };
    const trend = data.burnRate.trend;
    if (viewMode === 'monthly') {
      return {
        categories: trend.map((t) => t.month),
        values: trend.map((t) => parseFloat(t.total)),
      };
    }
    // Quarterly aggregation
    const quarterMap = new Map<string, number>();
    for (const t of trend) {
      const month = t.month.split('-')[1] ?? '';
      const year = t.month.split('-')[0] ?? '';
      let q = 'Q1';
      for (const [qName, months] of Object.entries(QUARTER_MONTHS)) {
        if (months.includes(month)) { q = qName; break; }
      }
      const key = `${year} ${q}`;
      quarterMap.set(key, (quarterMap.get(key) ?? 0) + parseFloat(t.total));
    }
    return {
      categories: Array.from(quarterMap.keys()),
      values: Array.from(quarterMap.values()),
    };
  }, [data, viewMode]);

  // Quarterly aggregation of revenue vs cost
  const revCostData = useMemo(() => {
    if (!data) return { categories: [] as string[], revenue: [] as number[], cost: [] as number[] };
    const entries = data.revenueVsCost;
    if (viewMode === 'monthly') {
      return {
        categories: entries.map((e) => e.month),
        revenue: entries.map((e) => parseFloat(e.totalRevenue)),
        cost: entries.map((e) => parseFloat(e.totalCost)),
      };
    }
    const qRevenue = new Map<string, number>();
    const qCost = new Map<string, number>();
    for (const e of entries) {
      const month = e.month.split('-')[1] ?? '';
      const year = e.month.split('-')[0] ?? '';
      let q = 'Q1';
      for (const [qName, months] of Object.entries(QUARTER_MONTHS)) {
        if (months.includes(month)) { q = qName; break; }
      }
      const key = `${year} ${q}`;
      qRevenue.set(key, (qRevenue.get(key) ?? 0) + parseFloat(e.totalRevenue));
      qCost.set(key, (qCost.get(key) ?? 0) + parseFloat(e.totalCost));
    }
    const keys = Array.from(new Set([...qRevenue.keys(), ...qCost.keys()])).sort();
    return {
      categories: keys,
      revenue: keys.map((k) => qRevenue.get(k) ?? 0),
      cost: keys.map((k) => qCost.get(k) ?? 0),
    };
  }, [data, viewMode]);

  if (isLoading) {
    return (
      <div className="cfo">
        <SkeletonLoader type="kpi-row" count={4} />
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="grid" count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cfo">
        <div className="cfo__empty"><h3>No data available</h3></div>
      </div>
    );
  }

  const agg = data.aggregates;
  const marginPct = parseFloat(agg.overallMarginPercent);

  return (
    <div className="cfo">
      {/* Header */}
      <div className="cfo__header">
        <div>
          <h1 className="cfo__title">CFO Command Center</h1>
          <p className="cfo__subtitle">Strategic portfolio overview and high-level financial health monitoring.</p>
        </div>
        <div className="cfo__header-actions">
          <div className="cfo__toggle">
            <button
              className={`cfo__toggle-btn ${viewMode === 'monthly' ? 'cfo__toggle-btn--active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >Monthly</button>
            <button
              className={`cfo__toggle-btn ${viewMode === 'quarterly' ? 'cfo__toggle-btn--active' : ''}`}
              onClick={() => setViewMode('quarterly')}
            >Quarterly</button>
          </div>
          <Button themeColor="primary">Export PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="cfo__kpi-row">
        <div className="cfo__kpi-card">
          <span className="cfo__kpi-label">TOTAL CONTRACT VALUE</span>
          <span className="cfo__kpi-value">{formatINRCompact(agg.totalContractValue)}</span>
        </div>
        <div className="cfo__kpi-card">
          <span className="cfo__kpi-label">BURN RATE</span>
          <span className="cfo__kpi-value">{formatINRCompact(data.burnRate.currentMonthTotal)}/mo</span>
        </div>
        <div className="cfo__kpi-card">
          <span className="cfo__kpi-label">OVERALL MARGIN</span>
          <span className={`cfo__kpi-value ${marginPct >= 0 ? 'cfo__kpi-value--green' : 'cfo__kpi-value--red'}`}>
            {marginPct.toFixed(1)}%
          </span>
        </div>
        <div className="cfo__kpi-card">
          <span className="cfo__kpi-label">TOTAL SPEND</span>
          <span className="cfo__kpi-value">{formatINRCompact(agg.totalSpend)}</span>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="cfo__panels">
        {/* Panel 1: Burn Rate Trend */}
        <div className="cfo__panel">
          <h3 className="cfo__panel-title">Forecast to Completion</h3>
          <Chart style={{ height: 240 }}>
            <ChartLegend visible={false} />
            <ChartTooltip format="{0:c0}" />
            <ChartCategoryAxis>
              <ChartCategoryAxisItem categories={burnChartData.categories} labels={{ rotation: -45 }} />
            </ChartCategoryAxis>
            <ChartValueAxis>
              <ChartValueAxisItem labels={{ format: '{0:c0}' }} />
            </ChartValueAxis>
            <ChartSeries>
              <ChartSeriesItem
                type="column"
                data={burnChartData.values}
                color="var(--color-primary)"
              />
            </ChartSeries>
          </Chart>
        </div>

        {/* Panel 2: Margin Heatmap */}
        <div className="cfo__panel">
          <h3 className="cfo__panel-title">Margin Risk Heatmap</h3>
          <div className="cfo__heatmap">
            {data.marginHealth.map((p) => {
              const m = parseFloat(p.marginPercent);
              return (
                <div
                  key={p.projectId}
                  className="cfo__heatmap-cell"
                  onClick={() => handleProjectClick(p.projectId)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="cfo__heatmap-name">{p.projectName}</span>
                  <span
                    className="cfo__heatmap-value"
                    style={{ color: MARGIN_COLORS[p.healthRag] }}
                  >
                    {m.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            {data.marginHealth.length === 0 && (
              <p className="cfo__heatmap-empty">No project margin data available</p>
            )}
          </div>
        </div>

        {/* Panel 3: Revenue vs Cost */}
        <div className="cfo__panel">
          <h3 className="cfo__panel-title">Revenue vs Cost Comparison</h3>
          <Chart style={{ height: 240 }}>
            <ChartLegend position="bottom" />
            <ChartTooltip format="{0:c0}" />
            <ChartCategoryAxis>
              <ChartCategoryAxisItem categories={revCostData.categories} labels={{ rotation: -45 }} />
            </ChartCategoryAxis>
            <ChartValueAxis>
              <ChartValueAxisItem labels={{ format: '{0:c0}' }} />
            </ChartValueAxis>
            <ChartSeries>
              <ChartSeriesItem name="Monthly Revenue" type="line" data={revCostData.revenue} color="var(--color-green)" markers={{ visible: true }} />
              <ChartSeriesItem name="Monthly Cost" type="line" data={revCostData.cost} color="var(--color-red)" markers={{ visible: true }} />
            </ChartSeries>
          </Chart>
        </div>

        {/* Panel 4: Forecast Grid */}
        <div className="cfo__panel">
          <h3 className="cfo__panel-title">Critical Portfolios Under Review</h3>
          <Grid
            data={data.forecastList}
            sortable
            onRowClick={(e) => handleProjectClick(e.dataItem.projectId)}
            className="cfo__forecast-grid"
          >
            <GridColumn field="projectName" title="Portfolio Name" />
            <GridColumn field="contractValue" title="Contract ₹" width="140" cell={ContractValueCell} />
            <GridColumn field="projectedTotalCost" title="Projected ₹" width="140" cell={ProjectedCostCell} />
            <GridColumn field="variance" title="Variance" width="130" cell={VarianceCell} />
            <GridColumn field="confidence" title="Status" width="100" cell={ConfidenceCell} />
          </Grid>
        </div>
      </div>
    </div>
  );
}
