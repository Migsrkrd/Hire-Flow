import { USERS } from '../data/users';
import { useApp } from '../context/AppContext';

export function LoginScreen() {
  const { login } = useApp();

  const recruiters = USERS.filter((u) => u.role === 'recruiter');
  const hiringManagers = USERS.filter((u) => u.role === 'hiring_manager');

  return (
    <div className="login">
      <main className="login__main">
        <div className="login__brand">
          <span className="login__mark">HF</span>
          <span className="login__layer">Intelligence layer · not another ATS</span>
        </div>

        <h1 className="login__headline">Know what to do next.<br />Then do it.</h1>

        <p className="login__subtext">
          HireFlow tells you which hiring decisions deserve your attention today —
          and walks you through them one at a time.
        </p>

        <div className="login__roles">
          <section className="login__role-section">
            <h2>Continue as Recruiter</h2>
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

          <section className="login__role-section">
            <h2>Continue as Hiring Manager</h2>
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

        <p className="login__foot">Evaluation demo. No authentication required.</p>
      </main>
    </div>
  );
}
