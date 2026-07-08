export type AppliedRole =
  | 'Frontend Engineer'
  | 'Full Stack Developer'
  | 'Product Designer'
  | 'Data Analyst';

export type Stage =
  | 'New'
  | 'Needs Review'
  | 'Recruiter Screen'
  | 'Hiring Manager Review'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export type ApplicantStatus = 'Active' | 'On Hold' | 'Pending Decision' | 'Closed';

export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead';

export type HiringManagerDecision = 'strong_yes' | 'maybe' | 'no' | null;

export type RecruiterRecommendation = 'strong_hire' | 'worth_interviewing' | 'hold' | 'reject' | null;

export type UserRole = 'recruiter' | 'hiring_manager';

export type NavView = 'inbox' | 'pipeline' | 'interviews' | 'decisions' | 'settings';

export type SmartView =
  | 'all'
  | 'needs_review'
  | 'top_candidates'
  | 'waiting_too_long'
  | 'needs_manager'
  | 'offers'
  | 'rejected';

export type ActivityType =
  | 'application'
  | 'import'
  | 'insights'
  | 'note'
  | 'recommendation'
  | 'assigned'
  | 'feedback'
  | 'stage'
  | 'decision'
  | 'rejection';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
  type: ActivityType;
}

export interface AISummary {
  summary: string;
  strengths: string[];
  concerns: string[];
  redFlags: string[];
  recommendedNextStep: string;
  confidence: number;
}

export interface Applicant {
  id: string;
  name: string;
  appliedRole: AppliedRole;
  location: string;
  applicationSource: string;
  appliedDate: string;
  stage: Stage;
  status: ApplicantStatus;
  matchScore: number;
  yearsOfExperience: number;
  skills: string[];
  resumeHighlights: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  recruiterNotes: string[];
  aiSummary: AISummary | null;
  suggestedQuestions: string[];
  assignedHiringManager: string | null;
  hiringManagerFeedback: string;
  hiringManagerDecision: HiringManagerDecision;
  concerns: string[];
  recommendedNextStep: string;
  recruiterRecommendation: RecruiterRecommendation;
  activityFeed: ActivityEvent[];
}

export interface FilterState {
  search: string;
  role: AppliedRole | 'all';
  stage: Stage | 'all';
  minMatchScore: number;
  experienceLevel: ExperienceLevel | 'all';
  status: ApplicantStatus | 'all';
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export interface AttentionInfo {
  score: number;
  reasons: string[];
  recommendedAction: string;
}

export const RECRUITER_REC_LABELS: Record<NonNullable<RecruiterRecommendation>, string> = {
  strong_hire: 'Strong Hire',
  worth_interviewing: 'Worth Interviewing',
  hold: 'Hold',
  reject: 'Reject',
};

export const HM_DECISION_LABELS: Record<NonNullable<HiringManagerDecision>, string> = {
  strong_yes: 'Approve',
  maybe: 'Maybe',
  no: 'Reject',
};
