import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { NavView } from '../../types';
import {
  getGreeting,
  getNextInQueue,
  isHighPriority,
  sortByAttention,
} from '../../utils/helpers';
import { LeftRail } from './LeftRail';
import { TodayHome } from './TodayHome';
import { DecisionWorkspace } from './DecisionWorkspace';
import { PipelineHealthPanel } from './PipelineHealthPanel';
import { SettingsPanel } from './SettingsPanel';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

export function AppShell() {
  const { currentUser, applicants, isSynced, syncApplicants, showToast } = useApp();
  const [activeView, setActiveView] = useState<NavView>('today');
  const [reviewing, setReviewing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const sessionIdsRef = useRef<Set<string>>(new Set());

  const isRecruiter = currentUser?.role === 'recruiter';
  const firstName = currentUser?.name.split(' ')[0] ?? '';

  const pool = useMemo(() => {
    if (!currentUser) return [];
    if (isRecruiter) {
      return applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
    }
    return applicants.filter(
      (a) =>
        a.assignedHiringManager === currentUser.id &&
        a.stage !== 'Rejected' &&
        a.status !== 'Closed' &&
        (!a.hiringManagerDecision || a.stage === 'Interview' || a.stage === 'Offer'),
    );
  }, [applicants, currentUser, isRecruiter]);

  const workQueue = useMemo(() => {
    const high = sortByAttention(pool.filter(isHighPriority));
    return high.length > 0 ? high : sortByAttention(pool);
  }, [pool]);

  const selected = applicants.find((a) => a.id === selectedId) ?? null;
  const selectedIndex = workQueue.findIndex((a) => a.id === selectedId);
  const nextUp = useMemo(() => getNextInQueue(workQueue, selectedId), [workQueue, selectedId]);
  const greeting = getGreeting(firstName);

  useEffect(() => {
    if (!isRecruiter && activeView === 'insights') setActiveView('today');
  }, [isRecruiter, activeView]);

  useEffect(() => {
    setActiveView('today');
    setReviewing(false);
    setSelectedId(null);
    setCompletedCount(0);
    setSessionTotal(0);
    sessionIdsRef.current = new Set();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!reviewing) return;
    if (selectedId && !workQueue.find((a) => a.id === selectedId)) {
      const next = workQueue[0] ?? null;
      if (next) setSelectedId(next.id);
      else {
        setReviewing(false);
        setSelectedId(null);
      }
    }
  }, [workQueue, selectedId, reviewing]);

  const startReviewing = useCallback(() => {
    const first = workQueue[0];
    if (!first) return;
    if (sessionTotal === 0) {
      setSessionTotal(workQueue.length);
      sessionIdsRef.current = new Set(workQueue.map((a) => a.id));
    }
    setSelectedId(first.id);
    setReviewing(true);
    setActiveView('today');
  }, [workQueue, sessionTotal]);

  const exitReview = useCallback(() => {
    setReviewing(false);
    setSelectedId(null);
    setActiveView('today');
  }, []);

  const navigate = useCallback((view: NavView) => {
    setReviewing(false);
    setSelectedId(null);
    setActiveView(view);
  }, []);

  const advanceToNext = useCallback(
    (message: string) => {
      if (selectedId && sessionIdsRef.current.has(selectedId)) {
        setCompletedCount((c) => c + 1);
      }
      const remaining = workQueue.filter((a) => a.id !== selectedId);
      const next = remaining[0] ?? null;
      if (next) {
        setSelectedId(next.id);
        showToast(`${message} Now review ${next.name}.`, 'info');
      } else {
        setReviewing(false);
        setSelectedId(null);
        showToast(`${message} Queue complete.`, 'success');
      }
    },
    [workQueue, selectedId, showToast],
  );

  if (!isSynced) {
    return (
      <div className="shell">
        <LeftRail activeView={activeView} onNavigate={navigate} />
        <div className="shell__workspace shell__workspace--centered">
          {isRecruiter ? (
            <EmptyState
              title="Import your applicants"
              description="Bring them in once. HireFlow will tell you what deserves attention today."
              action={<Button onClick={syncApplicants}>Import Applicants</Button>}
            />
          ) : (
            <EmptyState
              title="Waiting on applicants"
              description="When recruiting imports applicants, your decisions will appear here."
            />
          )}
        </div>
      </div>
    );
  }

  if (!isRecruiter && pool.length === 0 && activeView === 'today' && !reviewing) {
    return (
      <div className="shell">
        <LeftRail activeView={activeView} onNavigate={navigate} />
        <div className="shell__workspace shell__workspace--centered">
          <EmptyState
            title="No decisions waiting"
            description="When a recruiter sends you a candidate, they'll show up here."
          />
        </div>
      </div>
    );
  }

  const renderWorkspace = () => {
    if (reviewing && selected) {
      const total = Math.max(sessionTotal, completedCount + workQueue.length);
      return (
        <DecisionWorkspace
          applicant={selected}
          mode={isRecruiter ? 'recruiter' : 'hiring_manager'}
          position={Math.max(1, selectedIndex + 1)}
          total={workQueue.length}
          completedCount={completedCount}
          sessionTotal={total}
          nextName={nextUp && nextUp.id !== selected.id ? nextUp.name : null}
          onAfterAction={advanceToNext}
          onExit={exitReview}
        />
      );
    }

    if (activeView === 'insights') {
      return (
        <PipelineHealthPanel
          applicants={isRecruiter ? applicants : pool}
          title="Insights"
          description="Optional context only. Return to Today when you're ready to work."
          mode="analytics"
        />
      );
    }

    if (activeView === 'settings') {
      return <SettingsPanel />;
    }

    return (
      <TodayHome
        greeting={greeting}
        queue={workQueue}
        completedCount={completedCount}
        sessionTotal={sessionTotal || workQueue.length}
        onReview={startReviewing}
      />
    );
  };

  return (
    <div className={`shell ${reviewing ? 'shell--reviewing' : ''}`}>
      <LeftRail activeView={activeView} onNavigate={navigate} reviewing={reviewing} />
      <div className="shell__workspace">{renderWorkspace()}</div>
    </div>
  );
}
