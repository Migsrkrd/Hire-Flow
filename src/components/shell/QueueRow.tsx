import type { Applicant } from '../../types';
import { getAttentionInfo, matchToStars } from '../../utils/helpers';

interface QueueRowProps {
  applicant: Applicant;
  selected: boolean;
  onSelect: () => void;
}

function StarRating({ score }: { score: number }) {
  const stars = matchToStars(score);
  return (
    <span className="stars" aria-label={`${stars} of 5 star match`}>
      {'★'.repeat(stars)}
      <span className="stars__dim">{'★'.repeat(5 - stars)}</span>
    </span>
  );
}

export function QueueRow({ applicant, selected, onSelect }: QueueRowProps) {
  const { reasons, recommendedAction, urgency } = getAttentionInfo(applicant);

  return (
    <button
      type="button"
      className={`queue-row queue-row--${urgency} ${selected ? 'queue-row--selected' : ''}`}
      onClick={onSelect}
      aria-selected={selected}
    >
      <div className="queue-row__top">
        <StarRating score={applicant.matchScore} />
        <span className="queue-row__role">{applicant.appliedRole}</span>
      </div>

      <div className="queue-row__identity">
        <span className="queue-row__name">{applicant.name}</span>
      </div>

      <ul className="queue-row__reasons">
        {reasons.slice(0, 3).map((r) => (
          <li key={r}>{r}</li>
        ))}
        {reasons.length === 0 && <li>In queue — no urgent signals</li>}
      </ul>

      <div className="queue-row__footer">
        <span className="queue-row__cta">{recommendedAction}</span>
      </div>
    </button>
  );
}
