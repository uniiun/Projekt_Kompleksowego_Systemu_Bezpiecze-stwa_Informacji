import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/login/', {
        username: email,
        password: password
      });
      localStorage.setItem('access_token', response.data.access);
      navigate('/');
    } catch (err) {
      setError('Niepoprawny login (email) lub hasło.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to instantly log in using a demo account during presentation
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);

    // Auto-submit after a slight delay to let user see the filled data
    setLoading(true);
    setError('');
    setTimeout(async () => {
      try {
        const response = await apiClient.post('/auth/login/', {
          username: demoEmail,
          password: demoPassword
        });
        localStorage.setItem('access_token', response.data.access);
        navigate('/');
      } catch (err) {
        setError('Błąd szybkiego logowania.');
        setLoading(false);
      }
    }, 400);
  };

  const demoAccounts = [
    { email: 'admin@example.com', pass: 'admin123', label: 'Admin (Zarząd)', role: 'ADMIN', color: '#f43f5e' },
    { email: 'manager.it@example.com', pass: 'manager123', label: 'Manager (IT)', role: 'MANAGER', color: '#fb923c' },
    { email: 'employee.it@example.com', pass: 'emp123', label: 'Pracownik (IT)', role: 'EMPLOYEE', color: '#38bdf8' },
    { email: 'employee.hr@example.com', pass: 'emp123', label: 'Pracownik (HR)', role: 'EMPLOYEE', color: '#38bdf8' },
    { email: 'auditor@example.com', pass: 'audyt123', label: 'Audytor (Audyt)', role: 'AUDITOR', color: '#a78bfa' }
  ];

  return (
    <div className="row align-items-center justify-content-center mt-5 min-vh-75">
      <div className="col-lg-5 col-md-8">
        <div className="card shadow-lg p-4 border border-light border-opacity-10 position-relative">
          {/* Neon top line glow */}
          <div className="position-absolute top-0 start-0 w-100" style={{ height: '3px', background: 'linear-gradient(to right, #6366f1, #06b6d4)' }}></div>

          <div className="card-body">
            <div className="text-center mb-4">
              {/* Glowing Shield Logo */}
              <div className="d-inline-flex p-3 rounded-circle mb-3 border border-primary border-opacity-20" style={{ background: 'rgba(99, 102, 241, 0.08)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="card-title fw-bold text-white tracking-wide">Konsola Bezpieczeństwa</h3>
              <p className="text-muted small">Wprowadź dane autoryzacyjne, aby uzyskać dostęp.</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-danger rounded-3" style={{ fontSize: '0.85rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="small text-uppercase tracking-wider font-monospace">E-mail identyfikacyjny</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-control"
                  placeholder="nazwa@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="mb-4">
                <label className="small text-uppercase tracking-wider font-monospace">Klucz dostępu (Hasło)</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-control"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Autoryzacja...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Zaloguj się bezpiecznie
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Presentation Helper Card */}
      <div className="col-lg-4 col-md-8 mt-4 mt-lg-0">
        <div className="card border border-light border-opacity-5 p-3" style={{ background: 'rgba(10, 15, 30, 0.5) !important' }}>
          <div className="card-body">
            <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Konsola Prezentacyjna
            </h5>
            <p className="text-muted small mb-3">Kliknij profil testowy, aby natychmiast zalogować się z predefiniowanymi uprawnieniami (RBAC):</p>

            <div className="d-flex flex-column gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleQuickLogin(account.email, account.pass)}
                  disabled={loading}
                  className="btn btn-sm btn-outline-light text-start p-2.5 d-flex align-items-center justify-content-between"
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <span className="text-white fw-bold small block">{account.label}</span>
                    <span className="d-block text-muted" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{account.email}</span>
                  </div>
                  <span className="role-tag" style={{
                    color: account.color,
                    backgroundColor: `${account.color}15`,
                    borderColor: `${account.color}25`
                  }}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
