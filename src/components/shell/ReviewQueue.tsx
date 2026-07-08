import type { Applicant, FilterState } from '../../types';
import type { BriefingLine } from '../../utils/helpers';
import { FilterBar } from '../FilterBar';
import { QueueRow } from './QueueRow';
import { EmptyState } from '../ui/EmptyState';

interface ReviewQueueProps {
  title: string;
  briefing: BriefingLine[];
  applicants: Applicant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ReviewQueue({
  title,
  briefing,
  applicants,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
  emptyTitle = 'No candidates',
  emptyDescription = 'Nothing matches your current filters.',
}: ReviewQueueProps) {
  return (
    <section className="queue-panel">
      <header className="queue-panel__header">
        <h1 className="queue-panel__title">{title}</h1>
        <span className="queue-panel__count">{applicants.length} in queue</span>
      </header>

      {briefing.length > 0 && (
        <div className="briefing">
          {briefing.map((line) => (
            <div key={line.text} className={`briefing__line briefing__line--${line.tone}`}>
              {line.text}
            </div>
          ))}
        </div>
      )}

      <FilterBar filters={filters} onChange={onFiltersChange} />

      <div className="queue-panel__list">
        {applicants.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          applicants.map((a) => (
            <QueueRow
              key={a.id}
              applicant={a}
              selected={selectedId === a.id}
              onSelect={() => onSelect(a.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
