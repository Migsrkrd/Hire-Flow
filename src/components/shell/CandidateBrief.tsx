import { useState, useEffect } from 'react';
import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { Applicant } from '../../types';
import { RECRUITER_REC_LABELS } from '../../types';
import { formatDate, hasDataQualityIssues } from '../../utils/helpers';
import { groupActivityByDay } from '../../utils/activity';
import { Badge, MatchScoreBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CandidateBriefProps {
  applicant: Applicant | null;
  mode: 'recruiter' | 'hiring_manager';
}

const REC_OPTIONS = ['strong_hire', 'worth_interviewing', 'hold', 'reject'] as const;

export function CandidateBrief({ applicant, mode }: CandidateBriefProps) {
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
        <h2 className="brief__title">Candidate Brief</h2>
        <p className="brief__empty-text">
          Select a candidate from the queue. Every row explains why they surfaced — the brief gives you context to act.
        </p>
      </aside>
    );
  }

  const isGenerating = generatingInsightsId === applicant.id;
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');
  const activityGroups = groupActivityByDay(applicant.activityFeed);

  return (
    <aside className="brief brief--active" key={applicant.id}>
      <header className="brief__header">
        <h2 className="brief__title">Candidate Brief</h2>
      </header>

      <div className="brief__content brief-fade-in">
        <div className="brief__identity">
          <h3 className="brief__name">{applicant.name}</h3>
          <p className="brief__sub">{applicant.appliedRole}</p>
          <div className="brief__badges">
            <MatchScoreBadge score={applicant.matchScore} />
            <Badge label={applicant.stage} variant="stage" />
          </div>
        </div>

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

        {(applicant.portfolioUrl || applicant.githubUrl || applicant.linkedinUrl) && (
          <div className="brief__links">
            {applicant.portfolioUrl && (
              <a href={applicant.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>
            )}
            {applicant.githubUrl && (
              <a href={applicant.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            )}
            {applicant.linkedinUrl && (
              <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
            )}
          </div>
        )}

        {hasDataQualityIssues(applicant) && (
          <div className="brief__alert">Incomplete data from ATS import — verify before deciding</div>
        )}

        {applicant.recommendedNextStep && (
          <div className="brief__next">
            <span className="brief__label">Recommended next step</span>
            <p>{applicant.recommendedNextStep}</p>
          </div>
        )}

        {mode === 'hiring_manager' && (
          <div className="brief__why">
            <span className="brief__label">Why you're reviewing this</span>
            <p>
              {applicant.recruiterRecommendation
                ? `Recruiter recommendation: ${RECRUITER_REC_LABELS[applicant.recruiterRecommendation]}.`
                : 'Recruiter has not set a recommendation yet.'}
              {' '}Assigned for {applicant.stage === 'Interview' ? 'interview debrief' : 'hiring decision'}.
            </p>
          </div>
        )}

        <section className="brief__section brief__ai">
          <div className="brief__section-head">
            <span className="brief__label">AI Insights</span>
            {mode === 'recruiter' && !applicant.aiSummary && !isGenerating && (
              <Button size="sm" variant="secondary" onClick={() => generateSummary(applicant.id)}>
                Generate Insights
              </Button>
            )}
          </div>

          {isGenerating ? (
            <div className="brief__ai-loading">
              <span className="brief__spinner" />
              Analyzing application data…
            </div>
          ) : applicant.aiSummary ? (
            <div className="brief__ai-content">
              <div className="brief__confidence">
                Confidence <strong>{applicant.aiSummary.confidence}%</strong>
              </div>
              <p className="brief__ai-summary">
                <span className="brief__label">Executive summary</span>
                {applicant.aiSummary.summary}
              </p>
              <div className="brief__ai-grid">
                <div>
                  <h4>Strengths</h4>
                  <ul>{applicant.aiSummary.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div>
                  <h4>Risks</h4>
                  <ul className="brief__risks">{applicant.aiSummary.concerns.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              </div>
              {applicant.aiSummary.redFlags.length > 0 && (
                <div className="brief__red-flags">
                  <h4>Potential red flags</h4>
                  <ul>{applicant.aiSummary.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              )}
              <p className="brief__ai-step">
                <strong>Recommended:</strong> {applicant.aiSummary.recommendedNextStep}
              </p>
              {applicant.suggestedQuestions.length > 0 && (
                <div className="brief__questions">
                  <h4>Suggested interview questions</h4>
                  <ol>{applicant.suggestedQuestions.map((q) => <li key={q}>{q}</li>)}</ol>
                </div>
              )}
            </div>
          ) : (
            <p className="brief__ai-empty">
              AI Insights haven't been generated for this candidate yet.
            </p>
          )}
        </section>

        <section className="brief__section">
          <span className="brief__label">Resume highlights</span>
          <p className="brief__resume">{applicant.resumeHighlights}</p>
          <div className="skill-tags">
            {applicant.skills.map((s) => (
              <span key={s} className="skill-tag">{s}</span>
            ))}
          </div>
        </section>

        {mode === 'recruiter' && (
          <>
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
                placeholder="Add internal note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
              />
              <Button size="sm" variant="secondary" onClick={() => { addRecruiterNote(applicant.id, noteText); setNoteText(''); }}>
                Add note
              </Button>
            </section>

            <section className="brief__section">
              <span className="brief__label">Recommendation</span>
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
          </>
        )}

        {(applicant.hiringManagerFeedback || mode === 'hiring_manager') && (
          <section className="brief__section">
            <span className="brief__label">Hiring manager feedback</span>
            {mode === 'recruiter' && applicant.hiringManagerFeedback && (
              <p>{applicant.hiringManagerFeedback}</p>
            )}
            {mode === 'hiring_manager' && (
              <textarea
                placeholder="Your feedback for the recruiting team…"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
            )}
          </section>
        )}

        <section className="brief__section">
          <span className="brief__label">Activity feed</span>
          {activityGroups.length === 0 ? (
            <p className="brief__muted">No activity yet — actions you take will appear here.</p>
          ) : (
            activityGroups.map((group) => (
              <div key={group.label} className="activity-group">
                <span className="activity-group__label">{group.label}</span>
                <ul className="activity-group__list">
                  {group.events.map((e) => (
                    <li key={e.id}>{e.message}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="brief__section brief__actions">
          <span className="brief__label">Actions</span>
          {mode === 'recruiter' ? (
            <>
              <div className="brief__action-row">
                <select value={selectedHm} onChange={(e) => setSelectedHm(e.target.value)}>
                  {hiringManagers.map((hm) => (
                    <option key={hm.id} value={hm.id}>{hm.name}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => sendToHiringManager(applicant.id, selectedHm)}>
                  Send to HM
                </Button>
              </div>
              <div className="brief__action-btns">
                <Button size="sm" variant="danger" onClick={() => rejectCandidate(applicant.id)}>
                  Reject
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="brief__action-btns">
                <Button size="sm" variant="success" onClick={() => submitHmFeedback(applicant.id, feedbackText, 'strong_yes')}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => submitHmFeedback(applicant.id, feedbackText, 'maybe')}>
                  Maybe
                </Button>
                <Button size="sm" variant="danger" onClick={() => submitHmFeedback(applicant.id, feedbackText, 'no')}>
                  Reject
                </Button>
              </div>
              <div className="brief__action-btns">
                <Button size="sm" onClick={() => requestInterview(applicant.id)}>Request interview</Button>
                <Button size="sm" variant="success" onClick={() => approveNextStage(applicant.id)}>Approve next stage</Button>
              </div>
            </>
          )}
        </section>
      </div>
    </aside>
  );
}
