import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Card({ title, subtitle, children, className = '', action }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      {(title || action) && (
        <div className="card__header">
          <div>
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: 'blue' | 'amber' | 'purple' | 'green' | 'rose';
}

export function StatCard({ label, value, hint, accent = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </div>
  );
}
