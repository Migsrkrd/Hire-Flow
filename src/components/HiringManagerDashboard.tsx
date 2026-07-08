import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../types';
import { CandidateDetail } from './CandidateDetail';
import { Layout } from './Layout';
import { MatchScoreBadge, Badge } from './ui/Badge';
import { StatCard } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';

export function HiringManagerDashboard() {
  const { currentUser, applicants, isSynced } = useApp();
  const [selected, setSelected] = useState<Applicant | null>(null);

  const myCandidates = useMemo(
    () => applicants.filter((a) => a.assignedHiringManager === currentUser?.id),
    [applicants, currentUser],
  );

  const stats = useMemo(() => {
    const active = myCandidates.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
    return {
      awaiting: active.filter((a) => !a.hiringManagerFeedback).length,
      interviews: active.filter((a) => a.stage === 'Interview').length,
      strong: active.filter((a) => a.matchScore >= 85).length,
      decisions: active.filter(
        (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerDecision,
      ).length,
    };
  }, [myCandidates]);

  if (!isSynced) {
    return (
      <Layout>
        <EmptyState
          icon="⏳"
          title="Waiting on recruiter sync"
          description="Your recruiting team hasn't synced applicants yet. Once they do, candidates assigned to you will appear here."
        />
      </Layout>
    );
  }

  if (myCandidates.length === 0) {
    return (
      <Layout>
        <div className="page">
          <header className="page__header page__header--hm">
            <div>
              <h1>Your candidates</h1>
              <p className="page__subtitle">
                Focused view — only people assigned to you for feedback
              </p>
            </div>
          </header>
          <EmptyState
            icon="✨"
            title="No candidates assigned yet"
            description="When a recruiter sends you someone to review, they'll show up here with a summary, match score, and recommended next action — not the full cluttered application."
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page page--hm">
        <header className="page__header page__header--hm">
          <div>
            <h1>Decision dashboard</h1>
            <p className="page__subtitle">
              {myCandidates.length} candidates assigned · skip the noise, focus on decisions
            </p>
          </div>
        </header>

        <div className="stat-grid stat-grid--hm">
          <StatCard label="Awaiting feedback" value={stats.awaiting} accent="amber" />
          <StatCard label="Interviews this week" value={stats.interviews} accent="blue" />
          <StatCard label="Strong matches" value={stats.strong} accent="green" hint="85%+ match" />
          <StatCard label="Decisions needed" value={stats.decisions} accent="rose" />
        </div>

        <div className="hm-cards">
          {myCandidates.map((a) => (
            <article key={a.id} className="hm-card">
              <div className="hm-card__top">
                <div>
                  <h3>{a.name}</h3>
                  <span className="hm-card__role">{a.appliedRole}</span>
                </div>
                <MatchScoreBadge score={a.matchScore} />
              </div>

              {a.aiSummary ? (
                <p className="hm-card__summary">{a.aiSummary.summary}</p>
              ) : (
                <p className="hm-card__summary hm-card__summary--pending">
                  Summary pending — recruiter may still be processing this application.
                </p>
              )}

              <div className="hm-card__skills">
                {a.skills.slice(0, 5).map((s) => (
                  <span key={s} className="skill-tag">
                    {s}
                  </span>
                ))}
              </div>

              {a.concerns.length > 0 && (
                <div className="hm-card__concerns">
                  <strong>Potential concerns</strong>
                  <ul>
                    {a.concerns.slice(0, 2).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {a.recruiterRecommendation && (
                <div className="hm-card__rec">
                  <strong>Recruiter says</strong>
                  <p>{a.recruiterRecommendation}</p>
                </div>
              )}

              <div className="hm-card__footer">
                <Badge label={a.stage} variant="stage" />
                <span className="hm-card__next">{a.recommendedNextStep || 'Review and decide'}</span>
              </div>

              <Button className="hm-card__cta" onClick={() => setSelected(a)}>
                Review & decide
              </Button>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <CandidateDetail
          applicant={applicants.find((a) => a.id === selected.id) ?? selected}
          mode="hiring_manager"
          onClose={() => setSelected(null)}
        />
      )}
    </Layout>
  );
}
