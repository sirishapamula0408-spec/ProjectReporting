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

interface BurnRateChartProps {
  data: Array<{ period: string; amount: string }>;
}

export default function BurnRateChart({ data }: BurnRateChartProps) {
  const periods = data.map((p) => p.period);
  const values = data.map((p) => parseFloat(p.amount || '0'));

  return (
    <Chart style={{ height: 300 }}>
      <ChartLegend visible={false} />
      <ChartTooltip format="{0:c}" />
      <ChartCategoryAxis>
        <ChartCategoryAxisItem categories={periods} labels={{ rotation: -45 }} />
      </ChartCategoryAxis>
      <ChartValueAxis>
        <ChartValueAxisItem
          labels={{ format: '{0:c0}' }}
          title={{ text: 'Amount (INR)' }}
        />
      </ChartValueAxis>
      <ChartSeries>
        <ChartSeriesItem
          type="line"
          data={values}
          color="var(--color-primary)"
          markers={{ visible: true, size: 6 }}
        />
      </ChartSeries>
    </Chart>
  );
}
