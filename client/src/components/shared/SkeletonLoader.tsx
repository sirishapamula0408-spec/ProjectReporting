import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'card' | 'grid' | 'chart' | 'text' | 'kpi-row';
  count?: number;
}

export function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (type) {
    case 'kpi-row':
      return (
        <div className="skeleton-kpi-row">
          {items.map((i) => (
            <div key={i} className="skeleton-kpi-card">
              <div className="skeleton skeleton--text" style={{ width: '60%' }} />
              <div className="skeleton skeleton--heading" style={{ width: '40%' }} />
              <div className="skeleton skeleton--text" style={{ width: '30%' }} />
            </div>
          ))}
        </div>
      );
    case 'grid':
      return (
        <div className="skeleton-grid">
          <div className="skeleton skeleton--header" />
          {items.map((i) => (
            <div key={i} className="skeleton skeleton--row" />
          ))}
        </div>
      );
    case 'chart':
      return <div className="skeleton skeleton--chart" />;
    case 'text':
      return (
        <div className="skeleton-text-block">
          {items.map((i) => (
            <div key={i} className="skeleton skeleton--text" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      );
    default:
      return (
        <div className="skeleton-cards">
          {items.map((i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      );
  }
}
