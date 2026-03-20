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
import { useBurnRevenue } from '../hooks/useBurnRevenue';
import { SkeletonLoader } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import './BurnRevenueTab.css';

interface BurnRevenueTabProps {
  projectId: number;
}

export function BurnRevenueTab({ projectId }: BurnRevenueTabProps) {
  const { data, isLoading } = useBurnRevenue(projectId);

  if (isLoading) {
    return (
      <div className="brt">
        <SkeletonLoader type="kpi-row" count={3} />
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <div className="brt">
        <div className="brt__empty">
          <h3>No data available</h3>
          <p>Cost entries and payment milestones are needed to generate the burn vs revenue timeline.</p>
        </div>
      </div>
    );
  }

  const { timeline, summary } = data;
  const categories = timeline.map((t) => t.month);
  const spendSeries = timeline.map((t) => parseFloat(t.cumulativeSpend));
  const revenueSeries = timeline.map((t) => parseFloat(t.cumulativeRevenue));

  const gapNum = parseFloat(summary.currentGap);
  const isDeficit = summary.status === 'DEFICIT';

  return (
    <div className="brt">
      {/* KPI Cards */}
      <div className="brt__kpi-row">
        <div className="brt__kpi-card">
          <span className="brt__kpi-label">CURRENT GAP</span>
          <span className={`brt__kpi-value ${isDeficit ? 'brt__kpi-value--red' : 'brt__kpi-value--green'}`}>
            {formatINR(summary.currentGap)}
          </span>
          <span className={`brt__kpi-badge ${isDeficit ? 'brt__kpi-badge--red' : 'brt__kpi-badge--green'}`}>
            {summary.status}
          </span>
        </div>
        <div className="brt__kpi-card">
          <span className="brt__kpi-label">TOTAL SPEND</span>
          <span className="brt__kpi-value">{formatINR(summary.totalSpend)}</span>
        </div>
        <div className="brt__kpi-card">
          <span className="brt__kpi-label">TOTAL REVENUE</span>
          <span className="brt__kpi-value">{formatINR(summary.totalRevenue)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="brt__chart-section">
        <h3 className="brt__section-title">Cumulative Performance</h3>
        <p className="brt__section-sub">Spend vs Revenue realization across project lifecycle</p>

        <Chart style={{ height: 360 }}>
          <ChartLegend position="bottom" />
          <ChartTooltip format="{0:c0}" />
          <ChartCategoryAxis>
            <ChartCategoryAxisItem categories={categories} labels={{ rotation: -45 }} />
          </ChartCategoryAxis>
          <ChartValueAxis>
            <ChartValueAxisItem
              labels={{ format: '{0:c0}' }}
              title={{ text: 'Amount (₹)' }}
            />
          </ChartValueAxis>
          <ChartSeries>
            <ChartSeriesItem
              name="Cumulative Spend"
              type="line"
              data={spendSeries}
              color="var(--color-primary)"
              markers={{ visible: true, size: 6 }}
            />
            <ChartSeriesItem
              name="Cumulative Revenue"
              type="line"
              data={revenueSeries}
              color="var(--color-green)"
              markers={{ visible: true, type: 'diamond', size: 8 }}
            />
          </ChartSeries>
        </Chart>
      </div>

      {/* Payment Milestones Table */}
      <div className="brt__milestones-section">
        <h3 className="brt__section-title">Payment Milestones</h3>
        <table className="brt__milestone-table">
          <thead>
            <tr>
              <th>MONTH</th>
              <th>MONTHLY SPEND</th>
              <th>PAYMENT</th>
              <th>GAP</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((entry) => (
              <tr key={entry.month}>
                <td>{entry.month}</td>
                <td className="brt__cell-right">{formatINR(entry.monthlySpend)}</td>
                <td className="brt__cell-right">{formatINR(entry.paymentAmount)}</td>
                <td className={`brt__cell-right ${entry.status === 'DEFICIT' ? 'brt__cell--red' : 'brt__cell--green'}`}>
                  {formatINR(entry.gap)}
                </td>
                <td>
                  <span className={`brt__status-badge ${entry.status === 'DEFICIT' ? 'brt__status-badge--red' : 'brt__status-badge--green'}`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
