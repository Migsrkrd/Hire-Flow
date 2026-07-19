import { useState, useEffect, useMemo } from 'react';
import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { Applicant, PrimaryActionKind } from '../../types';
import { RECRUITER_REC_LABELS } from '../../types';
import {
  confidenceLabel,
  estimateReviewMinutes,
  formatDate,
  getAttentionInfo,
  getPrimaryAction,
  hasDataQualityIssues,
} from '../../utils/helpers';
import { groupActivityByDay } from '../../utils/activity';
import { MatchScoreBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DecisionWorkspaceProps {
  applicant: Applicant;
  mode: 'recruiter' | 'hiring_manager';
  position: number;
  total: number;
  completedCount: number;
  sessionTotal: number;
  nextName: string | null;
  onAfterAction: (message: string) => void;
  onExit: () => void;
}

export function DecisionWorkspace({
  applicant,
  mode,
  position,
  total,
  completedCount,
  sessionTotal,
  nextName,
  onAfterAction,
  onExit,
}: DecisionWorkspaceProps) {
  const {
    generateSummary,
    generatingInsightsId,
    addRecruiterNote,
    setRecruiterRecommendation,
    sendToHiringManager,
    rejectCandidate,
    submitHmFeedback,
    requestInterview,
    approveNextStage,
  } = useApp();

  const [noteText, setNoteText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedHm, setSelectedHm] = useState('hm-marcus');
  const [showMore, setShowMore] = useState(false);

  const attention = getAttentionInfo(applicant);
  const primary = getPrimaryAction(applicant, mode === 'recruiter' ? 'recruiter' : 'hiring_manager');
  const isGenerating = generatingInsightsId === applicant.id;
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');
  const activityGroups = groupActivityByDay(applicant.activityFeed);

  const progressPct = sessionTotal > 0 ? Math.round((completedCount / sessionTotal) * 100) : 0;
  const minutesLeft = estimateReviewMinutes(total);

  useEffect(() => {
    if (mode === 'recruiter' && !applicant.aiSummary && !isGenerating) {
      generateSummary(applicant.id);
    }
  }, [applicant.id, applicant.aiSummary, mode, isGenerating, generateSummary]);

  useEffect(() => {
    setNoteText('');
    setFeedbackText(applicant.hiringManagerFeedback ?? '');
    setShowMore(false);
  }, [applicant.id, applicant.hiringManagerFeedback]);

  const runPrimary = (kind: PrimaryActionKind) => {
    if (kind === 'send_to_hm') {
      if (!applicant.recruiterRecommendation) {
        setRecruiterRecommendation(applicant.id, 'worth_interviewing');
      }
      sendToHiringManager(applicant.id, selectedHm);
      onAfterAction('Candidate advanced.');
      return;
    }
    if (kind === 'reject') {
      if (mode === 'recruiter') {
        rejectCandidate(applicant.id);
      } else {
        submitHmFeedback(applicant.id, feedbackText, 'no');
      }
      onAfterAction('Candidate rejected.');
      return;
    }
    if (kind === 'approve') {
      submitHmFeedback(applicant.id, feedbackText, 'strong_yes');
      onAfterAction('Approved.');
      return;
    }
    if (kind === 'request_info') {
      submitHmFeedback(applicant.id, feedbackText, 'maybe');
      onAfterAction('More information requested.');
      return;
    }
    if (kind === 'schedule_interview') {
      requestInterview(applicant.id);
      onAfterAction('Interview scheduled.');
      return;
    }
    if (kind === 'advance') {
      if (mode === 'hiring_manager') {
        approveNextStage(applicant.id);
      } else {
        sendToHiringManager(applicant.id, selectedHm);
      }
      onAfterAction('Candidate advanced.');
    }
  };

  const displayReasons = useMemo(() => {
    const fromAttention = attention.reasons.slice(0, 3);
    if (fromAttention.length >= 2) return fromAttention;
    const extras = applicant.aiSummary?.strengths.slice(0, 2) ?? [];
    return [...new Set([...fromAttention, ...extras])].slice(0, 3);
  }, [attention.reasons, applicant.aiSummary]);

  const confidence = applicant.aiSummary?.confidence ?? Math.min(90, applicant.matchScore);

  return (
    <section className="decision" key={applicant.id}>
      <header className="decision__top">
        <button type="button" className="decision__back" onClick={onExit}>
          ← Today
        </button>
        <div className="decision__session">
          <div className="decision__session-meta">
            <span>
              Today&apos;s Queue · {completedCount} of {sessionTotal} completed
            </span>
            <span>
              {position} of {total} left
              {nextName ? ` · Next: ${nextName}` : ''}
            </span>
          </div>
          <div
            className="decision__bar"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="decision__bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="decision__eta">
            About {minutesLeft} minute{minutesLeft === 1 ? '' : 's'} remaining
          </p>
        </div>
      </header>

      <div className="decision__layout">
        <div className="decision__main">
          <div className="decision__identity">
            <div>
              <h1 className="decision__name">{applicant.name}</h1>
              <p className="decision__role">{applicant.appliedRole}</p>
            </div>
            <MatchScoreBadge score={applicant.matchScore} />
          </div>

          <div className="decision__recommend" role="status">
            <span className="decision__recommend-label">Suggested Next Step</span>
            <p className="decision__recommend-action">{primary.label}</p>
            <p className="decision__reason-label">Reason</p>
            <ul className="decision__reasons">
              {displayReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="decision__confidence">
              Confidence: <strong>{confidenceLabel(confidence)}</strong>
            </p>
          </div>

          {isGenerating && !applicant.aiSummary && (
            <p className="decision__preparing">Preparing suggestion…</p>
          )}

          {applicant.aiSummary && (
            <div className="decision__block">
              <span className="decision__label">Summary</span>
              <p>{applicant.aiSummary.summary}</p>
            </div>
          )}

          {mode === 'hiring_manager' && (
            <div className="decision__block">
              <span className="decision__label">Recruiter recommendation</span>
              <p>
                {applicant.recruiterRecommendation
                  ? RECRUITER_REC_LABELS[applicant.recruiterRecommendation]
                  : 'Not set'}
              </p>
            </div>
          )}

          <div className="decision__block">
            <span className="decision__label">Resume</span>
            <p>{applicant.resumeHighlights}</p>
            <div className="skill-tags">
              {applicant.skills.map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="decision__links">
            {applicant.portfolioUrl && (
              <a href={applicant.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>
            )}
            {applicant.githubUrl && (
              <a href={applicant.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            )}
            {applicant.linkedinUrl && (
              <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
            )}
            <span className="decision__meta-inline">
              {applicant.yearsOfExperience}y · {applicant.location} · Applied {formatDate(applicant.appliedDate)}
            </span>
          </div>

          {hasDataQualityIssues(applicant) && (
            <p className="decision__alert">Application looks incomplete — verify before advancing.</p>
          )}

          {(applicant.hiringManagerFeedback || mode === 'hiring_manager') && (
            <div className="decision__block">
              <span className="decision__label">
                {mode === 'hiring_manager' ? 'Your note (optional)' : 'Interview feedback'}
              </span>
              {mode === 'recruiter' && applicant.hiringManagerFeedback ? (
                <p>{applicant.hiringManagerFeedback}</p>
              ) : (
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Optional note…"
                  rows={2}
                />
              )}
            </div>
          )}

          {mode === 'recruiter' && (
            <div className="decision__block">
              <span className="decision__label">Notes</span>
              {applicant.recruiterNotes.length > 0 && (
                <ul className="decision__notes">
                  {applicant.recruiterNotes.map((n, i) => (
                    <li key={`${n}-${i}`}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="decision__note-row">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a quick note…"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    addRecruiterNote(applicant.id, noteText);
                    setNoteText('');
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="decision__more-toggle"
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? 'Hide details' : 'More details'}
          </button>

          {showMore && (
            <div className="decision__more">
              {applicant.aiSummary && (
                <>
                  <div className="decision__block">
                    <span className="decision__label">Strengths</span>
                    <ul>{applicant.aiSummary.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                  <div className="decision__block">
                    <span className="decision__label">Risks</span>
                    <ul className="brief__risks">
                      {applicant.aiSummary.concerns.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                </>
              )}
              <div className="decision__block">
                <span className="decision__label">Timeline</span>
                {activityGroups.length === 0 ? (
                  <p className="brief__muted">No activity yet.</p>
                ) : (
                  activityGroups.slice(0, 2).map((group) => (
                    <div key={group.label} className="activity-group">
                      <span className="activity-group__label">{group.label}</span>
                      <ul className="activity-group__list">
                        {group.events.slice(0, 3).map((e) => (
                          <li key={e.id}>{e.message}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="decision__actions">
          <Button
            className="decision__primary"
            variant={
              primary.kind === 'reject' ? 'danger' : primary.kind === 'approve' ? 'success' : 'primary'
            }
            onClick={() => runPrimary(primary.kind)}
          >
            {primary.label}
          </Button>

          {mode === 'recruiter' && primary.kind === 'send_to_hm' && (
            <label className="decision__hm">
              <span>Send to</span>
              <select value={selectedHm} onChange={(e) => setSelectedHm(e.target.value)}>
                {hiringManagers.map((hm) => (
                  <option key={hm.id} value={hm.id}>
                    {hm.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="decision__secondary">
            {mode === 'recruiter' ? (
              <>
                {primary.kind !== 'send_to_hm' && (
                  <button type="button" onClick={() => runPrimary('send_to_hm')}>
                    Advance Candidate
                  </button>
                )}
                {primary.kind !== 'schedule_interview' && (
                  <button type="button" onClick={() => runPrimary('schedule_interview')}>
                    Schedule Interview
                  </button>
                )}
                {primary.kind !== 'reject' && (
                  <button
                    type="button"
                    className="decision__secondary--danger"
                    onClick={() => runPrimary('reject')}
                  >
                    Reject Candidate
                  </button>
                )}
                <div className="decision__rec-quiet">
                  <span>Mark as</span>
                  {(['strong_hire', 'worth_interviewing', 'hold'] as const).map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      className={applicant.recruiterRecommendation === rec ? 'is-active' : ''}
                      onClick={() => setRecruiterRecommendation(applicant.id, rec)}
                    >
                      {RECRUITER_REC_LABELS[rec]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {primary.kind !== 'approve' && (
                  <button type="button" onClick={() => runPrimary('approve')}>
                    Approve
                  </button>
                )}
                {primary.kind !== 'request_info' && (
                  <button type="button" onClick={() => runPrimary('request_info')}>
                    Request Feedback
                  </button>
                )}
                {primary.kind !== 'reject' && (
                  <button
                    type="button"
                    className="decision__secondary--danger"
                    onClick={() => runPrimary('reject')}
                  >
                    Reject Candidate
                  </button>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
