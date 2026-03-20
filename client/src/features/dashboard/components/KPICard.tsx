import './KPICard.css';

interface KPICardProps {
  label: string;
  value: string | number;
  /** Optional CSS modifier: 'green' | 'amber' | 'red' | 'warning' */
  variant?: string;
  /** Trend direction for the arrow indicator */
  trend?: 'up' | 'down';
  /** Trend label text (e.g. "+5% from last month") */
  trendLabel?: string;
}

export function KPICard({ label, value, variant, trend, trendLabel }: KPICardProps) {
  const cardClass = ['kpi-card', variant ? `kpi-card--${variant}` : ''].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <span className="kpi-card__label">{label}</span>
      <span className="kpi-card__value">{value}</span>
      {trend && trendLabel && (
        <span className={`kpi-card__trend kpi-card__trend--${trend}`}>
          {trend === 'up' ? '\u25B2' : '\u25BC'} {trendLabel}
        </span>
      )}
    </div>
  );
}
