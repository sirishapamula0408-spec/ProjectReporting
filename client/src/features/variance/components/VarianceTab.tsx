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
import { useVariance, type VarianceCell, type TrendDirection } from '../hooks/useVariance';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import './VarianceTab.css';

interface VarianceTabProps {
  projectId: number;
}

const RAG_CLASSES: Record<string, string> = {
  GREEN: 'vt__rag--green',
  AMBER: 'vt__rag--amber',
  RED: 'vt__rag--red',
};

const TREND_ICONS: Record<TrendDirection, { symbol: string; className: string }> = {
  IMPROVING: { symbol: '↘', className: 'vt__trend--green' },
  WORSENING: { symbol: '↗', className: 'vt__trend--red' },
  STABLE: { symbol: '→', className: 'vt__trend--gray' },
};

function formatVariancePercent(value: string): string {
  const num = parseFloat(value);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

function VarianceCellDisplay({ cell }: { cell: VarianceCell | undefined }) {
  if (!cell) return <td className="vt__cell">-</td>;
  const num = parseFloat(cell.variancePercent);
  const colorClass = num > 0 ? 'vt__var--red' : num < 0 ? 'vt__var--green' : 'vt__var--gray';
  return (
    <td className="vt__cell">
      <span className={colorClass}>{formatVariancePercent(cell.variancePercent)}</span>
    </td>
  );
}

function TrendArrow({ trend }: { trend: TrendDirection }) {
  const info = TREND_ICONS[trend];
  return <span className={`vt__trend-arrow ${info.className}`}>{info.symbol}</span>;
}

export function VarianceTab({ projectId }: VarianceTabProps) {
  const { data, isLoading } = useVariance(projectId);

  if (isLoading) {
    return (
      <div className="vt">
        <SkeletonLoader type="kpi-row" count={3} />
        <SkeletonLoader type="grid" count={8} />
      </div>
    );
  }

  if (!data || data.periods.length === 0) {
    return (
      <div className="vt">
        <div className="vt__empty">
          <h3>No variance data</h3>
          <p>Planned budgets and actual cost entries are needed to compute variance analysis.</p>
        </div>
      </div>
    );
  }

  const { periods, categories, totals, totalTrend, summary } = data;
  const overallVarianceNum = parseFloat(summary.overallVariancePercent);

  return (
    <div className="vt">
      {/* KPI Cards */}
      <div className="vt__kpi-row">
        <div className="vt__kpi-card">
          <span className="vt__kpi-label">OVERALL VARIANCE</span>
          <div className="vt__kpi-value-row">
            <span className="vt__kpi-value">{formatINR(summary.overallVariance)}</span>
            <span className={`vt__kpi-badge ${RAG_CLASSES[summary.overallRag] ?? ''}`}>
              {overallVarianceNum > 0 ? '+' : ''}{overallVarianceNum.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="vt__kpi-card">
          <span className="vt__kpi-label">CATEGORIES OVER BUDGET</span>
          <div className="vt__kpi-value-row">
            <span className="vt__kpi-value">
              {summary.categoriesOverBudget} of {summary.totalCategories}
            </span>
            <span className={`vt__kpi-badge ${summary.categoriesOverBudget > 0 ? RAG_CLASSES['AMBER'] : RAG_CLASSES['GREEN']}`}>
              {summary.categoriesOverBudget > 0 ? 'Amber' : 'Green'}
            </span>
          </div>
        </div>
        <div className="vt__kpi-card">
          <span className="vt__kpi-label">BEST PERFORMING</span>
          <span className="vt__kpi-value">{summary.bestPerforming ?? 'N/A'}</span>
          {summary.bestPerforming && (
            <span className={`vt__kpi-badge ${RAG_CLASSES['GREEN']}`}>Green</span>
          )}
        </div>
      </div>

      {/* Variance Grid */}
      <div className="vt__grid-section">
        <h3 className="vt__section-title">Monthly Variance Analysis (%)</h3>
        <div className="vt__grid-wrapper">
          <table className="vt__grid">
            <thead>
              <tr>
                <th className="vt__sticky-col">CATEGORY</th>
                {periods.map((p) => (
                  <th key={p}>{p.split('-')[1]?.toUpperCase()}</th>
                ))}
                <th>TREND</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.categoryType}>
                  <td className="vt__sticky-col vt__cat-label">{cat.categoryLabel}</td>
                  {periods.map((p) => (
                    <VarianceCellDisplay key={p} cell={cat.months[p]} />
                  ))}
                  <td className="vt__cell"><TrendArrow trend={cat.trend} /></td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="vt__totals-row">
                <td className="vt__sticky-col vt__cat-label"><strong>TOTAL VARIANCE</strong></td>
                {periods.map((p) => (
                  <VarianceCellDisplay key={p} cell={totals[p]} />
                ))}
                <td className="vt__cell"><TrendArrow trend={totalTrend} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart */}
      {categories.length > 0 && periods.length > 1 && (
        <div className="vt__chart-section">
          <h3 className="vt__section-title">Variance Trend</h3>
          <Chart style={{ height: 300 }}>
            <ChartLegend position="bottom" />
            <ChartTooltip format="{0}%" />
            <ChartCategoryAxis>
              <ChartCategoryAxisItem categories={periods} />
            </ChartCategoryAxis>
            <ChartValueAxis>
              <ChartValueAxisItem labels={{ format: '{0}%' }} title={{ text: 'Variance %' }} />
            </ChartValueAxis>
            <ChartSeries>
              {categories.slice(0, 4).map((cat) => (
                <ChartSeriesItem
                  key={cat.categoryType}
                  name={cat.categoryLabel}
                  type="line"
                  data={periods.map((p) => {
                    const cell = cat.months[p];
                    return cell ? parseFloat(cell.variancePercent) : 0;
                  })}
                  markers={{ visible: true, size: 4 }}
                />
              ))}
            </ChartSeries>
          </Chart>
        </div>
      )}
    </div>
  );
}
