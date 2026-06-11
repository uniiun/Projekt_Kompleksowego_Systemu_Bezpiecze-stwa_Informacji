import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    docsCount: 0,
    logsCount: 0
  });
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticsError, setDiagnosticsError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await apiClient.get('/me/');
        setUser(userRes.data);

        // Fetch documents count that this user has access to
        const docsRes = await apiClient.get('/documents/');
        const docsCount = docsRes.data.length;

        // Fetch logs count if authorized
        let logsCount = 0;
        const role = userRes.data?.profile?.role;
        if (role === 'ADMIN' || role === 'AUDITOR') {
          const logsRes = await apiClient.get('/audit-logs/');
          logsCount = logsRes.data.length;
        }

        if (role === 'ADMIN') {
          try {
            const diagRes = await apiClient.get('/diagnostics/');
            setDiagnostics(diagRes.data);
            setDiagnosticsError(null);
          } catch (diagErr) {
            console.error('Błąd pobierania danych diagnostycznych:', diagErr);
            setDiagnostics(null);
            setDiagnosticsError('Brak połączenia z API diagnostyki');
          }
        }

        setStats({ docsCount, logsCount });
      } catch (err) {
        console.error('Błąd pobierania danych kokpitu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Autoryzacja tokenu i pobieranie statusu..." />;
  if (!user) return <div className="alert alert-danger mt-4">Nie udało się załadować danych użytkownika. Zaloguj się ponownie.</div>;

  const role = user.profile?.role;
  const departmentName = user.profile?.department_name || 'Zarząd / Globalny';
  const threatLevel = diagnostics?.threat_level || 'UNKNOWN';
  const threatLabel =
    threatLevel === 'LOW'
      ? 'NISKI (LOW)'
      : threatLevel === 'ELEVATED'
        ? 'PODWYŻSZONY (ELEVATED)'
        : threatLevel === 'HIGH'
          ? 'WYSOKI (HIGH)'
          : 'NIEZNANY (UNKNOWN)';
  const threatClass =
    threatLevel === 'LOW'
      ? 'text-success'
      : threatLevel === 'ELEVATED'
        ? 'text-warning'
        : 'text-danger';
  const diagnosticsAvailable = Boolean(diagnostics);
  const auditIntegrityLabel = diagnosticsAvailable
    ? (diagnostics?.audit_pipeline_active ? 'PIPELINE ACTIVE' : 'PIPELINE OFF')
    : 'NIEDOSTĘPNE';
  const auditIntegrityStatus = diagnosticsAvailable
    ? (diagnostics?.audit_hashing_enabled
      ? `Hashowanie: ✓ Włączone • Łańcuch: ${diagnostics?.audit_chain_valid ? 'OK' : 'NIESPÓJNY'}`
      : 'Hashowanie: ✗ Wyłączone')
    : 'Brak danych z endpointu /api/diagnostics/';
  const encryptionLabel = diagnostics?.encryption_standard || 'NIEDOSTĘPNE';
  const dbEngineLabel = diagnostics?.rbac_db_engine?.includes('sqlite')
    ? 'SQLITE ACTIVE'
    : diagnosticsAvailable
      ? 'DB ACTIVE'
      : 'NIEDOSTĘPNE';
  const deniedLast24h = diagnostics?.denied_last_24h ?? 0;
  const deniedLast1h = diagnostics?.denied_last_1h ?? 0;

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
      case 'MANAGER': return 'Menedżer';
      case 'EMPLOYEE': return 'Pracownik';
      case 'AUDITOR': return 'Audytor';
      default: return r || '';
    }
  };

  // Define dynamic permission items based on the user's role
  const getPermissionSpecs = (r) => {
    const items = [
      { text: 'Dostęp do dokumentów PUBLIC', allowed: true },
    ];

    switch (r) {
      case 'ADMIN':
        return [
          { text: 'Odczyt wszystkich dokumentów (PUBLIC, INTERNAL, CONFIDENTIAL, SECRET)', allowed: true },
          { text: 'Dodawanie i Edycja dokumentów w dowolnym dziale', allowed: true },
          { text: 'Usuwanie dokumentów (Wyłączne uprawnienie)', allowed: true },
          { text: 'Przeglądanie całościowych logów audytu systemu', allowed: true },
          { text: 'Zarządzanie strukturą użytkowników i działów', allowed: true },
        ];
      case 'MANAGER':
        return [
          { text: `Odczyt dokumentów swojego działu (${departmentName})`, allowed: true },
          { text: `Dodawanie i Edycja dokumentów w dziale: ${departmentName}`, allowed: true },
          { text: 'Dostęp do logów audytu (Historia operacji)', allowed: false },
          { text: 'Odczyt dokumentów innych działów (INTERNAL/CONFIDENTIAL)', allowed: false },
          { text: 'Usuwanie dokumentów (Tylko Admin)', allowed: false },
        ];
      case 'EMPLOYEE':
        return [
          { text: `Odczyt dokumentów INTERNAL swojego działu (${departmentName})`, allowed: true },
          { text: 'Odczyt dokumentów CONFIDENTIAL i SECRET', allowed: false },
          { text: 'Dodawanie i edycja plików w systemie', allowed: false },
          { text: 'Dostęp do logów audytu (Historia operacji)', allowed: false },
        ];
      case 'AUDITOR':
        return [
          { text: 'Odczyt dokumentów PUBLIC i INTERNAL (Tylko Odczyt)', allowed: true },
          { text: 'Pełny dostęp do rejestru logów audytu systemu', allowed: true },
          { text: 'Weryfikacja prób naruszeń i odmów dostępu', allowed: true },
          { text: 'Wprowadzanie zmian lub dodawanie dokumentów', allowed: false },
          { text: 'Usuwanie jakichkolwiek zasobów', allowed: false },
        ];
      default:
        return items;
    }
  };

  const permissions = getPermissionSpecs(role);

  return (
    <div className="pb-4">
      {/* Welcome Banner */}
      <div className="card p-4 border border-light border-opacity-10 mb-4 text-white position-relative"
           style={{
             background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.65) 0%, rgba(10, 15, 28, 0.85) 100%)',
             overflow: 'hidden'
           }}>
        {/* Subtle, properly positioned lock background watermark */}
        <div
          className="position-absolute d-none d-md-block"
          style={{
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.06,
            pointerEvents: 'none'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <div className="row align-items-center">
          <div className="col">
            <span className="text-primary font-monospace small text-uppercase tracking-wider">Tarcza Bezpieczeństwa (Enforcer v1.2)</span>
            <h2 className="fw-extrabold text-white mt-1 mb-2">Witaj, {user.first_name || user.username}!</h2>
            <p className="text-white-50 mb-0">Twoja tożsamość i uprawnienia organizacyjne zostały pomyślnie zweryfikowane.</p>
          </div>
          <div className="col-auto">
            <span className={`role-tag p-2 fs-6 ${getRoleClass(role)}`}>
              {getRoleDisplay(role)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4 col-md-6 col-12">
          <div className="card h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small uppercase font-monospace">Dział Organizacyjny</span>
                <h4 className="fw-bold text-white mt-1 mb-0">{departmentName}</h4>
              </div>
              <div className="p-3 bg-info bg-opacity-10 border border-info border-opacity-20 text-info rounded-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 col-md-6 col-12">
          <Link to="/documents" className="text-decoration-none">
            <div className="card h-100 p-3 glass-panel-hover">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small uppercase font-monospace">Dostępne Dokumenty</span>
                  <h4 className="fw-bold text-white mt-1 mb-0">{stats.docsCount} plików</h4>
                </div>
                <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 text-primary rounded-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-lg-4 col-md-12 col-12">
          {role === 'ADMIN' || role === 'AUDITOR' ? (
            <Link to="/audit" className="text-decoration-none">
              <div className="card h-100 p-3 glass-panel-hover">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small uppercase font-monospace">Rejestry Audytu</span>
                    <h4 className="fw-bold text-white mt-1 mb-0">{stats.logsCount} logów</h4>
                  </div>
                  <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-20 text-warning rounded-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="card h-100 p-3 opacity-75">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small uppercase font-monospace">Rejestry Audytu</span>
                  <h4 className="fw-bold text-muted mt-1 mb-0">Zablokowane</h4>
                </div>
                <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-10 text-danger rounded-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RBAC Clearances & Shortcuts */}
      <div className="row g-4 mb-4">
        {/* Permission Specifications */}
        <div className="col-lg-7 col-md-12">
          <div className="card p-4 h-100">
            <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3 border-bottom border-light border-opacity-10 pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Poziom Uprawnień Systemowych (RBAC)
            </h5>

            <p className="text-white-50 small mb-4">
              Twoja rola <strong>{getRoleDisplay(role)}</strong> posiada ściśle zdefiniowany zestaw uprawnień w modelu autoryzacji systemu:
            </p>

            <div className="d-flex flex-column gap-3">
              {permissions.map((perm, idx) => (
                <div key={idx} className="d-flex align-items-start gap-3">
                  <span className={`p-1 rounded-circle mt-0.5 d-flex align-items-center justify-content-center`}
                        style={{
                          backgroundColor: perm.allowed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: perm.allowed ? '#10b981' : '#ef4444',
                          border: `1px solid ${perm.allowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                    {perm.allowed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    )}
                  </span>
                  <div>
                    <span className={`fw-medium ${perm.allowed ? 'text-white' : 'text-muted text-decoration-line-through'}`} style={{ fontSize: '0.92rem' }}>
                      {perm.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="col-lg-5 col-md-12">
          <div className="card p-4 h-100">
            <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3 border-bottom border-light border-opacity-10 pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Szybkie Operacje
            </h5>

            <div className="d-flex flex-column gap-3 mt-2">
              <Link to="/documents" className="btn btn-outline-light text-start p-3 d-flex align-items-center gap-3 glass-panel-hover" style={{ borderRadius: '12px !important' }}>
                <div className="p-2 bg-info bg-opacity-10 text-info rounded-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <div className="fw-bold text-white small">Przeglądaj Dokumentację</div>
                  <span className="text-white-50" style={{ fontSize: '0.75rem' }}>Przeglądaj zasoby według poufności</span>
                </div>
              </Link>

              {(role === 'ADMIN' || role === 'MANAGER') && (
                <Link to="/documents/new" className="btn btn-outline-light text-start p-3 d-flex align-items-center gap-3 glass-panel-hover" style={{ borderRadius: '12px !important' }}>
                  <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="fw-bold text-white small">Dodaj nowy dokument</div>
                    <span className="text-white-50" style={{ fontSize: '0.75rem' }}>Utwórz zasób i przypisz poziom poufności</span>
                  </div>
                </Link>
              )}

              {role === 'ADMIN' && (
                <Link to="/users" className="btn btn-outline-light text-start p-3 d-flex align-items-center gap-3 glass-panel-hover" style={{ borderRadius: '12px !important' }}>
                  <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="fw-bold text-white small">Zarządzanie Użytkownikami</div>
                    <span className="text-white-50" style={{ fontSize: '0.75rem' }}>Role, działy i uprawnienia dostępu</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Diagnostics Dashboard Widget */}
      {role === 'ADMIN' && (
        <div className="card p-4 border border-light border-opacity-10 mt-4 overflow-hidden position-relative">
          {/* Pulsing visual trace radar */}
          <div className="position-absolute end-0 top-0 m-4 text-primary d-flex align-items-center gap-1.5 font-monospace small tracking-wider" style={{ opacity: 0.65 }}>
            <span className="d-inline-block rounded-circle bg-success" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px #10b981', animation: 'blink 1.5s infinite' }}></span>
            NOD-ENFORCER: {diagnostics?.service_status || 'NIEDOSTĘPNE'}
          </div>

          <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3 border-bottom border-light border-opacity-10 pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" className="me-1">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Konsola Diagnostyczna Tarczy Bezpieczeństwa
          </h5>

          {diagnosticsError && (
            <div className="alert alert-warning py-2 px-3 mb-3" role="alert" style={{ fontSize: '0.8rem' }}>
              {diagnosticsError}
            </div>
          )}

          <div className="row g-4 text-center mt-1">
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 bg-black bg-opacity-20 border border-light border-opacity-5 rounded-3">
                <span className="text-muted small block uppercase font-monospace">Standard Szyfrowania</span>
                <strong className="text-white d-block mt-1 font-monospace" style={{ letterSpacing: '0.5px' }}>{encryptionLabel}</strong>
                <small className="text-muted small block mt-1" style={{ fontSize: '0.7rem' }}>
                  TLS: {diagnostics?.encryption_in_transit_enabled ? 'Wymuszone' : 'Tryb DEV'}
                </small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 bg-black bg-opacity-20 border border-light border-opacity-5 rounded-3">
                <span className="text-muted small block uppercase font-monospace">Integralność Audytu</span>
                <strong className="text-white d-block mt-1 font-monospace" style={{ letterSpacing: '0.5px' }}>{auditIntegrityLabel}</strong>
                <small className="text-muted small block mt-1" style={{ fontSize: '0.7rem' }}>
                  {auditIntegrityStatus} • Zdarzenia 24h: {diagnostics?.recent_audit_events_24h ?? 0}
                </small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 bg-black bg-opacity-20 border border-light border-opacity-5 rounded-3">
                <span className="text-muted small block uppercase font-monospace">Poziom Zagrożeń</span>
                <strong className={`${threatClass} d-block mt-1 font-monospace`} style={{ letterSpacing: '0.5px', textShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>{threatLabel}</strong>
                <small className="text-white-50 small block mt-1" style={{ fontSize: '0.7rem' }}>
                  Odmowy: 1h={deniedLast1h}, 24h={deniedLast24h}
                </small>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 bg-black bg-opacity-20 border border-light border-opacity-5 rounded-3">
                <span className="text-muted small block uppercase font-monospace">Baza Danych RBAC</span>
                <strong className="text-white d-block mt-1 font-monospace" style={{ letterSpacing: '0.5px' }}>{dbEngineLabel}</strong>
                <small className="text-info small block mt-1" style={{ fontSize: '0.7rem' }}>Logi: {diagnostics?.total_logs ?? 0}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
