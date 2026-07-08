import type { Applicant } from '../../types';
import { getAttentionInfo, daysWaiting, matchToStars } from '../../utils/helpers';
import { Badge, MatchScoreBadge } from '../ui/Badge';

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
  const { reasons, recommendedAction, score } = getAttentionInfo(applicant);
  const waiting = daysWaiting(applicant);
  const needsFlag = score > 0;

  return (
    <button
      type="button"
      className={`queue-row ${selected ? 'queue-row--selected' : ''}`}
      onClick={onSelect}
      aria-selected={selected}
    >
      <div className="queue-row__top">
        <StarRating score={applicant.matchScore} />
        {needsFlag && <span className="queue-row__flag">Needs Attention</span>}
      </div>

      <div className="queue-row__identity">
        <span className="queue-row__name">{applicant.name}</span>
        <span className="queue-row__role">{applicant.appliedRole}</span>
      </div>

      <div className="queue-row__metrics">
        <MatchScoreBadge score={applicant.matchScore} />
        <Badge label={applicant.stage} variant="stage" />
      </div>

      <ul className="queue-row__reasons">
        {reasons.slice(0, 3).map((r) => (
          <li key={r}>{r}</li>
        ))}
        {reasons.length === 0 && waiting > 0 && <li>In queue · {waiting}d</li>}
      </ul>

      <div className="queue-row__footer">
        <span className="queue-row__source">{applicant.applicationSource}</span>
        <span className="queue-row__rec">
          <strong>Recommended</strong> {recommendedAction}
        </span>
      </div>
    </button>
  );
}
