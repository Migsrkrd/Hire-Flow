import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant, FilterState } from '../types';
import {
  avgMatchByRole,
  avgMatchBySource,
  countByField,
  filterApplicants,
  formatRelativeSync,
} from '../utils/helpers';
import { CandidateRow } from './CandidateRow';
import { CandidateDetail } from './CandidateDetail';
import { FilterBar } from './FilterBar';
import { Layout } from './Layout';
import { BarChart, ScoreChart } from './ui/Charts';
import { StatCard } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  role: 'all',
  stage: 'all',
  minMatchScore: 0,
  experienceLevel: 'all',
  status: 'all',
};

export function RecruiterDashboard() {
  const { applicants, isSynced, lastSynced, syncApplicants } = useApp();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Applicant | null>(null);

  const filtered = useMemo(
    () => filterApplicants(applicants, filters),
    [applicants, filters],
  );

  const stats = useMemo(() => {
    const active = applicants.filter((a) => a.status !== 'Closed');
    return {
      new: active.filter((a) => a.stage === 'New').length,
      needsReview: active.filter((a) => a.stage === 'Needs Review').length,
      waitingHm: active.filter((a) => a.stage === 'Hiring Manager Review').length,
      interviews: active.filter((a) => a.stage === 'Interview').length,
      offers: active.filter((a) => a.stage === 'Offer').length,
    };
  }, [applicants]);

  const stageChart = useMemo(() => countByField(applicants, 'stage'), [applicants]);
  const roleChart = useMemo(() => countByField(applicants, 'appliedRole'), [applicants]);
  const matchByRole = useMemo(() => avgMatchByRole(applicants), [applicants]);
  const matchBySource = useMemo(() => avgMatchBySource(applicants), [applicants]);

  if (!isSynced) {
    return (
      <Layout showSync onSync={syncApplicants}>
        <EmptyState
          icon="🔄"
          title="No applicants synced yet"
          description="Pull in candidates from the external application portal to start reviewing. HireFlow will clean up the data and surface what needs your attention."
          action={<Button onClick={syncApplicants}>Sync Applicants</Button>}
        />
      </Layout>
    );
  }

  return (
    <Layout showSync onSync={syncApplicants}>
      <div className="page">
        <header className="page__header">
          <div>
            <h1>Recruiter queue</h1>
            <p className="page__subtitle">
              What needs your attention today — last synced {formatRelativeSync(lastSynced)}
            </p>
          </div>
          <span className="page__ats-pill">Imported from External ATS</span>
        </header>

        <div className="stat-grid">
          <StatCard label="New applicants" value={stats.new} accent="blue" hint="Just imported" />
          <StatCard label="Needs review" value={stats.needsReview} accent="amber" hint="Awaiting triage" />
          <StatCard
            label="Waiting on HM"
            value={stats.waitingHm}
            accent="purple"
            hint="Pending feedback"
          />
          <StatCard label="Interviews scheduled" value={stats.interviews} accent="green" />
          <StatCard label="Offers pending" value={stats.offers} accent="rose" hint="Awaiting response" />
        </div>

        <div className="chart-grid">
          <BarChart title="Applicants by stage" data={stageChart} colorClass="chart-bar--blue" />
          <BarChart title="Applicants by role" data={roleChart} colorClass="chart-bar--purple" />
          <ScoreChart title="Avg match score by role" data={matchByRole} />
          <ScoreChart title="Avg match score by source" data={matchBySource} />
        </div>

        <div className="queue-section">
          <div className="queue-section__header">
            <h2>Applicant queue</h2>
            <span className="queue-section__count">{filtered.length} candidates</span>
          </div>
          <FilterBar filters={filters} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No matches"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <div className="candidate-list">
              {filtered.map((a) => (
                <CandidateRow key={a.id} applicant={a} onClick={() => setSelected(a)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CandidateDetail
          applicant={applicants.find((a) => a.id === selected.id) ?? selected}
          mode="recruiter"
          onClose={() => setSelected(null)}
        />
      )}
    </Layout>
  );
}
