import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { EXTERNAL_ATS_APPLICANTS } from '../data/mockApplicants';
import type {
  Applicant,
  RecruiterRecommendation,
  ToastMessage,
  User,
} from '../types';
import { RECRUITER_REC_LABELS } from '../types';
import { mergeApplicantsFromAts, prependActivity } from '../utils/activity';
import { generateAISummary, generateInterviewQuestions } from '../utils/aiSimulation';
import { loadState, normalizeApplicant, saveState } from '../utils/helpers';
import { USERS } from '../data/users';

interface AppContextValue {
  currentUser: User | null;
  applicants: Applicant[];
  isSynced: boolean;
  lastSynced: string | null;
  toasts: ToastMessage[];
  generatingInsightsId: string | null;
  login: (user: User) => void;
  logout: () => void;
  syncApplicants: () => void;
  generateSummary: (id: string) => void;
  addRecruiterNote: (id: string, note: string) => void;
  setRecruiterRecommendation: (id: string, rec: RecruiterRecommendation) => void;
  sendToHiringManager: (id: string, hiringManagerId: string) => void;
  rejectCandidate: (id: string) => void;
  submitHmFeedback: (id: string, feedback: string, decision: Applicant['hiringManagerDecision']) => void;
  requestInterview: (id: string) => void;
  approveNextStage: (id: string) => void;
  showToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>(() => loadState().applicants);
  const [isSynced, setIsSynced] = useState(() => loadState().isSynced);
  const [lastSynced, setLastSynced] = useState<string | null>(() => loadState().lastSynced);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [generatingInsightsId, setGeneratingInsightsId] = useState<string | null>(null);
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: Applicant[], synced: boolean, syncedAt: string | null) => {
    saveState({ applicants: next, isSynced: synced, lastSynced: syncedAt });
  }, []);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateApplicants = useCallback(
    (updater: (prev: Applicant[]) => Applicant[]) => {
      setApplicants((prev) => {
        const next = updater(prev);
        persist(next, isSynced, lastSynced);
        return next;
      });
    },
    [isSynced, lastSynced, persist],
  );

  const login = useCallback((user: User) => setCurrentUser(user), []);
  const logout = useCallback(() => setCurrentUser(null), []);

  const syncApplicants = useCallback(() => {
    const now = new Date().toISOString();
    const incoming = EXTERNAL_ATS_APPLICANTS.map(normalizeApplicant);
    setApplicants((prev) => {
      const { merged, newCount, updatedCount } = mergeApplicantsFromAts(prev, incoming);
      persist(merged, true, now);
      const parts: string[] = [];
      if (newCount > 0) parts.push(`${newCount} new applicant${newCount === 1 ? '' : 's'} imported`);
      if (updatedCount > 0) parts.push(`${updatedCount} applicant${updatedCount === 1 ? '' : 's'} updated`);
      const msg = parts.length > 0 ? `Sync complete. ${parts.join('. ')}.` : 'Sync complete. No changes from ATS.';
      setTimeout(() => showToast(msg, 'info'), 0);
      return merged;
    });
    setIsSynced(true);
    setLastSynced(now);
  }, [persist, showToast]);

  const generateSummary = useCallback(
    (id: string) => {
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
      setGeneratingInsightsId(id);
      generateTimerRef.current = setTimeout(() => {
        updateApplicants((prev) =>
          prev.map((a) => {
            if (a.id !== id) return a;
            const aiSummary = generateAISummary(a)!;
            const suggestedQuestions = generateInterviewQuestions(a);
            return {
              ...a,
              aiSummary,
              suggestedQuestions,
              recommendedNextStep: aiSummary.recommendedNextStep,
              concerns: aiSummary.concerns,
              activityFeed: prependActivity(a, 'insights', 'AI Insights generated'),
            };
          }),
        );
        setGeneratingInsightsId(null);
        // Quiet — recommendation appears in the workspace; no toast
      }, 900);
    },
    [updateApplicants],
  );

  const addRecruiterNote = useCallback(
    (id: string, note: string) => {
      if (!note.trim()) return;
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                recruiterNotes: [...a.recruiterNotes, note.trim()],
                activityFeed: prependActivity(a, 'note', `Recruiter note added: "${note.trim().slice(0, 50)}${note.length > 50 ? '…' : ''}"`),
              }
            : a,
        ),
      );
      showToast('Note added');
    },
    [updateApplicants, showToast],
  );

  const setRecruiterRecommendation = useCallback(
    (id: string, rec: RecruiterRecommendation) => {
      if (!rec) return;
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                recruiterRecommendation: rec,
                activityFeed: prependActivity(
                  a,
                  'recommendation',
                  `Recruiter recommended ${RECRUITER_REC_LABELS[rec]}`,
                ),
              }
            : a,
        ),
      );
      showToast(`Recommendation set: ${RECRUITER_REC_LABELS[rec]}`);
    },
    [updateApplicants, showToast],
  );

  const sendToHiringManager = useCallback(
    (id: string, hiringManagerId: string) => {
      const hm = USERS.find((u) => u.id === hiringManagerId);
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                assignedHiringManager: hiringManagerId,
                stage: 'Hiring Manager Review',
                status: 'Pending Decision',
                recommendedNextStep: 'Await hiring manager decision',
                activityFeed: prependActivity(
                  a,
                  'assigned',
                  `Assigned to ${hm?.name ?? 'Hiring Manager'}`,
                ),
              }
            : a,
        ),
      );
      showToast('Sent to hiring manager');
    },
    [updateApplicants, showToast],
  );

  const rejectCandidate = useCallback(
    (id: string) => {
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                stage: 'Rejected',
                status: 'Closed',
                recommendedNextStep: 'Send rejection email',
                activityFeed: prependActivity(a, 'rejection', 'Candidate rejected'),
              }
            : a,
        ),
      );
      showToast('Candidate rejected', 'warning');
    },
    [updateApplicants, showToast],
  );

  const submitHmFeedback = useCallback(
    (id: string, feedback: string, decision: Applicant['hiringManagerDecision']) => {
      const labels = { strong_yes: 'Approve', maybe: 'Maybe', no: 'Reject' };
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                hiringManagerFeedback: feedback,
                hiringManagerDecision: decision,
                recommendedNextStep:
                  decision === 'strong_yes'
                    ? 'Recruiter to schedule next interview'
                    : decision === 'maybe'
                      ? 'Discuss in debrief. Gather more signal.'
                      : decision === 'no'
                        ? 'Recruiter to close candidacy'
                        : a.recommendedNextStep,
                activityFeed: prependActivity(
                  a,
                  'decision',
                  decision
                    ? `Hiring manager decision: ${labels[decision]}`
                    : 'Hiring manager left feedback',
                ),
              }
            : a,
        ),
      );
      showToast('Decision recorded');
    },
    [updateApplicants, showToast],
  );

  const requestInterview = useCallback(
    (id: string) => {
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                stage: 'Interview',
                recommendedNextStep: 'Recruiter to schedule interview',
                activityFeed: prependActivity(a, 'stage', 'Interview requested by hiring manager'),
              }
            : a,
        ),
      );
      showToast('Interview requested');
    },
    [updateApplicants, showToast],
  );

  const approveNextStage = useCallback(
    (id: string) => {
      updateApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const nextStage: Applicant['stage'] =
            a.stage === 'Hiring Manager Review'
              ? 'Interview'
              : a.stage === 'Interview'
                ? 'Offer'
                : a.stage;
          const msg =
            nextStage === 'Interview'
              ? 'Approved for interview'
              : nextStage === 'Offer'
                ? 'Approved for offer'
                : 'Approved to move forward';
          return {
            ...a,
            stage: nextStage,
            status: 'Active',
            recommendedNextStep:
              nextStage === 'Interview'
                ? 'Schedule interview loop'
                : nextStage === 'Offer'
                  ? 'Prepare offer package'
                  : a.recommendedNextStep,
            activityFeed: prependActivity(a, 'stage', msg),
          };
        }),
      );
      showToast('Approved to move forward');
    },
    [updateApplicants, showToast],
  );

  const value = useMemo(
    () => ({
      currentUser,
      applicants,
      isSynced,
      lastSynced,
      toasts,
      generatingInsightsId,
      login,
      logout,
      syncApplicants,
      generateSummary,
      addRecruiterNote,
      setRecruiterRecommendation,
      sendToHiringManager,
      rejectCandidate,
      submitHmFeedback,
      requestInterview,
      approveNextStage,
      showToast,
      dismissToast,
    }),
    [
      currentUser,
      applicants,
      isSynced,
      lastSynced,
      toasts,
      generatingInsightsId,
      login,
      logout,
      syncApplicants,
      generateSummary,
      addRecruiterNote,
      setRecruiterRecommendation,
      sendToHiringManager,
      rejectCandidate,
      submitHmFeedback,
      requestInterview,
      approveNextStage,
      showToast,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
