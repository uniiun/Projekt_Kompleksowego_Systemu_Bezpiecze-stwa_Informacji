import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';

const Sidebar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast('Wylogowano z systemu bezpieczeństwa.', 'info');
    navigate('/login');
  };

  // Do not render sidebar if not logged in or user profile is still loading
  if (!token || !user) return null;

  const role = user?.profile?.role;
  const showAuditLink = role === 'ADMIN' || role === 'AUDITOR';
  const showUsersLink = role === 'ADMIN';

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
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Pracownik';
      case 'AUDITOR': return 'Audytor';
      default: return r || '';
    }
  };

  return (
    <aside className="sidebar d-flex flex-column p-3 bg-dark border-end border-light border-opacity-10 h-100 position-fixed transition-colors" style={{ width: '280px', top: 0, left: 0, overflowY: 'auto', zIndex: 1040 }}>
      <Link className="d-flex align-items-center mb-4 mt-2 me-md-auto text-decoration-none gap-3 px-2" to="/">
        <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <span className="fs-5 fw-extrabold tracking-wider text-white">NEXUS<span className="text-primary">SECURE</span></span>
      </Link>
      
      <hr className="border-light border-opacity-25" />
      
      <ul className="nav nav-pills flex-column mb-auto gap-2 mt-2">
        <li className="nav-item">
          <Link to="/" className={`nav-link d-flex align-items-center gap-3 py-2 px-3 fw-medium ${location.pathname === '/' ? 'active bg-primary bg-opacity-25 text-primary shadow-sm border border-primary border-opacity-10' : 'text-white-50 hover-text-white'}`} style={{ borderRadius: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            Kokpit
          </Link>
        </li>
        <li>
          <Link to="/documents" className={`nav-link d-flex align-items-center gap-3 py-2 px-3 fw-medium ${location.pathname.startsWith('/documents') ? 'active bg-info bg-opacity-25 text-info shadow-sm border border-info border-opacity-10' : 'text-white-50 hover-text-white'}`} style={{ borderRadius: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Zasoby Informacyjne
          </Link>
        </li>
        {showAuditLink && (
          <li>
            <Link to="/audit" className={`nav-link d-flex align-items-center gap-3 py-2 px-3 fw-medium ${location.pathname === '/audit' ? 'active bg-warning bg-opacity-25 text-warning shadow-sm border border-warning border-opacity-10' : 'text-white-50 hover-text-white'}`} style={{ borderRadius: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Dziennik Audytu
            </Link>
          </li>
        )}
        {showUsersLink && (
          <li>
            <Link to="/users" className={`nav-link d-flex align-items-center gap-3 py-2 px-3 fw-medium ${location.pathname === '/users' ? 'active bg-danger bg-opacity-25 text-danger shadow-sm border border-danger border-opacity-10' : 'text-white-50 hover-text-white'}`} style={{ borderRadius: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Tożsamości IAM
            </Link>
          </li>
        )}
      </ul>
      
      <hr className="border-light border-opacity-25" />
      
      <div className="mt-2">
        <Link to="/profile" className="d-flex align-items-center gap-3 p-3 rounded-4 text-decoration-none border border-light border-opacity-5 glass-panel-hover" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="position-relative">
             <div className="p-1 bg-black bg-opacity-40 border border-light border-opacity-10 rounded-circle text-muted" style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👤</div>
             <span className="position-absolute bottom-0 end-0 rounded-circle bg-success shadow-sm" style={{ width: '12px', height: '12px', border: '2px solid var(--bg-card)' }} />
          </div>
          <div className="text-start overflow-hidden w-100">
            <div className="text-white small fw-bold text-truncate">{user.email}</div>
            <div className="d-flex align-items-center gap-1.5 mt-1">
              <span className={`role-tag ${getRoleClass(role)}`} style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}>{getRoleDisplay(role)}</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-3 d-flex gap-2">
        <button className="btn btn-outline-light d-flex align-items-center justify-content-center flex-grow-1 py-2 fw-medium shadow-sm" style={{ borderRadius: '10px' }} onClick={toggleTheme} title="Zmień motyw">
          {theme === 'dark' ? (
            <span className="d-flex align-items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg> Jasny</span>
          ) : (
            <span className="d-flex align-items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Ciemny</span>
          )}
        </button>
        <button className="btn btn-outline-danger d-flex align-items-center justify-content-center px-3 shadow-sm" style={{ borderRadius: '10px' }} onClick={handleLogout} title="Wyloguj">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
