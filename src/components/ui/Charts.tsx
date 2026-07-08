interface BarChartProps {
  title: string;
  data: Record<string, number>;
  maxValue?: number;
  colorClass?: string;
}

export function BarChart({ title, data, maxValue, colorClass = 'chart-bar--blue' }: BarChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = maxValue ?? Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="chart">
      <h4 className="chart__title">{title}</h4>
      <div className="chart__bars">
        {entries.length === 0 ? (
          <p className="chart__empty">No data yet</p>
        ) : (
          entries.map(([label, value]) => (
            <div key={label} className="chart__row">
              <span className="chart__label" title={label}>
                {label}
              </span>
              <div className="chart__track">
                <div
                  className={`chart__bar ${colorClass}`}
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <span className="chart__value">{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ScoreChartProps {
  title: string;
  data: Record<string, number>;
}

export function ScoreChart({ title, data }: ScoreChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="chart">
      <h4 className="chart__title">{title}</h4>
      <div className="chart__bars">
        {entries.length === 0 ? (
          <p className="chart__empty">No data yet</p>
        ) : (
          entries.map(([label, value]) => (
            <div key={label} className="chart__row">
              <span className="chart__label" title={label}>
                {label}
              </span>
              <div className="chart__track">
                <div
                  className={`chart__bar chart-bar--score chart-bar--${scoreColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="chart__value">{value}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 85) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}
