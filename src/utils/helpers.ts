import type {
  Applicant,
  AttentionInfo,
  FilterState,
  NavView,
  RecruiterRecommendation,
  SmartView,
  UserRole,
} from '../types';
import { getExperienceLevel, matchToStars } from './aiSimulation';

const STORAGE_KEY = 'hireflow-state';

export interface AppState {
  applicants: Applicant[];
  isSynced: boolean;
  lastSynced: string | null;
}

function mapLegacyRecommendation(value: unknown): RecruiterRecommendation {
  if (!value || value === '') return null;
  if (typeof value !== 'string') return value as RecruiterRecommendation;
  const lower = value.toLowerCase();
  if (lower.includes('strong') || lower.includes('fast-track') || lower.includes('unanimous')) {
    return 'strong_hire';
  }
  if (lower.includes('reject') || lower.includes('no —') || lower.includes('mismatch')) {
    return 'reject';
  }
  if (lower.includes('hold') || lower.includes('maybe')) return 'hold';
  return 'worth_interviewing';
}

export function normalizeApplicant(raw: Applicant): Applicant {
  return {
    ...raw,
    activityFeed: raw.activityFeed ?? [],
    recruiterRecommendation: mapLegacyRecommendation(raw.recruiterRecommendation),
    aiSummary: raw.aiSummary
      ? {
          ...raw.aiSummary,
          redFlags: raw.aiSummary.redFlags ?? [],
          confidence: raw.aiSummary.confidence ?? Math.min(90, raw.matchScore),
        }
      : null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return {
        ...parsed,
        applicants: parsed.applicants.map(normalizeApplicant),
      };
    }
  } catch {
    // ignore corrupt storage
  }
  return { applicants: [], isSynced: false, lastSynced: null };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function filterApplicants(applicants: Applicant[], filters: FilterState): Applicant[] {
  return applicants.filter((a) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [a.name, a.appliedRole, a.location, ...a.skills].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.role !== 'all' && a.appliedRole !== filters.role) return false;
    if (filters.stage !== 'all' && a.stage !== filters.stage) return false;
    if (a.matchScore < filters.minMatchScore) return false;
    if (filters.status !== 'all' && a.status !== filters.status) return false;
    if (filters.experienceLevel !== 'all') {
      if (getExperienceLevel(a.yearsOfExperience) !== filters.experienceLevel) return false;
    }
    return true;
  });
}

