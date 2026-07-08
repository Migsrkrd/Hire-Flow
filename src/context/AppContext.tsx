import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { EXTERNAL_ATS_APPLICANTS } from '../data/mockApplicants';
import type { Applicant, ToastMessage, User } from '../types';
import { generateAISummary, generateInterviewQuestions } from '../utils/aiSimulation';
import { loadState, saveState } from '../utils/helpers';

interface AppContextValue {
  currentUser: User | null;
  applicants: Applicant[];
  isSynced: boolean;
  lastSynced: string | null;
  toasts: ToastMessage[];
  login: (user: User) => void;
  logout: () => void;
  syncApplicants: () => void;
  updateApplicant: (id: string, updates: Partial<Applicant>) => void;
  generateSummary: (id: string) => void;
  generatingInsightsId: string | null;
  addRecruiterNote: (id: string, note: string) => void;
  sendToHiringManager: (id: string, hiringManagerId: string) => void;
  advanceStage: (id: string, stage: Applicant['stage']) => void;
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

  const persist = useCallback((next: Applicant[], synced: boolean, syncedAt: string | null) => {
    saveState({ applicants: next, isSynced: synced, lastSynced: syncedAt });
  }, []);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
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
    setApplicants(EXTERNAL_ATS_APPLICANTS);
    setIsSynced(true);
    setLastSynced(now);
    persist(EXTERNAL_ATS_APPLICANTS, true, now);
    showToast(`Imported ${EXTERNAL_ATS_APPLICANTS.length} applicants from External ATS`, 'info');
  }, [persist, showToast]);

  const updateApplicant = useCallback(
    (id: string, updates: Partial<Applicant>) => {
      updateApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    },
    [updateApplicants],
  );

  const generateSummary = useCallback(
    (id: string) => {
      setGeneratingInsightsId(id);
      setTimeout(() => {
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
            };
          }),
        );
        setGeneratingInsightsId(null);
        showToast('AI insights generated');
      }, 900);
    },
    [updateApplicants, showToast],
  );

  const addRecruiterNote = useCallback(
    (id: string, note: string) => {
      if (!note.trim()) return;
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, recruiterNotes: [...a.recruiterNotes, note.trim()] } : a,
        ),
      );
      showToast('Note added');
    },
    [updateApplicants, showToast],
  );

  const sendToHiringManager = useCallback(
    (id: string, hiringManagerId: string) => {
      updateApplicants((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                assignedHiringManager: hiringManagerId,
                stage: 'Hiring Manager Review',
                status: 'Pending Decision',
                recommendedNextStep: 'Await hiring manager feedback',
              }
            : a,
        ),
      );
      showToast('Candidate sent to hiring manager');
    },
    [updateApplicants, showToast],
  );

  const advanceStage = useCallback(
    (id: string, stage: Applicant['stage']) => {
      updateApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, stage } : a)),
      );
      showToast(`Stage updated to ${stage}`);
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
                      ? 'Discuss in debrief — gather more signal'
                      : decision === 'no'
                        ? 'Recruiter to close candidacy'
                        : a.recommendedNextStep,
              }
            : a,
        ),
      );
      showToast('Feedback submitted');
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
      updateApplicant,
      generateSummary,
      addRecruiterNote,
      sendToHiringManager,
      advanceStage,
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
      updateApplicant,
      generateSummary,
      addRecruiterNote,
      sendToHiringManager,
      advanceStage,
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
