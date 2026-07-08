import type { Applicant } from '../../types';
import {
  avgMatchByRole,
  countByField,
  hiringVelocity,
  needsAttentionBreakdown,
} from '../../utils/helpers';
import { BarChart, ScoreChart } from '../ui/Charts';

interface PipelineHealthPanelProps {
  applicants: Applicant[];
}

export function PipelineHealthPanel({ applicants }: PipelineHealthPanelProps) {
  const stageData = countByField(applicants, 'stage');
  const roleData = countByField(applicants, 'appliedRole');
  const matchData = avgMatchByRole(applicants);
  const attentionData = needsAttentionBreakdown(applicants);
  const velocityData = hiringVelocity(applicants);

  return (
    <section className="queue-panel pipeline-panel">
      <header className="queue-panel__header">
        <h1 className="queue-panel__title">Pipeline Health</h1>
        <span className="queue-panel__count">Supporting metrics — not the work queue</span>
      </header>

      <p className="pipeline-panel__desc">
        Snapshot of pipeline distribution from synced ATS data. Use Hiring Inbox to decide what to work on next.
      </p>

      <div className="pipeline-panel__charts">
        <BarChart title="Applicants by stage" data={stageData} colorClass="chart-bar--muted" />
        <BarChart title="Applicants by role" data={roleData} colorClass="chart-bar--accent" />
        <ScoreChart title="Average match score by role" data={matchData} />
        <BarChart title="Hiring velocity" data={velocityData} colorClass="chart-bar--green" />
        <BarChart title="Needs attention breakdown" data={attentionData} colorClass="chart-bar--amber" />
      </div>
    </section>
  );
}