export function applySmartView(applicants: Applicant[], view: SmartView): Applicant[] {
  const active = applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');

  switch (view) {
    case 'needs_review':
      return active.filter(
        (a) =>
          (a.stage === 'New' || a.stage === 'Needs Review' || !a.aiSummary) &&
          a.matchScore >= 70,
      );
    case 'top_candidates':
      return active.filter((a) => a.matchScore >= 85);
    case 'waiting_too_long':
      return active.filter((a) => daysWaiting(a) > 5);
    case 'needs_manager':
      return active.filter(
        (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerFeedback,
      );
    case 'offers':
      return active.filter((a) => a.stage === 'Offer');
    case 'rejected':
      return applicants.filter((a) => a.stage === 'Rejected');
    default:
      return active;
  }
}

export function daysWaiting(applicant: Applicant): number {
  const applied = new Date(applicant.appliedDate + 'T12:00:00');
  return Math.floor((Date.now() - applied.getTime()) / 86400000);
}

export function hasDataQualityIssues(applicant: Applicant): boolean {
  return (
    !applicant.portfolioUrl ||
    applicant.skills.length < 3 ||
    !applicant.resumeHighlights ||
    applicant.concerns.some((c) => c.toLowerCase().includes('missing'))
  );
}

export function getAttentionInfo(applicant: Applicant): AttentionInfo {
  const reasons: string[] = [];
  let score = 0;

  if (applicant.stage === 'Rejected' || applicant.status === 'Closed') {
    return { score: 0, reasons: [], recommendedAction: '' };
  }

  if (applicant.matchScore >= 85) {
    reasons.push('High skill match');
    score += 25;
  }

  if (!applicant.aiSummary) {
    reasons.push('No AI insights');
    score += applicant.matchScore >= 80 ? 35 : 20;
  }

  if (!applicant.recruiterRecommendation && applicant.stage !== 'Offer') {
    reasons.push('No recruiter review');
    score += 15;
  }

  const waiting = daysWaiting(applicant);
  if (waiting > 5) {
    reasons.push(`Waiting ${waiting} days`);
    score += Math.min(waiting * 3, 25);
  }

  if (
    applicant.stage === 'Hiring Manager Review' &&
    applicant.assignedHiringManager &&
    !applicant.hiringManagerFeedback
  ) {
    reasons.push('Waiting on hiring manager');
    score += 35;
  }

  if (applicant.stage === 'Offer' && applicant.status === 'Pending Decision') {
    reasons.push('Offer pending');
    score += 30;
  }

  if (hasDataQualityIssues(applicant)) {
    reasons.push('Incomplete resume');
    score += 12;
  }

  if (applicant.matchScore >= 85 && !applicant.assignedHiringManager) {
    score += 20;
  }

  let recommendedAction = 'Review when available';
  if (score >= 60) recommendedAction = 'Review today';
  else if (score >= 40) recommendedAction = 'Review this week';
  else if (applicant.stage === 'Offer') recommendedAction = 'Follow up on offer';
  else if (waiting > 7) recommendedAction = 'Address stale application';

  return { score, reasons, recommendedAction };
}

export function needsAttention(applicant: Applicant): boolean {
  return getAttentionInfo(applicant).score > 0;
}

export function sortByAttention(applicants: Applicant[]): Applicant[] {
  return [...applicants].sort((a, b) => {
    const diff = getAttentionInfo(b).score - getAttentionInfo(a).score;
    if (diff !== 0) return diff;
    return b.matchScore - a.matchScore;
  });
}

export interface BriefingLine {
  text: string;
  tone: 'default' | 'warn' | 'urgent';
}

export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${salutation}, ${firstName}.`;
}

export function computeBriefing(applicants: Applicant[], role: UserRole): BriefingLine[] {
  const active = applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
  const lines: BriefingLine[] = [];

  const attentionCount = active.filter((a) => needsAttention(a)).length;
  if (attentionCount > 0) {
    lines.push({
      text: `${attentionCount} candidate${attentionCount === 1 ? '' : 's'} need attention`,
      tone: 'urgent',
    });
  }

  if (role === 'recruiter') {
    const staleHighMatch = active.filter((a) => a.matchScore >= 85 && daysWaiting(a) > 5).length;
    if (staleHighMatch > 0) {
      lines.push({
        text: `${staleHighMatch} high-match candidate${staleHighMatch === 1 ? '' : 's'} have waited over 5 days`,
        tone: 'warn',
      });
    }

    const waitingHm = active.filter(
      (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerFeedback,
    ).length;
    if (waitingHm > 0) {
      lines.push({
        text: `${waitingHm} candidate${waitingHm === 1 ? '' : 's'} waiting for hiring manager feedback`,
        tone: 'default',
      });
    }

    const offers = active.filter((a) => a.stage === 'Offer').length;
    if (offers > 0) {
      lines.push({
        text: `${offers} offer${offers === 1 ? '' : 's'} pending response`,
        tone: 'default',
      });
    }
  } else {
    const awaiting = active.filter((a) => !a.hiringManagerFeedback).length;
    if (awaiting > 0) {
      lines.push({
        text: `${awaiting} candidate${awaiting === 1 ? '' : 's'} awaiting your decision`,
        tone: 'urgent',
      });
    }

    const strong = active.filter((a) => a.matchScore >= 85 && !a.hiringManagerDecision).length;
    if (strong > 0) {
      lines.push({
        text: `${strong} strong match${strong === 1 ? '' : 'es'} need a decision`,
        tone: 'warn',
      });
    }
  }

  return lines;
}

export function getNavCounts(
  applicants: Applicant[],
  role: UserRole,
  userId?: string,
): Record<NavView, number> {
  const active = applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
  const pool =
    role === 'recruiter'
      ? active
      : active.filter((a) => a.assignedHiringManager === userId);

  return {
    inbox: pool.filter((a) => needsAttention(a)).length,
    pipeline: 0,
    interviews: pool.filter((a) => a.stage === 'Interview').length,
    decisions: pool.filter(
      (a) =>
        a.stage === 'Hiring Manager Review' ||
        a.stage === 'Offer' ||
        (role === 'hiring_manager' && !a.hiringManagerDecision),
    ).length,
    settings: 0,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeSync(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso.split('T')[0]);
}

export function countByField(
  applicants: Applicant[],
  field: 'stage' | 'appliedRole',
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of applicants) {
    const key = a[field];
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function avgMatchByRole(applicants: Applicant[]): Record<string, number> {
  const sums: Record<string, { total: number; count: number }> = {};
  for (const a of applicants) {
    if (!sums[a.appliedRole]) sums[a.appliedRole] = { total: 0, count: 0 };
    sums[a.appliedRole].total += a.matchScore;
    sums[a.appliedRole].count += 1;
  }
  const result: Record<string, number> = {};
  for (const [role, { total, count }] of Object.entries(sums)) {
    result[role] = Math.round(total / count);
  }
  return result;
}

export function needsAttentionBreakdown(applicants: Applicant[]): Record<string, number> {
  const active = applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
  return {
    'No AI insights': active.filter((a) => !a.aiSummary).length,
    'High match unreviewed': active.filter((a) => a.matchScore >= 85 && !a.recruiterRecommendation).length,
    'Waiting 5+ days': active.filter((a) => daysWaiting(a) > 5).length,
    'Needs manager': active.filter(
      (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerFeedback,
    ).length,
    'Offer pending': active.filter((a) => a.stage === 'Offer').length,
    'Incomplete data': active.filter((a) => hasDataQualityIssues(a)).length,
  };
}

export function hiringVelocity(applicants: Applicant[]): Record<string, number> {
  const active = applicants.filter((a) => a.status !== 'Closed');
  const last7 = active.filter((a) => daysWaiting(a) <= 7).length;
  const last14 = active.filter((a) => daysWaiting(a) <= 14).length;
  const inInterview = active.filter((a) => a.stage === 'Interview').length;
  const offers = active.filter((a) => a.stage === 'Offer').length;
  return {
    'New (7d)': last7,
    'Active (14d)': last14,
    'In interview': inInterview,
    'Offers out': offers,
  };
}

export { matchToStars };
