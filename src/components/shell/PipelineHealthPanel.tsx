import type { Applicant } from '../../types';
import { countByField, avgMatchByRole } from '../../utils/helpers';
import { BarChart, ScoreChart } from '../ui/Charts';

interface PipelineHealthPanelProps {
  applicants: Applicant[];
}

export function PipelineHealthPanel({ applicants }: PipelineHealthPanelProps) {
  const stageData = countByField(applicants, 'stage');
  const roleData = countByField(applicants, 'appliedRole');
  const matchData = avgMatchByRole(applicants);

  return (
    <section className="queue-panel pipeline-panel">
      <header className="queue-panel__header">
        <h1 className="queue-panel__title">Pipeline Health</h1>
        <span className="queue-panel__count">{applicants.length} total</span>
      </header>

      <p className="pipeline-panel__desc">
        Compact view of pipeline distribution. Select a candidate in the inbox to review details.
      </p>

      <div className="pipeline-panel__charts">
        <BarChart title="Applicants by stage" data={stageData} colorClass="chart-bar--muted" />
        <BarChart title="Applicants by role" data={roleData} colorClass="chart-bar--accent" />
        <ScoreChart title="Avg match score by role" data={matchData} />
      </div>
    </section>
  );
}
