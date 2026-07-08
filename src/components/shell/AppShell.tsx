import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { FilterState, NavView } from '../../types';
import {
  computeBriefing,
  filterApplicants,
  sortByAttention,
} from '../../utils/helpers';
import { LeftRail } from './LeftRail';
import { ReviewQueue } from './ReviewQueue';
import { PipelineHealthPanel } from './PipelineHealthPanel';
import { CandidateBrief } from './CandidateBrief';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  role: 'all',
  stage: 'all',
  minMatchScore: 0,
  experienceLevel: 'all',
  status: 'all',
};

export function AppShell() {
  const { currentUser, applicants, isSynced, syncApplicants } = useApp();
  const [activeView, setActiveView] = useState<NavView>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const isRecruiter = currentUser?.role === 'recruiter';

  const pool = useMemo(() => {
    if (!currentUser) return [];
    if (isRecruiter) return applicants;
    return applicants.filter((a) => a.assignedHiringManager === currentUser.id);
  }, [applicants, currentUser, isRecruiter]);

  const viewPool = useMemo(() => {
    switch (activeView) {
      case 'interviews':
        return pool.filter((a) => a.stage === 'Interview');
      case 'decisions':
        return pool.filter(
          (a) =>
            a.stage === 'Hiring Manager Review' ||
            a.stage === 'Offer' ||
            a.status === 'Pending Decision',
        );
      default:
        return pool;
    }
  }, [pool, activeView]);

  const queue = useMemo(
    () => sortByAttention(filterApplicants(viewPool, filters)),
    [viewPool, filters],
  );

  const briefing = useMemo(
    () => computeBriefing(pool, currentUser?.role ?? 'recruiter'),
    [pool, currentUser],
  );

  const selected = applicants.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    if (!isRecruiter && activeView === 'pipeline') {
      setActiveView('inbox');
    }
  }, [isRecruiter, activeView]);

  useEffect(() => {
    setActiveView('inbox');
    setSelectedId(null);
    setFilters(DEFAULT_FILTERS);
  }, [currentUser?.id]);

  useEffect(() => {
    if (queue.length > 0 && !selectedId) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  useEffect(() => {
    if (selectedId && !queue.find((a) => a.id === selectedId)) {
      setSelectedId(queue[0]?.id ?? null);
    }
  }, [queue, selectedId]);

  const queueTitle = isRecruiter
    ? activeView === 'inbox'
      ? 'Hiring Inbox'
      : activeView === 'interviews'
        ? 'Interviews'
        : activeView === 'decisions'
          ? 'Decisions'
          : 'Review Queue'
    : activeView === 'inbox'
      ? 'Decision Queue'
      : activeView === 'decisions'
        ? 'Decisions Needed'
        : activeView === 'interviews'
          ? 'Interviews'
          : 'Review Queue';

  if (!isSynced) {
    return (
      <div className="shell">
        <LeftRail activeView={activeView} onNavigate={setActiveView} />
        <div className="shell__workspace shell__workspace--centered">
          {isRecruiter ? (
            <EmptyState
              icon="↻"
              title="Sync to get started"
              description="Pull applicants from the external ATS into your Hiring Inbox. HireFlow will surface what needs attention first."
              action={<Button onClick={syncApplicants}>Sync Applicants</Button>}
            />
          ) : (
            <EmptyState
              icon="◌"
              title="Waiting on recruiter sync"
              description="Your recruiting team hasn't synced applicants yet. Assigned candidates will appear in your Decision Queue."
            />
          )}
        </div>
        <CandidateBrief applicant={null} mode={isRecruiter ? 'recruiter' : 'hiring_manager'} />
      </div>
    );
  }

  if (!isRecruiter && pool.length === 0) {
    return (
      <div className="shell">
        <LeftRail activeView={activeView} onNavigate={setActiveView} />
        <div className="shell__workspace shell__workspace--centered">
          <EmptyState
            icon="◎"
            title="No candidates assigned"
            description="When a recruiter sends you someone to review, they'll appear in your Decision Queue with AI insights and a clear recommendation."
          />
        </div>
        <CandidateBrief applicant={null} mode="hiring_manager" />
      </div>
    );
  }

  return (
    <div className="shell">
      <LeftRail activeView={activeView} onNavigate={setActiveView} />
      <div className="shell__workspace">
        {activeView === 'pipeline' ? (
          <PipelineHealthPanel applicants={pool} />
        ) : (
          <ReviewQueue
            title={queueTitle}
            briefing={activeView === 'inbox' ? briefing : []}
            applicants={queue}
            selectedId={selectedId}
            onSelect={setSelectedId}
            filters={filters}
            onFiltersChange={setFilters}
            emptyTitle="Queue empty"
            emptyDescription={
              activeView === 'interviews'
                ? 'No candidates in interview stage.'
                : activeView === 'decisions'
                  ? 'No pending decisions right now.'
                  : 'Nothing matches your filters.'
            }
          />
        )}
      </div>
      <CandidateBrief
        applicant={selected}
        mode={isRecruiter ? 'recruiter' : 'hiring_manager'}
      />
    </div>
  );
}
