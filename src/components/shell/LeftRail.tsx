import { USERS } from '../../data/users';
import { useApp } from '../../context/AppContext';
import type { NavView } from '../../types';
import { formatRelativeSync } from '../../utils/helpers';

interface LeftRailProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

const RECRUITER_NAV: { id: NavView; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Hiring Inbox', icon: '◫' },
  { id: 'pipeline', label: 'Pipeline Health', icon: '▤' },
  { id: 'interviews', label: 'Interviews', icon: '◉' },
  { id: 'decisions', label: 'Decisions', icon: '◎' },
];

const HM_NAV: { id: NavView; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Decision Queue', icon: '◫' },
  { id: 'interviews', label: 'Interviews', icon: '◉' },
  { id: 'decisions', label: 'Decisions', icon: '◎' },
];

export function LeftRail({ activeView, onNavigate }: LeftRailProps) {
  const { currentUser, login, logout, isSynced, lastSynced, syncApplicants } = useApp();

  if (!currentUser) return null;

  const isRecruiter = currentUser.role === 'recruiter';
  const navItems = isRecruiter ? RECRUITER_NAV : HM_NAV;
  const otherUsers = USERS.filter((u) => u.id !== currentUser.id);

  return (
    <nav className="rail" aria-label="Main navigation">
      <div className="rail__brand">
        <span className="rail__mark">HF</span>
        <span className="rail__name">HireFlow</span>
      </div>

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
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`rail__nav-item ${activeView === item.id ? 'rail__nav-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="rail__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {isRecruiter && (
        <div className="rail__sync">
          <button type="button" className="rail__sync-btn" onClick={syncApplicants}>
            Sync Applicants
          </button>
          <span className="rail__sync-meta">
            {isSynced ? `Synced ${formatRelativeSync(lastSynced)}` : 'Not synced'}
          </span>
          <span className="rail__ats">External ATS</span>
        </div>
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
              title={`Switch to ${user.name}`}
            >
              <span className="rail__switcher-avatar">{user.name.charAt(0)}</span>
              <span className="rail__switcher-name">{user.name.split(' ')[0]}</span>
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
