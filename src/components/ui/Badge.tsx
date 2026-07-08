import type { ApplicantStatus, AppliedRole, ExperienceLevel, Stage } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'stage' | 'score' | 'attention' | 'source' | 'warning';
  score?: number;
}

export function Badge({ label, variant = 'default', score }: BadgeProps) {
  let className = 'badge';
  if (variant === 'stage') className += ` badge--stage badge--stage-${stageClass(label)}`;
  else if (variant === 'score' && score !== undefined) className += ` badge--score badge--score-${scoreTier(score)}`;
  else if (variant === 'attention') className += ' badge--attention';
  else if (variant === 'source') className += ' badge--source';
  else if (variant === 'warning') className += ' badge--warning';
  else className += ' badge--default';

  return <span className={className}>{label}</span>;
}

function stageClass(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, '-');
}

function scoreTier(score: number): string {
  if (score >= 85) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}

export function MatchScoreBadge({ score }: { score: number }) {
  return <Badge label={`${score}%`} variant="score" score={score} />;
}

export const STAGES: Stage[] = [
  'New',
  'Needs Review',
  'Recruiter Screen',
  'Hiring Manager Review',
  'Interview',
  'Offer',
  'Rejected',
];

export const ROLES: AppliedRole[] = [
  'Frontend Engineer',
  'Full Stack Developer',
  'Product Designer',
  'Data Analyst',
];

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Junior', 'Mid', 'Senior', 'Lead'];

export const STATUSES: ApplicantStatus[] = ['Active', 'On Hold', 'Pending Decision', 'Closed'];
