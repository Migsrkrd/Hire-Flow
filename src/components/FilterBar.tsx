import type { FilterState } from '../types';
import { EXPERIENCE_LEVELS, ROLES, STAGES, STATUSES } from './ui/Badge';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="toolbar">
      <input
        type="search"
        className="toolbar__search"
        placeholder="Search name, role, skill, location…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        aria-label="Search"
      />
      <select
        value={filters.role}
        onChange={(e) => set('role', e.target.value as FilterState['role'])}
        aria-label="Role"
      >
        <option value="all">All roles</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select
        value={filters.stage}
        onChange={(e) => set('stage', e.target.value as FilterState['stage'])}
        aria-label="Stage"
      >
        <option value="all">All stages</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        value={filters.experienceLevel}
        onChange={(e) =>
          set('experienceLevel', e.target.value as FilterState['experienceLevel'])
        }
        aria-label="Experience"
      >
        <option value="all">Experience</option>
        {EXPERIENCE_LEVELS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => set('status', e.target.value as FilterState['status'])}
        aria-label="Status"
      >
        <option value="all">Status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <label className="toolbar__score">
        <span>{filters.minMatchScore}%+</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minMatchScore}
          onChange={(e) => set('minMatchScore', Number(e.target.value))}
        />
      </label>
    </div>
  );
}
