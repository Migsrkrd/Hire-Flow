import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

export function SettingsPanel() {
  const { showToast } = useApp();

  const handleReset = () => {
    localStorage.removeItem('hireflow-state');
    showToast('Demo data reset — reload the page', 'info');
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <section className="queue-panel settings-panel">
      <header className="queue-panel__header">
        <h1 className="queue-panel__title">Settings</h1>
      </header>
      <div className="settings-panel__body">
        <EmptyState
          title="Settings coming soon"
          description="In production: ATS connection config, notification preferences, team assignments, and audit export."
        />
        <div className="settings-panel__demo">
          <span className="brief__label">Demo controls</span>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Reset demo data
          </Button>
        </div>
      </div>
    </section>
  );
}
