import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      apiClient.get('/me/')
        .then(res => setUser(res.data))
        .catch(err => {
          console.error('Błąd podczas pobierania danych użytkownika w Navbar:', err);
        });
    } else {
      setUser(null);
    }
  }, [token, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    navigate('/login');
  };

  if (!token) return null;

  const role = user?.profile?.role;
  const showAuditLink = role === 'ADMIN' || role === 'AUDITOR' || role === 'MANAGER';

  const getRoleClass = (r) => {
    switch (r) {
      case 'ADMIN': return 'role-admin';
      case 'MANAGER': return 'role-manager';
      case 'EMPLOYEE': return 'role-employee';
      case 'AUDITOR': return 'role-auditor';
      default: return '';
    }
  };

  const getRoleDisplay = (r) => {
    switch (r) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Pracownik';
      case 'AUDITOR': return 'Audytor';
      default: return r || '';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          {/* Cyber shield SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          SecureDocs
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-3 mb-lg-0 mt-2 mt-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
                Kokpit
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname.startsWith('/documents') ? 'active' : ''}`} to="/documents">
                Dokumenty
              </Link>
            </li>
            {showAuditLink && (
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/audit' ? 'active' : ''}`} to="/audit">
                  Audyt
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`} to="/users">
                Użytkownicy
              </Link>
            </li>
          </ul>

          {user && (
            <div className="d-flex align-items-lg-center flex-column flex-lg-row gap-3 mt-3 mt-lg-0">
              {/* Premium Glassmorphic User Profile Capsule */}
              <div
                className="d-flex align-items-center gap-3 p-2 px-3 border border-light border-opacity-10 rounded-pill"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(5px)'
                }}
              >
                {/* Active user status avatar */}
                <div className="position-relative">
                  <div className="p-1 bg-dark bg-opacity-40 border border-light border-opacity-10 rounded-circle text-muted" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                    👤
                  </div>
                  <span
                    className="position-absolute bottom-0 end-0 rounded-circle bg-success"
                    style={{
                      width: '8px',
                      height: '8px',
                      border: '1.5px solid #080A14',
                      boxShadow: '0 0 6px #10b981'
                    }}
                  />
                </div>

                <div className="text-start">
                  <div className="text-white small fw-bold leading-none mb-0.5" style={{ fontSize: '0.85rem' }}>{user.email}</div>
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <span className={`role-tag ${getRoleClass(role)}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>
                      {getRoleDisplay(role)}
                    </span>
                    <span className="text-white-50" style={{ fontSize: '0.68rem' }}>
                      ({user.profile?.department_name || 'Globalny'})
                    </span>
                  </div>
                </div>
              </div>

              <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-2 px-3 align-self-start align-self-lg-center" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Wyloguj
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
