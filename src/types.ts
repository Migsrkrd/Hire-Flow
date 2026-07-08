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

export type UserRole = 'recruiter' | 'hiring_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export interface AISummary {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendedNextStep: string;
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
  recruiterRecommendation: string;
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
