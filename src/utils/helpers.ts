import type { Applicant, AttentionInfo, FilterState, UserRole } from '../types';
import { getExperienceLevel } from './aiSimulation';

const STORAGE_KEY = 'hireflow-state';

export interface AppState {
  applicants: Applicant[];
  isSynced: boolean;
  lastSynced: string | null;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppState;
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
    return { score: 0, reasons: [] };
  }

  if (!applicant.aiSummary) {
    reasons.push('No AI insights');
    score += applicant.matchScore >= 85 ? 40 : 25;
  }

  if (applicant.matchScore >= 85 && !applicant.assignedHiringManager) {
    reasons.push('High match, no HM assigned');
    score += 30;
  }

  const waiting = daysWaiting(applicant);
  if (waiting > 5) {
    reasons.push(`Waiting ${waiting}d`);
    score += Math.min(waiting * 2, 20);
  }

  if (
    applicant.stage === 'Hiring Manager Review' &&
    applicant.assignedHiringManager &&
    !applicant.hiringManagerFeedback
  ) {
    reasons.push('Awaiting manager feedback');
    score += 35;
  }

  if (applicant.stage === 'Offer' && applicant.status === 'Pending Decision') {
    reasons.push('Offer pending');
    score += 30;
  }

  if (hasDataQualityIssues(applicant)) {
    reasons.push('Missing resume details');
    score += 15;
  }

  if (applicant.stage === 'New' || applicant.stage === 'Needs Review') {
    score += 10;
  }

  return { score, reasons };
}

export function needsAttention(applicant: Applicant): boolean {
  return getAttentionInfo(applicant).score > 0;
}

export function sortByAttention(applicants: Applicant[]): Applicant[] {
  return [...applicants].sort((a, b) => {
    const diff = getAttentionInfo(b).score - getAttentionInfo(a).score;
    if (diff !== 0) return diff;
    return daysWaiting(b) - daysWaiting(a);
  });
}

export interface BriefingLine {
  text: string;
  tone: 'default' | 'warn' | 'urgent';
}

export function computeBriefing(
  applicants: Applicant[],
  role: UserRole,
): BriefingLine[] {
  const active = applicants.filter((a) => a.stage !== 'Rejected' && a.status !== 'Closed');
  const lines: BriefingLine[] = [];

  const needsAttentionCount = active.filter((a) => needsAttention(a)).length;
  if (needsAttentionCount > 0) {
    lines.push({
      text: `${needsAttentionCount} candidate${needsAttentionCount === 1 ? '' : 's'} need attention`,
      tone: 'urgent',
    });
  }

  if (role === 'recruiter') {
    const noInsights = active.filter((a) => !a.aiSummary && a.matchScore >= 80).length;
    if (noInsights > 0) {
      lines.push({
        text: `${noInsights} high-match candidate${noInsights === 1 ? '' : 's'} have no AI insights`,
        tone: 'warn',
      });
    }

    const waitingHm = active.filter(
      (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerFeedback,
    ).length;
    if (waitingHm > 0) {
      lines.push({
        text: `${waitingHm} candidate${waitingHm === 1 ? '' : 's'} waiting on manager feedback`,
        tone: 'default',
      });
    }

    const offers = active.filter((a) => a.stage === 'Offer').length;
    if (offers > 0) {
      lines.push({
        text: `${offers} offer${offers === 1 ? '' : 's'} pending`,
        tone: 'default',
      });
    }
  } else {
    const awaiting = active.filter((a) => !a.hiringManagerFeedback).length;
    if (awaiting > 0) {
      lines.push({
        text: `${awaiting} candidate${awaiting === 1 ? '' : 's'} awaiting your feedback`,
        tone: 'urgent',
      });
    }

    const interviews = active.filter((a) => a.stage === 'Interview').length;
    if (interviews > 0) {
      lines.push({
        text: `${interviews} interview${interviews === 1 ? '' : 's'} this week`,
        tone: 'default',
      });
    }

    const strong = active.filter((a) => a.matchScore >= 85).length;
    if (strong > 0) {
      lines.push({
        text: `${strong} strong match${strong === 1 ? '' : 'es'} in your queue`,
        tone: 'default',
      });
    }

    const decisions = active.filter(
      (a) => a.stage === 'Hiring Manager Review' && !a.hiringManagerDecision,
    ).length;
    if (decisions > 0) {
      lines.push({
        text: `${decisions} decision${decisions === 1 ? '' : 's'} needed`,
        tone: 'warn',
      });
    }
  }

  return lines;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

export function countByField(applicants: Applicant[], field: 'stage' | 'appliedRole'): Record<string, number> {
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

export function avgMatchBySource(applicants: Applicant[]): Record<string, number> {
  const sums: Record<string, { total: number; count: number }> = {};
  for (const a of applicants) {
    if (!sums[a.applicationSource]) sums[a.applicationSource] = { total: 0, count: 0 };
    sums[a.applicationSource].total += a.matchScore;
    sums[a.applicationSource].count += 1;
  }
  const result: Record<string, number> = {};
  for (const [source, { total, count }] of Object.entries(sums)) {
    result[source] = Math.round(total / count);
  }
  return result;
}

export function buildTimeline(applicant: Applicant): { date: string; event: string }[] {
  const events: { date: string; event: string }[] = [
    { date: applicant.appliedDate, event: `Applied via ${applicant.applicationSource}` },
  ];

  if (applicant.recruiterNotes.length > 0) {
    events.push({ date: applicant.appliedDate, event: `Recruiter note: ${applicant.recruiterNotes[0]}` });
  }
  if (applicant.aiSummary) {
    events.push({ date: applicant.appliedDate, event: 'AI insights generated' });
  }
  if (applicant.assignedHiringManager) {
    events.push({ date: applicant.appliedDate, event: 'Sent to hiring manager' });
  }
  if (applicant.hiringManagerFeedback) {
    events.push({ date: applicant.appliedDate, event: `HM feedback: ${applicant.hiringManagerFeedback.slice(0, 60)}…` });
  }
  if (applicant.stage === 'Interview') {
    events.push({ date: applicant.appliedDate, event: 'Moved to interview stage' });
  }
  if (applicant.stage === 'Offer') {
    events.push({ date: applicant.appliedDate, event: 'Offer extended' });
  }
  if (applicant.stage === 'Rejected') {
    events.push({ date: applicant.appliedDate, event: 'Rejected' });
  }

  return events;
}
