import { USERS } from '../data/users';
import { useApp } from '../context/AppContext';

export function LoginScreen() {
  const { login } = useApp();

  const recruiters = USERS.filter((u) => u.role === 'recruiter');
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__logo">HF</div>
          <h1>HireFlow</h1>
          <p className="login__tagline">
            A cleaner layer on top of messy applicant data — built for recruiters and hiring managers.
          </p>
        </div>

        <div className="login__sections">
          <section>
            <h2>Recruiters</h2>
            <p className="login__section-desc">Review, filter, and move candidates through the pipeline.</p>
            <div className="login__users">
              {recruiters.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="login__user-card"
                  onClick={() => login(user)}
                >
                  <span className="login__avatar">{user.name.charAt(0)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.title}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Hiring Managers</h2>
            <p className="login__section-desc">Focused view — only candidates assigned to you.</p>
            <div className="login__users">
              {hiringManagers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="login__user-card login__user-card--hm"
                  onClick={() => login(user)}
                >
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

        <p className="login__footnote">Demo login — no real authentication</p>
      </div>

      <div className="login__hero">
        <div className="login__hero-content">
          <span className="login__hero-badge">Imported from External ATS</span>
          <h2>Turn noisy applications into clear decisions</h2>
          <p>
            HireFlow doesn&apos;t replace your application website. It syncs messy candidate data and
            gives each role exactly what they need — queues for recruiters, summaries for hiring managers.
          </p>
          <ul className="login__features">
            <li>Sync applicants from external portal</li>
            <li>AI-style summaries (simulated)</li>
            <li>Role-specific workflows</li>
            <li>Filter, search, and act fast</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
