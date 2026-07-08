import { useState, useEffect } from 'react';
import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { Applicant } from '../../types';
import {
  buildTimeline,
  formatDate,
  hasDataQualityIssues,
} from '../../utils/helpers';
import { Badge, MatchScoreBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CandidateBriefProps {
  applicant: Applicant | null;
  mode: 'recruiter' | 'hiring_manager';
}

export function CandidateBrief({ applicant, mode }: CandidateBriefProps) {
  const {
    generateSummary,
    generatingInsightsId,
    addRecruiterNote,
    sendToHiringManager,
    advanceStage,
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
        <p className="brief__empty-text">Select a candidate from the queue to review their brief.</p>
      </aside>
    );
  }

  const isGenerating = generatingInsightsId === applicant.id;
  const qualityWarning = hasDataQualityIssues(applicant);
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');
  const timeline = buildTimeline(applicant);

  return (
    <aside className="brief brief--active" key={applicant.id}>
      <header className="brief__header">
        <h2 className="brief__title">Candidate Brief</h2>
      </header>

      <div className="brief__content brief-fade-in">
        <div className="brief__identity">
          <h3 className="brief__name">{applicant.name}</h3>
          <p className="brief__sub">
            {applicant.appliedRole} · {applicant.location}
          </p>
          <div className="brief__badges">
            <MatchScoreBadge score={applicant.matchScore} />
            <Badge label={applicant.stage} variant="stage" />
            <Badge label={applicant.applicationSource} variant="source" />
          </div>
        </div>

        {qualityWarning && (
          <div className="brief__alert">Missing key details from external application</div>
        )}

        {applicant.recommendedNextStep && (
          <div className="brief__next">
            <span className="brief__section-label">Recommended next step</span>
            <p>{applicant.recommendedNextStep}</p>
          </div>
        )}

        {mode === 'hiring_manager' && (
          <div className="brief__why">
            <span className="brief__section-label">Why this candidate is here</span>
            <p>
              Assigned to you for {applicant.stage === 'Interview' ? 'interview debrief' : 'hiring decision'}.
              {applicant.recruiterRecommendation
                ? ` Recruiter notes: "${applicant.recruiterRecommendation}"`
                : ' Recruiter has not added a recommendation yet.'}
            </p>
          </div>
        )}

        <section className="brief__section brief__ai">
          <div className="brief__section-head">
            <span className="brief__section-label">AI Insights</span>
            {mode === 'recruiter' && !applicant.aiSummary && !isGenerating && (
              <Button size="sm" variant="secondary" onClick={() => generateSummary(applicant.id)}>
                Generate Insights
              </Button>
            )}
          </div>

          {isGenerating ? (
            <div className="brief__ai-loading">
              <span className="brief__spinner" />
              Generating insights from application data…
            </div>
          ) : applicant.aiSummary ? (
            <div className="brief__ai-content">
              <p className="brief__ai-summary">{applicant.aiSummary.summary}</p>
              <div className="brief__ai-grid">
                <div>
                  <h4>Strengths</h4>
                  <ul>
                    {applicant.aiSummary.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Risks</h4>
                  <ul className="brief__risks">
                    {applicant.aiSummary.concerns.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {applicant.suggestedQuestions.length > 0 && (
                <div className="brief__questions">
                  <h4>Suggested interview questions</h4>
                  <ol>
                    {applicant.suggestedQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <p className="brief__ai-empty">
              AI insights have not been generated for this candidate yet.
            </p>
          )}
        </section>

        <section className="brief__section">
          <span className="brief__section-label">Application</span>
          <dl className="brief__dl">
            <dt>Applied</dt>
            <dd>{formatDate(applicant.appliedDate)}</dd>
            <dt>Experience</dt>
            <dd>{applicant.yearsOfExperience} years</dd>
            <dt>Skills</dt>
            <dd>
              <div className="skill-tags">
                {applicant.skills.map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            </dd>
          </dl>
          <p className="brief__resume">{applicant.resumeHighlights}</p>
        </section>

        {mode === 'recruiter' && (
          <section className="brief__section">
            <span className="brief__section-label">Recruiter notes</span>
            {applicant.recruiterNotes.length > 0 && (
              <ul className="brief__notes">
                {applicant.recruiterNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="brief__note-form">
              <textarea
                placeholder="Add internal note…"
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
            </div>
          </section>
        )}

        {(applicant.hiringManagerFeedback || mode === 'hiring_manager') && (
          <section className="brief__section">
            <span className="brief__section-label">Hiring manager feedback</span>
            {applicant.hiringManagerFeedback && mode === 'recruiter' && (
              <p className="brief__feedback">{applicant.hiringManagerFeedback}</p>
            )}
            {mode === 'hiring_manager' && (
              <>
                {applicant.recruiterRecommendation && (
                  <div className="brief__rec">
                    <strong>Recruiter recommendation</strong>
                    <p>{applicant.recruiterRecommendation}</p>
                  </div>
                )}
                <textarea
                  placeholder="Leave feedback for recruiting…"
                  value={feedbackText || applicant.hiringManagerFeedback}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
              </>
            )}
          </section>
        )}

        <section className="brief__section">
          <span className="brief__section-label">Timeline</span>
          <ul className="brief__timeline">
            {timeline.map((t) => (
              <li key={t.event}>
                <span className="brief__timeline-date">{formatDate(t.date)}</span>
                <span>{t.event}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="brief__section brief__actions">
          <span className="brief__section-label">Actions</span>
          {mode === 'recruiter' ? (
            <>
              <div className="brief__action-row">
                <select value={selectedHm} onChange={(e) => setSelectedHm(e.target.value)}>
                  {hiringManagers.map((hm) => (
                    <option key={hm.id} value={hm.id}>Send to {hm.name}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => sendToHiringManager(applicant.id, selectedHm)}>
                  Send to HM
                </Button>
              </div>
              <div className="brief__action-btns">
                <Button size="sm" variant="secondary" onClick={() => advanceStage(applicant.id, 'Recruiter Screen')}>
                  Advance stage
                </Button>
                <Button size="sm" variant="secondary" onClick={() => advanceStage(applicant.id, 'Interview')}>
                  Schedule interview
                </Button>
                <Button size="sm" variant="danger" onClick={() => rejectCandidate(applicant.id)}>
                  Reject
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="brief__action-btns">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() =>
                    submitHmFeedback(
                      applicant.id,
                      feedbackText || applicant.hiringManagerFeedback,
                      'strong_yes',
                    )
                  }
                >
                  Strong yes
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    submitHmFeedback(
                      applicant.id,
                      feedbackText || applicant.hiringManagerFeedback,
                      'maybe',
                    )
                  }
                >
                  Maybe
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    submitHmFeedback(
                      applicant.id,
                      feedbackText || applicant.hiringManagerFeedback,
                      'no',
                    )
                  }
                >
                  No
                </Button>
              </div>
              <div className="brief__action-btns">
                <Button size="sm" onClick={() => requestInterview(applicant.id)}>
                  Request interview
                </Button>
                <Button size="sm" variant="success" onClick={() => approveNextStage(applicant.id)}>
                  Approve next stage
                </Button>
                <Button size="sm" variant="danger" onClick={() => rejectCandidate(applicant.id)}>
                  Reject
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </aside>
  );
}
