import type { ActivityEvent, ActivityType, Applicant } from '../types';

export function createActivity(type: ActivityType, message: string): ActivityEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    message,
    type,
  };
}

export function prependActivity(
  applicant: Applicant,
  type: ActivityType,
  message: string,
): ActivityEvent[] {
  return [createActivity(type, message), ...applicant.activityFeed];
}

export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function groupActivityByDay(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const groups = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const label = formatActivityTime(event.timestamp);
    const list = groups.get(label) ?? [];
    list.push(event);
    groups.set(label, list);
  }
  return Array.from(groups.entries()).map(([label, evts]) => ({ label, events: evts }));
}

/** ATS fields that sync can update — workflow fields are preserved. */
const ATS_FIELDS: (keyof Applicant)[] = [
  'name',
  'appliedRole',
  'location',
  'applicationSource',
  'appliedDate',
  'matchScore',
  'yearsOfExperience',
  'skills',
  'resumeHighlights',
  'portfolioUrl',
  'githubUrl',
  'linkedinUrl',
  'concerns',
];

function atsSnapshot(a: Applicant): string {
  return JSON.stringify(ATS_FIELDS.map((f) => a[f]));
}

export interface SyncResult {
  merged: Applicant[];
  newCount: number;
  updatedCount: number;
}

export function mergeApplicantsFromAts(
  existing: Applicant[],
  incoming: Applicant[],
): SyncResult {
  const existingMap = new Map(existing.map((a) => [a.id, a]));
  const merged = [...existing];
  let newCount = 0;
  let updatedCount = 0;

  for (const raw of incoming) {
    const current = existingMap.get(raw.id);
    if (!current) {
      merged.push({
        ...raw,
        activityFeed: [
          createActivity('import', 'Imported from External ATS'),
          createActivity('application', `Application received via ${raw.applicationSource}`),
        ],
      });
      newCount++;
      continue;
    }

    const changed = atsSnapshot(current) !== atsSnapshot(raw);
    if (changed) {
      updatedCount++;
    }

    const index = merged.findIndex((a) => a.id === raw.id);
    merged[index] = {
      ...current,
      ...Object.fromEntries(ATS_FIELDS.map((f) => [f, raw[f]])),
      activityFeed: changed
        ? prependActivity(current, 'import', 'Profile updated from External ATS sync')
        : current.activityFeed,
    };
  }

  return { merged, newCount, updatedCount };
}

export function seedInitialActivity(applicant: Applicant): ActivityEvent[] {
  const applied = new Date(applicant.appliedDate + 'T12:00:00').toISOString();
  return [
    {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: 'Imported from External ATS',
      type: 'import',
    },
    {
      id: crypto.randomUUID(),
      timestamp: applied,
      message: `Application received via ${applicant.applicationSource}`,
      type: 'application',
    },
  ];
}
