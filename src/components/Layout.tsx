import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { formatRelativeSync } from '../utils/helpers';
import { Button } from './ui/Button';

interface LayoutProps {
  children: ReactNode;
  onSync?: () => void;
  showSync?: boolean;
}

export function Layout({ children, onSync, showSync }: LayoutProps) {
  const { currentUser, logout, isSynced, lastSynced } = useApp();

  if (!currentUser) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">HF</span>
          <div>
            <strong>HireFlow</strong>
            <small>Recruiting Portal</small>
          </div>
        </div>

        <div className="sidebar__user">
          <span className="sidebar__avatar">{currentUser.name.charAt(0)}</span>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.title}</small>
          </div>
        </div>

        <div className="sidebar__role-badge">
          {currentUser.role === 'recruiter' ? 'Recruiter View' : 'Hiring Manager View'}
        </div>

        {showSync && (
          <div className="sidebar__sync">
            <Button onClick={onSync} className="sidebar__sync-btn">
              Sync Applicants
            </Button>
            <div className="sidebar__sync-meta">
              <span className="sidebar__ats-label">Imported from External ATS</span>
              <span>Last synced: {formatRelativeSync(lastSynced)}</span>
              {!isSynced && <span className="sidebar__sync-warn">Not synced yet</span>}
            </div>
          </div>
        )}

        <div className="sidebar__spacer" />

        <Button variant="ghost" size="sm" onClick={logout} className="sidebar__logout">
          Switch user
        </Button>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
