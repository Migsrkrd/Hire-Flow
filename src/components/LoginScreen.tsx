import { USERS } from '../data/users';
import { useApp } from '../context/AppContext';

export function LoginScreen() {
  const { login } = useApp();

  const recruiters = USERS.filter((u) => u.role === 'recruiter');
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');

  return (
    <div className="login">
      <div className="login__main">
        <div className="login__brand">
          <span className="login__mark">HF</span>
          <h1>HireFlow</h1>
          <p className="login__tagline">
            Internal hiring command center — sync messy applicant data, act on what matters.
          </p>
        </div>

        <div className="login__grid">
          <section className="login__section">
            <h2>Recruiters</h2>
            <div className="login__users">
              {recruiters.map((user) => (
                <button key={user.id} type="button" className="login__user" onClick={() => login(user)}>
                  <span className="login__avatar">{user.name.charAt(0)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.title}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="login__section">
            <h2>Hiring Managers</h2>
            <div className="login__users">
              {hiringManagers.map((user) => (
                <button key={user.id} type="button" className="login__user" onClick={() => login(user)}>
                  <span className="login__avatar login__avatar--hm">{user.name.charAt(0)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.title}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <p className="login__foot">Demo — no authentication</p>
      </div>

      <aside className="login__aside">
        <span className="login__pill">External ATS → HireFlow</span>
        <h2>What do I need to do next?</h2>
        <p>
          Not another dashboard. A work-first inbox that turns noisy applications into
          clear decisions — different views for recruiters and hiring managers.
        </p>
        <ul>
          <li>Hiring Inbox with attention-prioritized queue</li>
          <li>AI Insights integrated into every brief</li>
          <li>Pipeline Health when you need the big picture</li>
        </ul>
      </aside>
    </div>
  );
}
