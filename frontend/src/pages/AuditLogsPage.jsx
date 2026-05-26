import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Reporting states
  const [searchUser, setSearchUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    apiClient.get('/audit-logs/')
      .then(res => {
        setLogs(res.data);
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          setError('Brak uprawnień do przeglądania logów audytu.');
        } else {
          setError('Wystąpił błąd podczas pobierania logów audytu.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getActionDisplay = (act) => {
    switch (act) {
      case 'LOGIN': return '🔐 Logowanie';
      case 'VIEW_LIST': return '📂 Lista plików';
      case 'VIEW_DOCUMENT': return '👁️ Podgląd';
      case 'DOWNLOAD_DOCUMENT': return '📥 Pobranie';
      case 'CREATE_DOCUMENT': return '➕ Dodanie';
      case 'UPDATE_DOCUMENT': return '✏️ Edycja';
      case 'DELETE_DOCUMENT': return '❌ Usunięcie';
      case 'ACCESS_DENIED': return '⚠️ Odmowa';
      default: return act;
    }
  };

  const getActionBadgeClass = (act) => {
    switch (act) {
      case 'ACCESS_DENIED': return 'badge-action-denied';
      case 'LOGIN': return 'badge-action-login';
      case 'VIEW_LIST': return 'badge-action-list';
      case 'VIEW_DOCUMENT': return 'badge-action-view';
      case 'DOWNLOAD_DOCUMENT': return 'badge-action-download';
      case 'CREATE_DOCUMENT': return 'badge-action-create';
      case 'UPDATE_DOCUMENT': return 'badge-action-update';
      case 'DELETE_DOCUMENT': return 'badge-action-delete';
      default: return 'badge-action-list';
    }
  };

  // Filter logic on client-side
  const filteredLogs = logs.filter(log => {
    // 1. User search
    const matchesUser = (log.user_name || '').toLowerCase().includes(searchUser.toLowerCase());

    // 2. Action search
    const matchesAction = selectedAction === '' || log.action === selectedAction;

    // 3. Status search
    let matchesStatus = true;
    if (selectedStatus === 'success') matchesStatus = log.success === true;
    if (selectedStatus === 'denied') matchesStatus = log.success === false;

    // 4. Date range search
    const logDate = new Date(log.created_at);

    let matchesStartDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesStartDate = logDate >= start;
    }

    let matchesEndDate = true;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesEndDate = logDate <= end;
    }

    return matchesUser && matchesAction && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const handleResetFilters = () => {
    setSearchUser('');
    setSelectedAction('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  // Preset Date Helper
  const setPresetDate = (days) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    // Format to YYYY-MM-DD
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(today));
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("Brak logów do wygenerowania raportu.");
      return;
    }

    // Excel CSV formatting headers (Semicolon separator for Polish Excel)
    const headers = ['ID', 'Data zdarzenia', 'Operator', 'Akcja', 'Zasob', 'Status', 'Adres IP'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString('pl-PL').replace(',', ''),
      log.user_name || 'Niezalogowany',
      log.action,
      log.document_title ? log.document_title.replace(/;/g, ',') : '-',
      log.success ? 'SUKCES (Zezwolono)' : 'ODMOWA (Zablokowano)',
      log.ip_address || 'Nieznane'
    ]);

    // Build CSV content with semicolon separator and quotes
    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${val}"`).join(';'))
    ].join('\r\n');

    // Prepend UTF-8 BOM for perfect Excel compatibility with Polish letters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    const formattedDate = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `raport_bezpieczenstwa_securedocs_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner message="Pobieranie rejestrów audytu bezpieczeństwa..." />;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="section-title text-white mb-0">Rejestr Bezpieczeństwa & Raportowanie</h2>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn btn-info d-flex align-items-center gap-2 shadow"
          style={{ background: 'linear-gradient(90deg, #06b6d4, #0891b2) !important' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Eksportuj Raport do CSV
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-3 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-danger p-4 rounded-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <h5 className="fw-bold mb-1">Odmowa Autoryzacji</h5>
            <p className="mb-0 small">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Advanced Filters & Reporting Console */}
          <div className="card p-4 mb-4 border border-light border-opacity-10">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2 border-bottom border-light border-opacity-5 pb-2 font-monospace uppercase tracking-wider" style={{ fontSize: '0.8rem' }}>
              ⚙️ Parametryzacja Filtru & Okresu Raportowania
            </h6>

            {/* Row 1: Primary Filters */}
            <div className="row g-3 align-items-end mb-3">
              <div className="col-lg-4 col-md-12">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold">Szukaj operatora</label>
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="form-control"
                  placeholder="Wpisz e-mail lub login..."
                />
              </div>

              <div className="col-lg-4 col-md-6">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold">Kategoria Zdarzenia</label>
                <select
                  value={selectedAction}
                  onChange={e => setSelectedAction(e.target.value)}
                  className="form-select"
                >
                  <option value="">Wszystkie operacje</option>
                  <option value="LOGIN">LOGIN (Logowanie)</option>
                  <option value="VIEW_LIST">VIEW_LIST (Pobranie listy)</option>
                  <option value="VIEW_DOCUMENT">VIEW_DOCUMENT (Podgląd)</option>
                  <option value="DOWNLOAD_DOCUMENT">DOWNLOAD_DOCUMENT (Pobranie)</option>
                  <option value="CREATE_DOCUMENT">CREATE_DOCUMENT (Dodanie)</option>
                  <option value="UPDATE_DOCUMENT">UPDATE_DOCUMENT (Edycja)</option>
                  <option value="DELETE_DOCUMENT">DELETE_DOCUMENT (Usunięcie)</option>
                  <option value="ACCESS_DENIED">ACCESS_DENIED (Odmowa)</option>
                </select>
              </div>

              <div className="col-lg-4 col-md-6">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold">Status Bezpieczeństwa</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="">Wszystkie zdarzenia</option>
                  <option value="success">SUKCES (Zezwolono)</option>
                  <option value="denied">ODMOWA (Próba naruszenia)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date Filters & Presets */}
            <div className="row g-3 align-items-end pt-2 border-top border-light border-opacity-5">
              <div className="col-lg-3 col-md-6">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold">Data początkowa (Od)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="form-control font-monospace"
                />
              </div>

              <div className="col-lg-3 col-md-6">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold">Data końcowa (Do)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="form-control font-monospace"
                />
              </div>

              <div className="col-lg-4 col-md-12">
                <label className="small text-uppercase tracking-wider font-monospace text-info fw-bold block mb-2">Szybkie Okresy</label>
                <div className="d-flex gap-2">
                  <button type="button" onClick={() => setPresetDate(0)} className="btn btn-sm btn-outline-light flex-grow-1 font-monospace" style={{ fontSize: '0.73rem' }}>
                    Dziś
                  </button>
                  <button type="button" onClick={() => setPresetDate(7)} className="btn btn-sm btn-outline-light flex-grow-1 font-monospace" style={{ fontSize: '0.73rem' }}>
                    7 Dni
                  </button>
                  <button type="button" onClick={() => setPresetDate(30)} className="btn btn-sm btn-outline-light flex-grow-1 font-monospace" style={{ fontSize: '0.73rem' }}>
                    30 Dni
                  </button>
                </div>
              </div>

              <div className="col-lg-2 col-md-12">
                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-1 py-2 font-monospace uppercase tracking-wider small"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="card overflow-hidden border border-light border-opacity-10 shadow">
            {/* Table statistics indicator */}
            <div className="p-3 bg-black bg-opacity-20 border-bottom border-light border-opacity-5 d-flex align-items-center justify-content-between text-muted small">
              <span>Wyszukano: <strong className="text-info">{filteredLogs.length}</strong> wpisów</span>
              {filteredLogs.length > 0 && <span className="font-monospace small tracking-wider text-success">✓ INTEGRITY SECURE</span>}
            </div>

            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data zdarzenia</th>
                    <th>Użytkownik</th>
                    <th>Akcja systemowa</th>
                    <th>Powiązany zasób</th>
                    <th>Status</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} style={{ transition: 'all 0.15s ease' }}>
                      <td className="font-monospace text-muted small">{log.id}</td>
                      <td className="small font-monospace text-white-50">
                        {new Date(log.created_at).toLocaleString('pl-PL')}
                      </td>
                      <td className="fw-semibold text-white">
                        {log.user_name || 'Niezalogowany (Anonim)'}
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${getActionBadgeClass(log.action)}`} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          {getActionDisplay(log.action)}
                        </span>
                      </td>
                      <td className="text-truncate fw-semibold text-white-50" style={{ maxWidth: '200px' }}>
                        {log.document_title ? (
                          <span>{log.document_title}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className={log.success ? 'badge-status-success' : 'badge-status-danger'}>
                          {log.success ? '✓ SUKCES' : '🛑 ODMOWA'}
                        </span>
                      </td>
                      <td className="font-monospace text-muted small">{log.ip_address || 'Nieznane'}</td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center p-5 text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-muted opacity-50">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p className="mb-0">Brak rejestrów spełniających podane kryteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogsPage;
