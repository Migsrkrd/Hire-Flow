import type { Applicant } from '../../types';
import { estimateReviewMinutes, getAttentionInfo, matchToStars } from '../../utils/helpers';
import { Button } from '../ui/Button';

interface TodayHomeProps {
  greeting: string;
  queue: Applicant[];
  completedCount: number;
  sessionTotal: number;
  onReview: () => void;
}

function Stars({ score }: { score: number }) {
  const n = matchToStars(score);
  return (
    <span className="stars" aria-hidden>
      {'★'.repeat(n)}
      <span className="stars__dim">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export function TodayHome({
  greeting,
  queue,
  completedCount,
  sessionTotal,
  onReview,
}: TodayHomeProps) {
  const remaining = queue.length;
  const total = Math.max(sessionTotal, completedCount + remaining);
  const minutes = estimateReviewMinutes(remaining);
  const focus = queue[0] ?? null;
  const attention = focus ? getAttentionInfo(focus) : null;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (remaining === 0) {
    return (
      <section className="today">
        <p className="today__greeting">{greeting}</p>
        <p className="today__eyebrow">Today&apos;s queue</p>
        <h1 className="today__headline">Today&apos;s queue is complete.</h1>
        <p className="today__sub">
          Great work. You&apos;re caught up.
          <br />
          We&apos;ll surface the next candidate as soon as one requires attention.
        </p>
        {completedCount > 0 && (
          <p className="today__done-count">{completedCount} decision{completedCount === 1 ? '' : 's'} finished today.</p>
        )}
      </section>
    );
  }

  return (
    <section className="today">
      <p className="today__greeting">{greeting}</p>

      <div className="today__queue-progress">
        <div className="today__queue-head">
          <span className="today__eyebrow">Today&apos;s Queue</span>
          <span className="today__queue-count">
            {completedCount} of {total} completed
          </span>
        </div>
        <div className="today__bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="today__bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="today__eta">
          {remaining} waiting · about {minutes} minute{minutes === 1 ? '' : 's'} remaining
        </p>
      </div>

      <p className="today__eyebrow today__eyebrow--focus">Today&apos;s Focus</p>
      <h1 className="today__headline">
        You have {remaining} hiring decision{remaining === 1 ? '' : 's'} waiting.
      </h1>

      {focus && attention && (
        <article className="today__focus">
          <div className="today__focus-top">
            <Stars score={focus.matchScore} />
            <span className="today__priority">Highest Priority</span>
          </div>
          <h2 className="today__focus-name">Review {focus.name}</h2>
          <ul className="today__focus-reasons">
            {attention.reasons.slice(0, 3).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Button className="today__cta" onClick={onReview}>
            Review Candidate
          </Button>
        </article>
      )}
    </section>
  );
}
