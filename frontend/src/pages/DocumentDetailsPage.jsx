import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [me, setMe] = useState(null);
  const [relatedLogs, setRelatedLogs] = useState([]);
  const [allDocs, setAllDocs] = useState([]); // Used for security testing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // File preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // Security simulation states
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);
    try {
      // 1. Fetch user profile
      const userRes = await apiClient.get('/me/');
      setMe(userRes.data);
      const role = userRes.data?.profile?.role;

      // 2. Fetch document details
      const docRes = await apiClient.get(`/documents/${id}/`);
      setDoc(docRes.data);

      // 3. Fetch audit logs related to this document (only for authorized roles)
      if (role === 'ADMIN' || role === 'AUDITOR') {
        const logsRes = await apiClient.get(`/audit-logs/?document=${id}`);
        setRelatedLogs(logsRes.data);
      }

      // 4. Fetch list of all documents to allow user to trigger "unauthorized access attempts" for testing
      const allDocsRes = await apiClient.get('/documents/');
      setAllDocs(allDocsRes.data);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setError('Brak uprawnień do przeglądania szczegółów tego dokumentu.');
      } else if (err.response && err.response.status === 404) {
        setError('Dokument o podanym identyfikatorze nie został odnaleziony w bazie danych.');
      } else {
        setError('Wystąpił błąd podczas ładowania szczegółów dokumentu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const ext = doc.file ? doc.file.split('.').pop().toLowerCase() : '';

      if (ext === 'docx') {
        try {
          // Pobieranie odszyfrowanego pliku jako arraybuffer
          const res = await apiClient.get(`/documents/${id}/download/`, { responseType: 'arraybuffer' });
          const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
          setPreviewHtml(result.value);
          setPreviewText('');
          setPreviewUrl('');
          setShowPreviewModal(true);
          setTimeout(refreshLogs, 1000);
          return;
        } catch (e) {
          console.error('Blad konwersji docx na HTML:', e);
        }
      }

      if (['txt', 'csv', 'md'].includes(ext)) {
        try {
          const res = await apiClient.get(`/documents/${id}/preview_content/`);
          if (res.data.type === 'text') {
            setPreviewText(res.data.content);
            setPreviewHtml('');
            setPreviewUrl('');
            setShowPreviewModal(true);
            setTimeout(refreshLogs, 1000);
            return;
          }
        } catch (e) {
          console.error('Blad podgladu tekstowego', e);
        }
      }

      // Fallback dla PDF, obrazow, mediow - tworzymy tymczasowy URL z bloba
      const blobRes = await apiClient.get(`/documents/${id}/download/`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(blobRes.data);
      setPreviewUrl(blobUrl);
      setPreviewText('');
      setPreviewHtml('');
      setShowPreviewModal(true);
      setTimeout(refreshLogs, 1000);
    } catch (err) {
      alert('Blad podczas ladowania podgladu pliku.');
    }
  };

  const handleDownload = async () => {
    try {
      // Pobieranie odszyfrowanego pliku jako blob i inicjowanie pobierania
      const res = await apiClient.get(`/documents/${id}/download/`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const filename = doc.file ? doc.file.split('/').pop() : 'download';
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      link.setAttribute('target', '_blank');
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      setTimeout(refreshLogs, 1000);
    } catch (err) {
      alert('Blad podczas pobierania pliku.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Czy na pewno chcesz bezpowrotnie USUNĄĆ ten dokument z systemu bezpieczeństwa? Operacja zostanie odnotowana w logach audytu.")) {
      try {
        await apiClient.delete(`/documents/${id}/`);
        alert("Dokument został pomyślnie usunięty.");
        navigate('/documents');
      } catch (err) {
        alert("Błąd: Nie udało się usunąć dokumentu.");
      }
    }
  };

  const refreshLogs = async () => {
    const role = me?.profile?.role;
    if (role === 'ADMIN' || role === 'AUDITOR') {
      try {
        const logsRes = await apiClient.get(`/audit-logs/?document=${id}`);
        setRelatedLogs(logsRes.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSimulateViolation = async (targetId) => {
    setTestResult(null);
    try {
      const res = await apiClient.get(`/documents/${targetId}/`, { skipForbiddenRedirect: true });
      setTestResult({
        success: true,
        message: `Dostęp przyznany! Plik: "${res.data.title}" jest dla Ciebie otwarty.`
      });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setTestResult({
          success: false,
          message: `Odmowa dostępu do zasobu #${targetId}. Próba naruszenia została odnotowana w rejestrze audytowym.`
        });
      } else {
        setTestResult({
          success: false,
          message: `Błąd połączenia: Kod statusu ${err.response?.status || 'nieznany'}`
        });
      }
    }
    setTimeout(refreshLogs, 500);
  };

  if (loading) return <LoadingSpinner message="Autoryzacja dostępu i deszyfrowanie metadanych..." />;

  if (error) {
    return (
      <div className="card p-4 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-center my-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="mb-3 mx-auto">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h4 className="text-white fw-bold">Odmowa Dostępu (Błąd 403)</h4>
        <p className="text-muted">{error}</p>
        <div className="mt-4">
          <Link to="/documents" className="btn btn-outline-light">Powrót do listy</Link>
        </div>
      </div>
    );
  }

  const role = me?.profile?.role;
  const isManager = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';
  const canEdit = isAdmin || (isManager && String(doc.department) === String(me?.profile?.department));
  const canDelete = isAdmin;

  const getConfidentialityBadge = (level) => {
    switch (level) {
      case 'PUBLIC': return <span className="badge-security badge-public fs-6">PUBLIC</span>;
      case 'INTERNAL': return <span className="badge-security badge-internal fs-6">INTERNAL</span>;
      case 'CONFIDENTIAL': return <span className="badge-security badge-confidential fs-6">CONFIDENTIAL</span>;
      case 'SECRET': return <span className="badge-security badge-secret fs-6">SECRET</span>;
      default: return <span className="badge-security bg-secondary">{level}</span>;
    }
  };

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

  return (
    <div className="row g-4">
      {/* Back button and main panel */}
      <div className="col-lg-8 col-md-12">
        <div className="mb-3">
          <Link to="/documents" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Powrót do Rejestru
          </Link>
        </div>

        <div className="card p-4 border border-light border-opacity-10 position-relative">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <span className="text-muted font-monospace small text-uppercase tracking-wider">Metadane Pliku #{doc.id}</span>
              <h2 className="text-white fw-bold mt-1 mb-0">{doc.title}</h2>
            </div>
            {getConfidentialityBadge(doc.confidentiality_level)}
          </div>

          <div className="mb-4">
            <h6 className="text-info font-monospace small uppercase tracking-wider fw-bold">Opis zawartości</h6>
            <p className="text-white-50 bg-black bg-opacity-20 p-3 rounded-3 border border-light border-opacity-5" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {doc.description || 'Brak opisu dla tego pliku.'}
            </p>
          </div>

          <div className="row g-3 border-top border-light border-opacity-10 pt-3">
            <div className="col-md-6 col-12">
              <span className="text-muted small d-block">Właściciel Działowy:</span>
              <strong className="text-white">{doc.department_name}</strong>
            </div>
            <div className="col-md-6 col-12">
              <span className="text-muted small d-block">Utworzony przez:</span>
              <strong className="text-white">{doc.created_by_name || 'System'}</strong>
            </div>
            <div className="col-md-6 col-12">
              <span className="text-muted small d-block">Data wprowadzenia:</span>
              <span className="text-white-50 small font-monospace">{new Date(doc.created_at).toLocaleString('pl-PL')}</span>
            </div>
            <div className="col-md-6 col-12">
              <span className="text-muted small d-block">Ostatnia modyfikacja:</span>
              <span className="text-white-50 small font-monospace">{new Date(doc.updated_at).toLocaleString('pl-PL')}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="d-flex gap-2 border-top border-light border-opacity-10 pt-4 mt-4 flex-wrap">
            {doc.file ? (
              <>
                <button onClick={handlePreview} className="btn btn-primary d-flex align-items-center gap-1 py-2 px-3 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Podgląd
                </button>
                <button onClick={handleDownload} className="btn btn-info d-flex align-items-center gap-1 py-2 px-3 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Pobierz Bezpieczny Plik
                </button>
              </>
            ) : (
              <button disabled className="btn btn-secondary d-flex align-items-center gap-1 py-2 px-3" style={{ opacity: 0.5 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="9" x2="12" y2="15"></line>
                  <line x1="12" y1="9" x2="18" y2="15"></line>
                </svg>
                Brak Załącznika
              </button>
            )}

            {canEdit && (
              <Link to={`/documents/${doc.id}/edit`} className="btn btn-outline-light d-flex align-items-center gap-1 py-2 px-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                Edycja Metadanych
              </Link>
            )}

            {canDelete && (
              <button onClick={handleDelete} className="btn btn-outline-danger d-flex align-items-center gap-1 py-2 px-3 ms-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Usuń Dokument
              </button>
            )}
          </div>
        </div>

        {/* Audit logs for this document */}
        {(role === 'ADMIN' || role === 'AUDITOR') && (
          <div className="card p-4 border border-light border-opacity-10 mt-4">
            <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3 border-bottom border-light border-opacity-10 pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Dziennik Audytu dla Dokumentu (Historia Operacji)
            </h5>

            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Operator</th>
                    <th>Żądanie</th>
                    <th>IP</th>
                    <th>Autoryzacja</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedLogs.map(log => (
                    <tr key={log.id}>
                      <td className="small font-monospace text-white-50">{new Date(log.created_at).toLocaleString('pl-PL')}</td>
                      <td className="fw-bold text-white">{log.user_name || 'System'}</td>
                      <td>
                        <span className={`badge rounded-pill ${getActionBadgeClass(log.action)}`} style={{ padding: '0.35rem 0.65rem', fontSize: '0.65rem', fontWeight: 600 }}>
                          {getActionDisplay(log.action)}
                        </span>
                      </td>
                      <td className="font-monospace text-muted small">{log.ip_address}</td>
                      <td>
                        <span className={log.success ? 'badge-status-success' : 'badge-status-danger'} style={{ fontSize: '0.65rem' }}>
                          {log.success ? '✓ ZEZWOLONO' : '🛑 ODMOWA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {relatedLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted p-4">Brak zarejestrowanych operacji dla tego dokumentu.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Allowed users panel & Security Testing Console */}
      <div className="col-lg-4 col-md-12">
        {/* Security level explanation */}
        <div className="card p-3 mb-4" style={{ border: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Dozwolona Grupa Użytkowników
          </h5>

          <div className="mb-2">
            <span className="text-muted small">Uprawnienie ogólne:</span>
            <div className="fw-bold text-white small mt-0.5">
              {doc.confidentiality_level === 'PUBLIC' && 'Dowolny zalogowany użytkownik'}
              {doc.confidentiality_level === 'INTERNAL' && `Członkowie działu: ${doc.department_name}`}
              {doc.confidentiality_level === 'CONFIDENTIAL' && `Kierownictwo i Administrator (Dział: ${doc.department_name})`}
              {doc.confidentiality_level === 'SECRET' && 'Wyłącznie Administrator oraz przypisani indywidualnie'}
            </div>
          </div>

          <div className="mt-3">
            <span className="text-muted small">Użytkownicy z dostępem indywidualnym:</span>
            <div className="d-flex flex-wrap gap-1.5 mt-1.5">
              {doc.allowed_users_list && doc.allowed_users_list.length > 0 ? (
                doc.allowed_users_list.map(username => (
                  <span key={username} className="badge bg-light bg-opacity-5 border border-light border-opacity-10 text-white px-2.5 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                    🔑 {username}
                  </span>
                ))
              ) : (
                <span className="text-muted small italic">Brak dodatkowych użytkowników.</span>
              )}
            </div>
          </div>
        </div>

        {/* Security violations simulator for live presentations! */}
        <div className="card p-3 border border-warning border-opacity-10">
          <h5 className="text-white fw-bold d-flex align-items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Konsola Testowania Zabezpieczeń
          </h5>

          <p className="text-muted small mb-3">
            Wywołaj bezpośrednie żądanie API do dokumentów o różnych identyfikatorach, aby zweryfikować czy system blokuje nieautoryzowany dostęp i zapisuje próby naruszeń:
          </p>

          <div className="d-flex flex-column gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(targetId => (
              <button
                key={targetId}
                onClick={() => handleSimulateViolation(targetId)}
                className="btn btn-sm btn-outline-light text-start d-flex align-items-center justify-content-between p-2"
                style={{ fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span>Test dostępu do Dokumentu #{targetId}</span>
                <span className="font-monospace text-primary fw-bold" style={{ fontSize: '0.75rem' }}>Wyślij GET &rarr;</span>
              </button>
            ))}
          </div>

          {testResult && (
            <div className={`p-3 rounded-3 small border ${
              testResult.success
                ? 'bg-success bg-opacity-10 border-success border-opacity-25 text-success'
                : 'bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger'
            }`} style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="fw-bold mb-1">{testResult.success ? '✓ Sukces autoryzacji' : '🛑 Naruszenie zablokowane'}</div>
              <p className="mb-0 leading-normal font-semibold" style={{ fontSize: '0.78rem' }}>{testResult.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Document Preview */}
      {showPreviewModal && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.8)' }}></div>
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={(e) => {
            if (e.target.classList.contains('modal')) setShowPreviewModal(false);
          }}>
            <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90vw' }}>
              <div className="modal-content bg-dark text-white" style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div className="modal-header border-bottom border-light border-opacity-10 bg-black bg-opacity-25">
                  <h5 className="modal-title d-flex align-items-center gap-2 fw-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Podgląd: {doc.title}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowPreviewModal(false)} aria-label="Zamknij"></button>
                </div>
                <div className="modal-body p-0 bg-black d-flex justify-content-center align-items-center" style={{ height: '75vh', overflow: 'hidden' }}>
                  {(() => {
                    if (previewHtml) {
                      return (
                        <div className="w-100 h-100 bg-white p-5 docx-preview-container" style={{ overflowY: 'auto', color: 'black' }} dangerouslySetInnerHTML={{ __html: previewHtml }}>
                        </div>
                      );
                    }

                    if (previewText) {
                      return (
                        <div className="w-100 h-100 bg-white p-4" style={{ overflowY: 'auto' }}>
                          <pre className="text-dark" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                            {previewText}
                          </pre>
                        </div>
                      );
                    }

                    const ext = doc.file ? doc.file.split('.').pop().toLowerCase() : '';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
                    const isPdf = ext === 'pdf';
                    const isMedia = ['mp4', 'webm', 'mp3', 'wav'].includes(ext);

                    if (isImage) {
                      return <img src={previewUrl} alt="Podgląd" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
                    } else if (isPdf || ['txt'].includes(ext)) {
                      return <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none', backgroundColor: 'white' }} title="Podgląd pliku" />;
                    } else if (isMedia) {
                      return <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />;
                    } else {
                      return (
                        <div className="text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-white-50">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                          <h4 className="text-white">Brak podglądu dla tego typu pliku</h4>
                          <p className="text-muted">Twoja przeglądarka nie obsługuje wyświetlania plików typu <strong>.{ext}</strong> w oknie.</p>
                          <button onClick={() => { setShowPreviewModal(false); handleDownload(); }} className="btn btn-info mt-3">
                            Pobierz plik, aby go otworzyć
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
                <div className="modal-footer border-top border-light border-opacity-10 bg-black bg-opacity-25">
                  <button type="button" className="btn btn-outline-light" onClick={() => setShowPreviewModal(false)}>Zamknij podgląd</button>
                  <button onClick={handleDownload} className="btn btn-info d-flex align-items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Pobierz plik
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .docx-preview-container table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        .docx-preview-container table, .docx-preview-container th, .docx-preview-container td {
          border: 1px solid #dee2e6;
        }
        .docx-preview-container th, .docx-preview-container td {
          padding: 0.5rem;
        }
        .docx-preview-container img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default DocumentDetailsPage;
