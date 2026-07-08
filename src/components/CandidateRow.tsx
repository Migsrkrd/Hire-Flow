import type { Applicant } from '../types';
import { formatDate, hasDataQualityIssues, needsAttention } from '../utils/helpers';
import { Badge, MatchScoreBadge } from './ui/Badge';

interface CandidateRowProps {
  applicant: Applicant;
  onClick: () => void;
}

export function CandidateRow({ applicant, onClick }: CandidateRowProps) {
  const attention = needsAttention(applicant);
  const qualityWarning = hasDataQualityIssues(applicant);

  return (
    <button type="button" className="candidate-row" onClick={onClick}>
      <div className="candidate-row__main">
        <div className="candidate-row__name">
          <strong>{applicant.name}</strong>
          {attention && <Badge label="Needs attention" variant="attention" />}
          {qualityWarning && <Badge label="Data quality" variant="warning" />}
        </div>
        <span className="candidate-row__meta">
          {applicant.appliedRole} · {applicant.location} · Applied {formatDate(applicant.appliedDate)}
        </span>
        <div className="candidate-row__skills">
          {applicant.skills.slice(0, 4).map((s) => (
            <span key={s} className="skill-tag">
              {s}
            </span>
          ))}
          {applicant.skills.length > 4 && (
            <span className="skill-tag skill-tag--more">+{applicant.skills.length - 4}</span>
          )}
        </div>
      </div>
      <div className="candidate-row__aside">
        <MatchScoreBadge score={applicant.matchScore} />
        <Badge label={applicant.stage} variant="stage" />
        <span className="candidate-row__source">{applicant.applicationSource}</span>
      </div>
    </button>
  );
}
