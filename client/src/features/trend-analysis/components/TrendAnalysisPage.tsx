import { formatINR } from '../../../config/constants';
import './TrendAnalysisPage.css';

const benchmarkData = [
  { category: 'Employee Salary', avg3m: '420000', current: '465000', direction: 'up' },
  { category: 'Subscriptions', avg3m: '32000', current: '28000', direction: 'down' },
  { category: 'Travel', avg3m: '85000', current: '92000', direction: 'up' },
  { category: 'Contractor', avg3m: '180000', current: '195000', direction: 'up' },
  { category: 'Infrastructure', avg3m: '45000', current: '40000', direction: 'down' },
];

export function TrendAnalysisPage() {
  return (
    <div className="trend-analysis">
      <div className="trend-analysis__header">
        <div>
          <h1 className="trend-analysis__title">Trend Analysis</h1>
        </div>
      </div>

      <div className="trend-analysis__kpis">
        <div className="trend-analysis__kpi-card">
          <span className="trend-analysis__kpi-label">Current Month</span>
          <span className="trend-analysis__kpi-value">{formatINR('620000')}</span>
        </div>
        <div className="trend-analysis__kpi-card">
          <span className="trend-analysis__kpi-label">Previous Month</span>
          <span className="trend-analysis__kpi-value">{formatINR('552000')}</span>
        </div>
        <div className="trend-analysis__kpi-card">
          <span className="trend-analysis__kpi-label">MoM Change</span>
          <span className="trend-analysis__kpi-value trend-analysis__kpi-value--up">+12.3%</span>
        </div>
      </div>

      <div className="trend-analysis__section-card">
        <h2 className="trend-analysis__section-title">Monthly Burn Rate Trend</h2>
        <div className="trend-analysis__placeholder">
          <span className="trend-analysis__placeholder-text">Monthly burn rate line/bar chart will be rendered here</span>
        </div>
      </div>

      <div className="trend-analysis__bottom-grid">
        <div className="trend-analysis__section-card">
          <h2 className="trend-analysis__section-title">Top Variance Categories</h2>
          <div className="trend-analysis__placeholder">
            <span className="trend-analysis__placeholder-text">Variance breakdown chart will be rendered here</span>
          </div>
        </div>

        <div className="trend-analysis__section-card">
          <h2 className="trend-analysis__section-title">Benchmark Comparison</h2>
          <table className="trend-analysis__table">
            <thead>
              <tr>
                <th>Category</th>
                <th>3M Avg</th>
                <th>Current</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row) => (
                <tr key={row.category}>
                  <td className="trend-analysis__cell--name">{row.category}</td>
                  <td className="trend-analysis__cell--money">{formatINR(row.avg3m)}</td>
                  <td className="trend-analysis__cell--money">{formatINR(row.current)}</td>
                  <td className="trend-analysis__cell--direction">
                    <span className={`trend-analysis__arrow trend-analysis__arrow--${row.direction}`}>
                      {row.direction === 'up' ? '\u2191' : '\u2193'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
