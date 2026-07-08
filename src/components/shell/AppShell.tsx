import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { FilterState, NavView, SmartView } from '../../types';
import {
  applySmartView,
  computeBriefing,
  filterApplicants,
  getGreeting,
  sortByAttention,
} from '../../utils/helpers';
import { LeftRail } from './LeftRail';
import { ReviewQueue } from './ReviewQueue';
import { PipelineHealthPanel } from './PipelineHealthPanel';
import { SettingsPanel } from './SettingsPanel';
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
  const [smartView, setSmartView] = useState<SmartView>('all');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const isRecruiter = currentUser?.role === 'recruiter';
  const firstName = currentUser?.name.split(' ')[0] ?? '';

  const pool = useMemo(() => {
    if (!currentUser) return [];
    if (isRecruiter) return applicants;
    return applicants.filter((a) => a.assignedHiringManager === currentUser.id);
  }, [applicants, currentUser, isRecruiter]);

  const viewPool = useMemo(() => {
    if (activeView === 'interviews') {
      return pool.filter((a) => a.stage === 'Interview');
    }
    if (activeView === 'decisions') {
      return pool.filter(
        (a) =>
          a.stage === 'Hiring Manager Review' ||
          a.stage === 'Offer' ||
          a.status === 'Pending Decision',
      );
    }
    return applySmartView(pool, smartView);
  }, [pool, activeView, smartView]);

  const queue = useMemo(
    () => sortByAttention(filterApplicants(viewPool, filters)),
    [viewPool, filters],
  );

  const briefing = useMemo(
    () => computeBriefing(pool, currentUser?.role ?? 'recruiter'),
    [pool, currentUser],
  );

  const selected = applicants.find((a) => a.id === selectedId) ?? null;
  const greeting = getGreeting(firstName);

  useEffect(() => {
    if (!isRecruiter && activeView === 'pipeline') setActiveView('inbox');
  }, [isRecruiter, activeView]);

  useEffect(() => {
    setActiveView('inbox');
    setSelectedId(null);
    setSmartView('all');
    setFilters(DEFAULT_FILTERS);
    setShowFilters(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (queue.length > 0 && !selectedId) setSelectedId(queue[0].id);
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
      : activeView === 'interviews'
        ? 'Interviews'
        : 'Decisions Needed';

  const renderMiddle = () => {
    if (activeView === 'pipeline') {
      return <PipelineHealthPanel applicants={isRecruiter ? applicants : pool} />;
    }
    if (activeView === 'settings') {
      return <SettingsPanel />;
    }
    return (
      <ReviewQueue
        title={queueTitle}
        greeting={activeView === 'inbox' ? greeting : undefined}
        briefing={activeView === 'inbox' ? briefing : []}
        applicants={queue}
        selectedId={selectedId}
        onSelect={setSelectedId}
        smartView={smartView}
        onSmartViewChange={setSmartView}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        emptyTitle="Queue clear"
        emptyDescription="Nothing needs your attention in this view right now."
      />
    );
  };

  if (!isSynced) {
    return (
      <div className="shell">
        <LeftRail activeView={activeView} onNavigate={setActiveView} />
        <div className="shell__workspace shell__workspace--centered">
          {isRecruiter ? (
            <EmptyState
              icon="↻"
              title="Connect to your ATS"
              description="Sync applicants from your external ATS. HireFlow will prioritize who deserves your attention — not dump another list on you."
              action={<Button onClick={syncApplicants}>Sync from ATS</Button>}
            />
          ) : (
            <EmptyState
              icon="◌"
              title="Waiting on ATS sync"
              description="Your recruiting team hasn't synced yet. Assigned candidates will appear in your Decision Queue."
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
            title="No decisions waiting"
            description="When a recruiter assigns you a candidate, they'll appear here with AI Insights and a clear recommendation — not a cluttered application."
          />
        </div>
        <CandidateBrief applicant={null} mode="hiring_manager" />
      </div>
    );
  }

  return (
    <div className="shell">
      <LeftRail activeView={activeView} onNavigate={setActiveView} />
      <div className="shell__workspace">{renderMiddle()}</div>
      <CandidateBrief
        applicant={selected}
        mode={isRecruiter ? 'recruiter' : 'hiring_manager'}
      />
    </div>
  );
}
