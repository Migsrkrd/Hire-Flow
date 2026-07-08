import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '—', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">{icon}</span>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__desc">{description}</p>
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
