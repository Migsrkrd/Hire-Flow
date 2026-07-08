import { useState } from 'react';
import { USERS } from '../data/users';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../types';
import { formatDate, hasDataQualityIssues } from '../utils/helpers';
import { Badge, MatchScoreBadge } from './ui/Badge';
import { Button } from './ui/Button';

interface CandidateDetailProps {
  applicant: Applicant;
  mode: 'recruiter' | 'hiring_manager';
  onClose: () => void;
}

export function CandidateDetail({ applicant, mode, onClose }: CandidateDetailProps) {
  const {
    generateSummary,
    addRecruiterNote,
    sendToHiringManager,
    advanceStage,
    rejectCandidate,
    submitHmFeedback,
    requestInterview,
    approveNextStage,
  } = useApp();

  const [noteText, setNoteText] = useState('');
  const [feedbackText, setFeedbackText] = useState(applicant.hiringManagerFeedback);
  const [selectedHm, setSelectedHm] = useState('hm-marcus');

  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');
  const qualityWarning = hasDataQualityIssues(applicant);

  return (
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${applicant.name} profile`}
      >
        <header className="drawer__header">
          <div>
            <h2>{applicant.name}</h2>
            <p>
              {applicant.appliedRole} · {applicant.location}
            </p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="drawer__badges">
          <MatchScoreBadge score={applicant.matchScore} />
          <Badge label={applicant.stage} variant="stage" />
          <Badge label={applicant.status} variant="default" />
          <Badge label={applicant.applicationSource} variant="source" />
        </div>

        {qualityWarning && (
          <div className="drawer__alert drawer__alert--warning">
            Data quality warning — this candidate is missing key information from the external application.
          </div>
        )}

        {applicant.recommendedNextStep && (
          <div className="drawer__next-step">
            <strong>Recommended next step</strong>
            <p>{applicant.recommendedNextStep}</p>
          </div>
        )}

        <section className="drawer__section">
          <h3>Application details</h3>
          <dl className="detail-grid">
            <dt>Applied</dt>
            <dd>{formatDate(applicant.appliedDate)}</dd>
            <dt>Experience</dt>
            <dd>{applicant.yearsOfExperience} years</dd>
            <dt>Source</dt>
            <dd>{applicant.applicationSource}</dd>
            <dt>Skills</dt>
            <dd>
              <div className="skill-list">
                {applicant.skills.map((s) => (
                  <span key={s} className="skill-tag">
                    {s}
                  </span>
                ))}
              </div>
            </dd>
          </dl>
        </section>

        <section className="drawer__section">
          <h3>Resume highlights</h3>
          <p className="drawer__text">{applicant.resumeHighlights}</p>
        </section>

        {(applicant.portfolioUrl || applicant.githubUrl || applicant.linkedinUrl) && (
          <section className="drawer__section">
            <h3>Links</h3>
            <ul className="link-list">
              {applicant.portfolioUrl && <li><a href="#" onClick={(e) => e.preventDefault()}>{applicant.portfolioUrl}</a></li>}
              {applicant.githubUrl && <li><a href="#" onClick={(e) => e.preventDefault()}>{applicant.githubUrl}</a></li>}
              {applicant.linkedinUrl && <li><a href="#" onClick={(e) => e.preventDefault()}>{applicant.linkedinUrl}</a></li>}
            </ul>
          </section>
        )}

        <section className="drawer__section">
          <div className="drawer__section-header">
            <h3>AI summary</h3>
            {mode === 'recruiter' && !applicant.aiSummary && (
              <Button size="sm" onClick={() => generateSummary(applicant.id)}>
                Generate AI Summary
              </Button>
            )}
          </div>
          {applicant.aiSummary ? (
            <div className="ai-summary">
              <p>{applicant.aiSummary.summary}</p>
              <div className="ai-summary__cols">
                <div>
                  <h4>Strengths</h4>
                  <ul>
                    {applicant.aiSummary.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Concerns</h4>
                  <ul>
                    {applicant.aiSummary.concerns.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="drawer__muted">No summary yet — generate one to get strengths, concerns, and next steps.</p>
          )}
        </section>

        {applicant.suggestedQuestions.length > 0 && (
          <section className="drawer__section">
            <h3>Suggested interview questions</h3>
            <ol className="question-list">
              {applicant.suggestedQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>
        )}

        {mode === 'recruiter' && (
          <>
            <section className="drawer__section">
              <h3>Internal notes</h3>
              {applicant.recruiterNotes.length > 0 && (
                <ul className="notes-list">
                  {applicant.recruiterNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="note-form">
                <textarea
                  placeholder="Add an internal note…"
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

            <section className="drawer__section drawer__actions">
              <h3>Actions</h3>
              <div className="action-row">
                <select value={selectedHm} onChange={(e) => setSelectedHm(e.target.value)}>
                  {hiringManagers.map((hm) => (
                    <option key={hm.id} value={hm.id}>
                      Send to {hm.name}
                    </option>
                  ))}
                </select>
                <Button onClick={() => sendToHiringManager(applicant.id, selectedHm)}>
                  Send to HM
                </Button>
              </div>
              <div className="action-buttons">
                <Button variant="secondary" onClick={() => advanceStage(applicant.id, 'Recruiter Screen')}>
                  Advance stage
                </Button>
                <Button variant="secondary" onClick={() => advanceStage(applicant.id, 'Interview')}>
                  Schedule interview
                </Button>
                <Button variant="danger" onClick={() => rejectCandidate(applicant.id)}>
                  Reject
                </Button>
              </div>
            </section>
          </>
        )}

        {mode === 'hiring_manager' && (
          <section className="drawer__section drawer__actions drawer__actions--hm">
            <h3>Your decision</h3>
            {applicant.recruiterRecommendation && (
              <div className="hm-recruiter-rec">
                <strong>Recruiter recommendation</strong>
                <p>{applicant.recruiterRecommendation}</p>
              </div>
            )}
            <textarea
              placeholder="Leave feedback for the recruiting team…"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
            />
            <div className="hm-decision-buttons">
              <Button
                variant="success"
                onClick={() => submitHmFeedback(applicant.id, feedbackText, 'strong_yes')}
              >
                Strong yes
              </Button>
              <Button
                variant="secondary"
                onClick={() => submitHmFeedback(applicant.id, feedbackText, 'maybe')}
              >
                Maybe
              </Button>
              <Button
                variant="danger"
                onClick={() => submitHmFeedback(applicant.id, feedbackText, 'no')}
              >
                No
              </Button>
            </div>
            <div className="action-buttons">
              <Button onClick={() => requestInterview(applicant.id)}>Request interview</Button>
              <Button variant="success" onClick={() => approveNextStage(applicant.id)}>
                Approve next stage
              </Button>
              <Button variant="danger" onClick={() => rejectCandidate(applicant.id)}>
                Reject
              </Button>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
