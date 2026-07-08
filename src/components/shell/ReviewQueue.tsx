import type { Applicant, FilterState, SmartView } from '../../types';
import type { BriefingLine } from '../../utils/helpers';
import { SMART_VIEWS } from './smartViews';
import { FilterBar } from '../FilterBar';
import { QueueRow } from './QueueRow';
import { EmptyState } from '../ui/EmptyState';

interface ReviewQueueProps {
  title: string;
  greeting?: string;
  briefing: BriefingLine[];
  applicants: Applicant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  smartView: SmartView;
  onSmartViewChange: (view: SmartView) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ReviewQueue({
  title,
  greeting,
  briefing,
  applicants,
  selectedId,
  onSelect,
  smartView,
  onSmartViewChange,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  emptyTitle = 'Nothing here',
  emptyDescription = 'No candidates match this view.',
}: ReviewQueueProps) {
  return (
    <section className="queue-panel">
      <header className="queue-panel__header">
        <div>
          {greeting && <p className="queue-panel__greeting">{greeting}</p>}
          <h1 className="queue-panel__title">{title}</h1>
        </div>
        <span className="queue-panel__count">{applicants.length} prioritized</span>
      </header>

      {briefing.length > 0 && (
        <div className="briefing" role="status">
          {briefing.map((line) => (
            <p key={line.text} className={`briefing__line briefing__line--${line.tone}`}>
              {line.text}
            </p>
          ))}
        </div>
      )}

      <div className="smart-views">
        {SMART_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`smart-view ${smartView === view.id ? 'smart-view--active' : ''}`}
            onClick={() => onSmartViewChange(view.id)}
          >
            {view.label}
          </button>
        ))}
        <button
          type="button"
          className={`smart-view smart-view--filters ${showFilters ? 'smart-view--active' : ''}`}
          onClick={onToggleFilters}
        >
          Filters
        </button>
      </div>

      {showFilters && <FilterBar filters={filters} onChange={onFiltersChange} />}

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
