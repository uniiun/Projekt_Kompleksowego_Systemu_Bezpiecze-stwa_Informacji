import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentCard from '../components/DocumentCard';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedConf, setSelectedConf] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch current user
      const userRes = await apiClient.get('/me/');
      setMe(userRes.data);

      // 2. Fetch documents
      const docsRes = await apiClient.get('/documents/');
      setDocuments(docsRes.data);

      // 3. Fetch departments
      const deptsRes = await apiClient.get('/departments/');
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setError('Brak uprawnień do przeglądania dokumentów.');
      } else {
        setError('Błąd pobierania danych.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtration logic
  const filteredDocs = documents.filter(doc => {
    const matchesText =
      doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchText.toLowerCase());

    const matchesDept = selectedDept === '' || String(doc.department) === String(selectedDept);
    const matchesConf = selectedConf === '' || doc.confidentiality_level === selectedConf;

    return matchesText && matchesDept && matchesConf;
  });

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedDept('');
    setSelectedConf('');
  };

  if (loading) return <LoadingSpinner message="Autoryzacja i deszyfrowanie listy zasobów..." />;

  const isAuthorizedToCreate = me?.profile?.role === 'ADMIN' || me?.profile?.role === 'MANAGER';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="section-title text-white mb-0">Rejestr Dokumentów</h2>
        </div>
        {isAuthorizedToCreate && (
          <Link to="/documents/new" className="btn btn-primary d-flex align-items-center gap-1 shadow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Dodaj Dokument
          </Link>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-3 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-danger p-4 rounded-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <h5 className="fw-bold mb-1">Blokada Bezpieczeństwa</h5>
            <p className="mb-0 small">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filters panel */}
          <div className="card p-3 mb-4 border border-light border-opacity-10">
            <div className="row g-3 align-items-end">
              <div className="col-md-4 col-sm-12">
                <label className="small text-uppercase tracking-wider font-monospace">Szukaj w bazie</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="form-control"
                  placeholder="Filtruj po tytule lub opisie..."
                />
              </div>

              <div className="col-md-3 col-sm-6">
                <label className="small text-uppercase tracking-wider font-monospace">Dział Organizacyjny</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="form-select"
                >
                  <option value="">Wszystkie działy</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 col-sm-6">
                <label className="small text-uppercase tracking-wider font-monospace">Poziom Poufności</label>
                <select
                  value={selectedConf}
                  onChange={e => setSelectedConf(e.target.value)}
                  className="form-select"
                >
                  <option value="">Wszystkie poziomy</option>
                  <option value="PUBLIC">PUBLIC (Publiczny)</option>
                  <option value="INTERNAL">INTERNAL (Wewnętrzny)</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL (Poufny)</option>
                  <option value="SECRET">SECRET (Tajny)</option>
                </select>
              </div>

              <div className="col-md-2 col-sm-12">
                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline-light w-100 py-2 d-flex align-items-center justify-content-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Resetuj
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout of Cards */}
          <div className="documents-grid mt-4">
            {filteredDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} me={me} />
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="card p-5 text-center border border-light border-opacity-10 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-muted opacity-50">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <h5 className="text-white fw-bold">Brak dokumentów</h5>
              <p className="text-muted small">Nie znaleziono żadnych plików pasujących do podanych filtrów lub nie posiadasz uprawnień do ich odczytu.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentsPage;
