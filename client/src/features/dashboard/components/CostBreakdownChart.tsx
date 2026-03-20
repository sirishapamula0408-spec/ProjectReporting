import 'hammerjs';
import {
  Chart,
  ChartSeries,
  ChartSeriesItem,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartValueAxis,
  ChartValueAxisItem,
  ChartTooltip,
  ChartLegend,
} from '@progress/kendo-react-charts';

interface CostBreakdownChartProps {
  data: Array<{ category: string; planned: string; actual: string }>;
}

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const categories = data.map((c) => c.category);
  const planned = data.map((c) => parseFloat(c.planned || '0'));
  const actual = data.map((c) => parseFloat(c.actual || '0'));

  return (
    <Chart style={{ height: 300 }}>
      <ChartLegend position="bottom" />
      <ChartTooltip format="{0:c}" />
      <ChartCategoryAxis>
        <ChartCategoryAxisItem categories={categories} labels={{ rotation: -45 }} />
      </ChartCategoryAxis>
      <ChartValueAxis>
        <ChartValueAxisItem
          labels={{ format: '{0:c0}' }}
          title={{ text: 'Amount (INR)' }}
        />
      </ChartValueAxis>
      <ChartSeries>
        <ChartSeriesItem
          type="bar"
          data={planned}
          name="Planned"
          color="var(--color-primary-light)"
        />
        <ChartSeriesItem
          type="bar"
          data={actual}
          name="Actual"
          color="var(--color-primary)"
        />
      </ChartSeries>
    </Chart>
  );
}
