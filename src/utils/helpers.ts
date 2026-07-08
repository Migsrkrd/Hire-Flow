import type { Applicant, FilterState } from '../types';
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
      const haystack = [
        a.name,
        a.appliedRole,
        a.location,
        ...a.skills,
      ]
        .join(' ')
        .toLowerCase();
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

export function hasDataQualityIssues(applicant: Applicant): boolean {
  return (
    !applicant.portfolioUrl ||
    applicant.skills.length < 3 ||
    !applicant.resumeHighlights ||
    applicant.concerns.some((c) => c.toLowerCase().includes('missing'))
  );
}

export function needsAttention(applicant: Applicant): boolean {
  if (!applicant.aiSummary && applicant.stage !== 'Rejected' && applicant.status !== 'Closed') {
    return true;
  }
  if (applicant.matchScore >= 85 && !applicant.assignedHiringManager && applicant.stage !== 'Rejected') {
    return true;
  }
  if (
    applicant.stage === 'Hiring Manager Review' &&
    !applicant.hiringManagerFeedback &&
    applicant.assignedHiringManager
  ) {
    return true;
  }
  return false;
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
