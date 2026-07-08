import type { SmartView } from '../../types';

export const SMART_VIEWS: { id: SmartView; label: string }[] = [
  { id: 'all', label: 'All Active' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'top_candidates', label: 'Top Candidates' },
  { id: 'waiting_too_long', label: 'Waiting Too Long' },
  { id: 'needs_manager', label: 'Needs Manager' },
  { id: 'offers', label: 'Offers' },
  { id: 'rejected', label: 'Rejected' },
];
