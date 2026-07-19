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
  title?: string;
  description?: string;
  mode?: 'pipeline' | 'analytics';
}

export function PipelineHealthPanel({
  applicants,
  title = 'Pipeline',
  description = 'Supporting metrics. Use Review Queue to decide what to work on next.',
  mode = 'pipeline',
}: PipelineHealthPanelProps) {
  const stageData = countByField(applicants, 'stage');
  const roleData = countByField(applicants, 'appliedRole');
  const matchData = avgMatchByRole(applicants);
  const attentionData = needsAttentionBreakdown(applicants);
  const velocityData = hiringVelocity(applicants);

  return (
    <section className="queue-panel pipeline-panel">
      <header className="queue-panel__header">
        <h1 className="queue-panel__title">{title}</h1>
        <span className="queue-panel__count">Secondary — not your work queue</span>
      </header>

      <p className="pipeline-panel__desc">{description}</p>

      <div className="pipeline-panel__charts">
        {mode === 'pipeline' ? (
          <>
            <BarChart title="Applicants by stage" data={stageData} colorClass="chart-bar--muted" />
            <BarChart title="Applicants by role" data={roleData} colorClass="chart-bar--accent" />
            <ScoreChart title="Average match score by role" data={matchData} />
          </>
        ) : (
          <>
            <BarChart title="Needs attention breakdown" data={attentionData} colorClass="chart-bar--amber" />
            <BarChart title="Hiring velocity" data={velocityData} colorClass="chart-bar--green" />
            <ScoreChart title="Average match score by role" data={matchData} />
          </>
        )}
      </div>
    </section>
  );
}
