import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { NavView } from '../../types';
import { formatSyncTime, getNavCounts } from '../../utils/helpers';

interface LeftRailProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  reviewing?: boolean;
}

const RECRUITER_NAV: { id: NavView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'insights', label: 'Insights' },
  { id: 'settings', label: 'Settings' },
];

const HM_NAV: { id: NavView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'settings', label: 'Settings' },
];

export function LeftRail({ activeView, onNavigate, reviewing = false }: LeftRailProps) {
  const { currentUser, login, logout, applicants, isSynced, lastSynced, syncApplicants } = useApp();

  if (!currentUser) return null;

  const isRecruiter = currentUser.role === 'recruiter';
  const navItems = isRecruiter ? RECRUITER_NAV : HM_NAV;
  const otherUsers = USERS.filter((u) => u.id !== currentUser.id);
  const counts = getNavCounts(applicants, currentUser.role, currentUser.id);

  return (
    <nav className={`rail ${reviewing ? 'rail--compact' : ''}`} aria-label="Main navigation">
      <div className="rail__brand">
        <span className="rail__mark">HF</span>
        <div className="rail__brand-text">
          <span className="rail__name">HireFlow</span>
          <span className="rail__tag">What next?</span>
        </div>
      </div>

      {isSynced && !reviewing && (
        <div className="rail__connection">
          <span className="rail__connection-dot" />
          Applicants imported
          <span className="rail__connection-time">Updated {formatSyncTime(lastSynced)}</span>
        </div>
      )}

      <div className="rail__user">
        <span className="rail__avatar">{currentUser.name.charAt(0)}</span>
        <div className="rail__user-info">
          <span className="rail__user-name">{currentUser.name}</span>
          <span className="rail__user-role">
            {isRecruiter ? 'Recruiter' : 'Hiring Manager'}
          </span>
        </div>
      </div>

      <ul className="rail__nav">
        {navItems.map((item) => {
          const count = counts[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`rail__nav-item ${activeView === item.id && !reviewing ? 'rail__nav-item--active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="rail__nav-label">{item.label}</span>
                {count > 0 && item.id === 'today' && (
                  <span className="rail__badge">{count}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {isRecruiter && !reviewing && (
        <button type="button" className="rail__sync-btn" onClick={syncApplicants}>
          Import Applicants
        </button>
      )}

      <div className="rail__switcher">
        <span className="rail__switcher-label">Switch role</span>
        <div className="rail__switcher-list">
          {otherUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              className="rail__switcher-btn"
              onClick={() => login(user)}
              title={user.name}
            >
              {user.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <button type="button" className="rail__logout" onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
