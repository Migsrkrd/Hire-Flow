import { useState, useEffect } from 'react';
import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { Applicant } from '../../types';
import { RECRUITER_REC_LABELS } from '../../types';
import {
  formatDate,
  getAttentionInfo,
  hasDataQualityIssues,
} from '../../utils/helpers';
import { groupActivityByDay } from '../../utils/activity';
import { Badge, MatchScoreBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CandidateBriefProps {
  applicant: Applicant | null;
  mode: 'recruiter' | 'hiring_manager';
  nextUp?: Applicant | null;
  highPriorityCount?: number;
  onAfterAction?: (message: string) => void;
}

const REC_OPTIONS = ['strong_hire', 'worth_interviewing', 'hold', 'reject'] as const;

export function CandidateBrief({
  applicant,
  mode,
  nextUp = null,
  onAfterAction,
}: CandidateBriefProps) {
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

  useEffect(() => {
    setNoteText('');
    setFeedbackText(applicant?.hiringManagerFeedback ?? '');
  }, [applicant?.id, applicant?.hiringManagerFeedback]);

  if (!applicant) {
    return (
      <aside className="brief brief--empty">
        <h2 className="brief__title">Candidate</h2>
        <p className="brief__empty-text">
          Select someone from the queue. The queue stays open so you never lose context.
        </p>
      </aside>
    );
  }

  const isGenerating = generatingInsightsId === applicant.id;
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');
  const activityGroups = groupActivityByDay(applicant.activityFeed);
  const attention = getAttentionInfo(applicant);
  const recommended =
    applicant.aiSummary?.recommendedNextStep ??
    applicant.recommendedNextStep ??
    attention.recommendedAction;

  const done = (msg: string) => onAfterAction?.(msg);

  return (
    <aside className="brief brief--active" key={applicant.id}>
      <header className="brief__header">
        <div>
          <h2 className="brief__title">{applicant.name}</h2>
          <p className="brief__sub">{applicant.appliedRole}</p>
        </div>
        <div className="brief__badges">
          <MatchScoreBadge score={applicant.matchScore} />
          <Badge label={applicant.stage} variant="stage" />
        </div>
      </header>

      <div className="brief__recommended" role="status">
        <span className="brief__label">Recommended</span>
        <p>{recommended}</p>
      </div>

      {nextUp && (
        <div className="brief__next-up">
          After this → <strong>{nextUp.name}</strong>
        </div>
      )}

      <div className="brief__columns brief-fade-in">
        {/* LEFT — Profile */}
        <div className="brief__col brief__col--profile">
          <span className="brief__col-label">Profile</span>

          <dl className="brief__meta">
            <dt>Experience</dt>
            <dd>{applicant.yearsOfExperience} years</dd>
            <dt>Location</dt>
            <dd>{applicant.location}</dd>
            <dt>Source</dt>
            <dd>{applicant.applicationSource}</dd>
            <dt>Applied</dt>
            <dd>{formatDate(applicant.appliedDate)}</dd>
          </dl>

          <div className="brief__links">
            {applicant.portfolioUrl ? (
              <a href={applicant.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>
            ) : (
              <span className="brief__muted">No portfolio</span>
            )}
            {applicant.githubUrl && (
              <a href={applicant.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            )}
            {applicant.linkedinUrl && (
              <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
            )}
          </div>

          {hasDataQualityIssues(applicant) && (
            <div className="brief__alert">Incomplete application — verify before deciding.</div>
          )}

          <div className="brief__section">
            <span className="brief__label">Resume</span>
            <p className="brief__resume">{applicant.resumeHighlights}</p>
            <div className="skill-tags">
              {applicant.skills.map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="brief__section">
            <span className="brief__label">Why in queue</span>
            <ul className="brief__why-list">
              {attention.reasons.length > 0 ? (
                attention.reasons.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li>No urgent signals</li>
              )}
            </ul>
          </div>

          <div className="brief__section">
            <span className="brief__label">Timeline</span>
            {activityGroups.length === 0 ? (
              <p className="brief__muted">No activity yet.</p>
            ) : (
              activityGroups.slice(0, 2).map((group) => (
                <div key={group.label} className="activity-group">
                  <span className="activity-group__label">{group.label}</span>
                  <ul className="activity-group__list">
                    {group.events.slice(0, 4).map((e) => (
                      <li key={e.id}>{e.message}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER — Decision context */}
        <div className="brief__col brief__col--insights">
          <span className="brief__col-label">Decision context</span>

          {mode === 'hiring_manager' && (
            <div className="brief__why">
              <span className="brief__label">Recruiter recommendation</span>
              <p>
                {applicant.recruiterRecommendation
                  ? RECRUITER_REC_LABELS[applicant.recruiterRecommendation]
                  : 'Not set yet'}
              </p>
            </div>
          )}

          <section className="brief__section brief__ai">
            <div className="brief__section-head">
              <span className="brief__label">AI Insights</span>
              {mode === 'recruiter' && !applicant.aiSummary && !isGenerating && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    generateSummary(applicant.id);
                  }}
                >
                  Generate
                </Button>
              )}
            </div>

            {isGenerating ? (
              <div className="brief__ai-loading">
                <span className="brief__spinner" />
                Analyzing…
              </div>
            ) : applicant.aiSummary ? (
              <div className="brief__ai-content">
                <div className="brief__confidence">
                  Confidence <strong>{applicant.aiSummary.confidence}%</strong>
                </div>
                <p className="brief__ai-summary">{applicant.aiSummary.summary}</p>
                <div className="brief__ai-grid">
                  <div>
                    <h4>Strengths</h4>
                    <ul>{applicant.aiSummary.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                  <div>
                    <h4>Risks</h4>
                    <ul className="brief__risks">
                      {applicant.aiSummary.concerns.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                </div>
                {applicant.aiSummary.redFlags.length > 0 && (
                  <div className="brief__red-flags">
                    <h4>Red flags</h4>
                    <ul>{applicant.aiSummary.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>
                  </div>
                )}
                {applicant.suggestedQuestions.length > 0 && (
                  <div className="brief__questions">
                    <h4>Recommended questions</h4>
                    <ol>{applicant.suggestedQuestions.slice(0, 3).map((q) => <li key={q}>{q}</li>)}</ol>
                  </div>
                )}
              </div>
            ) : (
              <p className="brief__ai-empty">
                {mode === 'recruiter'
                  ? 'Generate AI Insights to reduce decision time.'
                  : 'AI Insights not generated yet.'}
              </p>
            )}
          </section>

          {mode === 'recruiter' && (
            <section className="brief__section">
              <span className="brief__label">Recruiter notes</span>
              {applicant.recruiterNotes.length > 0 && (
                <ul className="brief__notes">
                  {applicant.recruiterNotes.map((n, i) => (
                    <li key={`${n}-${i}`}>{n}</li>
                  ))}
                </ul>
              )}
              <textarea
                placeholder="Add note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  addRecruiterNote(applicant.id, noteText);
                  setNoteText('');
                }}
              >
                Add note
              </Button>
            </section>
          )}

          {(applicant.hiringManagerFeedback || mode === 'hiring_manager') && (
            <section className="brief__section">
              <span className="brief__label">
                {mode === 'hiring_manager' ? 'Your feedback' : 'Interview / HM feedback'}
              </span>
              {mode === 'recruiter' && applicant.hiringManagerFeedback && (
                <p>{applicant.hiringManagerFeedback}</p>
              )}
              {mode === 'hiring_manager' && (
                <textarea
                  placeholder="Optional note for recruiting…"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
              )}
            </section>
          )}

          {mode === 'recruiter' && (
            <section className="brief__section">
              <span className="brief__label">Your recommendation</span>
              <div className="brief__rec-btns">
                {REC_OPTIONS.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    className={`rec-btn ${applicant.recruiterRecommendation === rec ? 'rec-btn--active' : ''} ${rec === 'reject' ? 'rec-btn--reject' : ''}`}
                    onClick={() => setRecruiterRecommendation(applicant.id, rec)}
                  >
                    {RECRUITER_REC_LABELS[rec]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — Actions */}
        <div className="brief__col brief__col--actions">
          <span className="brief__col-label">Actions</span>

          {mode === 'recruiter' ? (
            <div className="brief__action-stack">
              {!applicant.aiSummary && (
                <Button onClick={() => generateSummary(applicant.id)} disabled={isGenerating}>
                  Generate AI Summary
                </Button>
              )}

              <div className="brief__action-row">
                <select value={selectedHm} onChange={(e) => setSelectedHm(e.target.value)}>
                  {hiringManagers.map((hm) => (
                    <option key={hm.id} value={hm.id}>{hm.name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  sendToHiringManager(applicant.id, selectedHm);
                  done('Sent to hiring manager.');
                }}
              >
                Send to Hiring Manager
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  requestInterview(applicant.id);
                  done('Interview scheduled.');
                }}
              >
                Schedule Interview
              </Button>

              <Button
                variant="danger"
                onClick={() => {
                  rejectCandidate(applicant.id);
                  done('Rejected.');
                }}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div className="brief__action-stack">
              <p className="brief__action-hint">Make a decision. Queue updates immediately.</p>
              <Button
                variant="success"
                onClick={() => {
                  submitHmFeedback(applicant.id, feedbackText, 'strong_yes');
                  done('Approved.');
                }}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  submitHmFeedback(applicant.id, feedbackText, 'maybe');
                  done('Requested more information.');
                }}
              >
                Request More Information
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  submitHmFeedback(applicant.id, feedbackText, 'no');
                  done('Rejected.');
                }}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  requestInterview(applicant.id);
                  done('Interview requested.');
                }}
              >
                Request Interview
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  approveNextStage(applicant.id);
                  done('Advanced.');
                }}
              >
                Advance Stage
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
