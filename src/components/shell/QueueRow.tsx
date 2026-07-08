import type { Applicant } from '../../types';
import { getAttentionInfo, daysWaiting } from '../../utils/helpers';
import { Badge, MatchScoreBadge } from '../ui/Badge';

interface QueueRowProps {
  applicant: Applicant;
  selected: boolean;
  onSelect: () => void;
}

export function QueueRow({ applicant, selected, onSelect }: QueueRowProps) {
  const { reasons } = getAttentionInfo(applicant);
  const waiting = daysWaiting(applicant);
  const primaryReason = reasons[0];

  return (
    <button
      type="button"
      className={`queue-row ${selected ? 'queue-row--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="queue-row__primary">
        <span className="queue-row__name">{applicant.name}</span>
        <span className="queue-row__role">{applicant.appliedRole}</span>
      </div>
      <div className="queue-row__metrics">
        <MatchScoreBadge score={applicant.matchScore} />
        <Badge label={applicant.stage} variant="stage" />
      </div>
      <div className="queue-row__meta">
        <span className="queue-row__source">{applicant.applicationSource}</span>
        <span className="queue-row__wait">{waiting}d waiting</span>
      </div>
      {primaryReason && (
        <div className="queue-row__attention">
          <Badge label={primaryReason} variant="attention" />
        </div>
      )}
    </button>
  );
}
