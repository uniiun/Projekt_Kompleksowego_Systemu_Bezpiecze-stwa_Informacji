import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const AddDocumentPage = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState('INTERNAL');
  const [file, setFile] = useState(null);
  const [allowedUsers, setAllowedUsers] = useState([]); // Array of user IDs

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      // 1. Fetch profile info
      const profileRes = await apiClient.get('/me/');
      setMe(profileRes.data);
      const role = profileRes.data?.profile?.role;

      if (role !== 'ADMIN' && role !== 'MANAGER') {
        setError('Brak uprawnień do dodawania dokumentów. Dostęp zablokowany.');
        setLoading(false);
        return;
      }

      // 2. Fetch departments
      const deptsRes = await apiClient.get('/departments/');
      setDepartments(deptsRes.data);

      // Pre-set department if MANAGER
      if (role === 'MANAGER' && profileRes.data.profile.department) {
        setDepartment(profileRes.data.profile.department);
      } else if (deptsRes.data.length > 0) {
        setDepartment(deptsRes.data[0].id);
      }

      // 3. Fetch users for allowed_users multiselect
      const usersRes = await apiClient.get('/users/');
      // Filter out current user from the list to make it cleaner
      const otherUsers = usersRes.data.filter(u => u.id !== profileRes.data.id);
      setUsers(otherUsers);

    } catch (err) {
      console.error(err);
      setError('Błąd ładowania danych pomocniczych z API.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUserToggle = (userId) => {
    if (allowedUsers.includes(userId)) {
      setAllowedUsers(allowedUsers.filter(id => id !== userId));
    } else {
      setAllowedUsers([...allowedUsers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('department', department);
      formData.append('confidentiality_level', confidentialityLevel);
      
      if (file) {
        formData.append('file', file);
      }

      // Append many-to-many allowed_users
      allowedUsers.forEach(userId => {
        formData.append('allowed_users', userId);
      });

      await apiClient.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Dokument został bezpiecznie wprowadzony do bazy danych.');
      navigate('/documents');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Błąd serwera. Nie udało się zapisać dokumentu.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Weryfikacja tożsamości i inicjalizacja szyfrowanych formularzy..." />;

  // Block viewing if unauthorized
  if (error && (!me || (me.profile?.role !== 'ADMIN' && me.profile?.role !== 'MANAGER'))) {
    return (
      <div className="card p-4 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-center my-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="mb-3 mx-auto">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
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

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 col-md-10">
        <div className="mb-3">
          <Link to="/documents" className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Powrót
          </Link>
        </div>

        <div className="card p-4 border border-light border-opacity-10 position-relative">
          {/* Top visual glow border */}
          <div className="position-absolute top-0 start-0 w-100" style={{ height: '3px', background: 'linear-gradient(to right, #6366f1, #06b6d4)' }}></div>

          <div className="card-body">
            <h3 className="card-title fw-bold text-white mb-1">Bezpieczne dodawanie dokumentu</h3>
            <p className="text-muted small mb-4">Uzupełnij poniższy arkusz metadanych, aby wprowadzić zasób informacyjny.</p>

            {error && (
              <div className="alert alert-danger border border-danger border-opacity-20 bg-danger bg-opacity-10 text-danger rounded-3 small mb-4">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="small text-uppercase tracking-wider font-monospace text-white">Tytuł dokumentu</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="form-control" 
                  placeholder="np. Raport roczny IT 2026..."
                  required
                  disabled={submitting}
                />
              </div>

              <div className="mb-3">
                <label className="small text-uppercase tracking-wider font-monospace text-white">Opis / Streszczenie</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="form-control" 
                  rows="3"
                  placeholder="Krótki opis opisujący zawartość pliku..."
                  disabled={submitting}
                />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="small text-uppercase tracking-wider font-monospace text-white">Właściciel Działowy</label>
                  {isManager ? (
                    <div className="position-relative">
                      <select 
                        value={department} 
                        disabled 
                        className="form-select border-opacity-30" 
                        style={{ opacity: 0.8, cursor: 'not-allowed' }}
                      >
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                      <small className="text-info block mt-1.5" style={{ fontSize: '0.73rem' }}>
                        💡 Jako Menedżer możesz dodawać pliki wyłącznie do swojego działu.
                      </small>
                    </div>
                  ) : (
                    <select 
                      value={department} 
                      onChange={e => setDepartment(e.target.value)} 
                      className="form-select"
                      required
                      disabled={submitting}
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="small text-uppercase tracking-wider font-monospace text-white">Poziom Poufności</label>
                  <select 
                    value={confidentialityLevel} 
                    onChange={e => setConfidentialityLevel(e.target.value)} 
                    className="form-select"
                    required
                    disabled={submitting}
                  >
                    <option value="PUBLIC">PUBLIC (Dla wszystkich zalogowanych)</option>
                    <option value="INTERNAL">INTERNAL (Tylko Twój Dział)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Tylko Menedżerowie i Admini)</option>
                    <option value="SECRET">SECRET (Tylko Admin i wskazani indywidulnie)</option>
                  </select>
                </div>
              </div>

              {/* Secure File upload */}
              <div className="mb-4">
                <label className="small text-uppercase tracking-wider font-monospace text-white d-block">Bezpieczny Załącznik (Plik)</label>
                <div className="dropzone-area">
                  <input 
                    type="file" 
                    id="fileUpload" 
                    onChange={handleFileChange} 
                    className="d-none"
                    disabled={submitting}
                  />
                  <label htmlFor="fileUpload" className="mb-0 cursor-pointer d-flex flex-column align-items-center justify-content-center w-100 h-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary mb-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {file ? (
                      <span className="text-white small fw-bold">✓ Wybrany plik: {file.name}</span>
                    ) : (
                      <>
                        <span className="text-white small">Kliknij, aby wybrać dokument z dysku</span>
                        <span className="text-muted small mt-1">Obsługiwane dowolne rozszerzenia bezpieczne</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Individual permitted users (Rule 6) */}
              <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <label className="small text-uppercase tracking-wider font-monospace text-white d-block mb-1">
                  Dodatkowy dostęp indywidualny (allowed_users)
                </label>
                <p className="text-muted small mb-3">
                  Wskaż użytkowników, którzy mają otrzymać indywidualny klucz dostępu (przydatne zwłaszcza przy poziomach <strong>CONFIDENTIAL</strong> i <strong>SECRET</strong>):
                </p>

                <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                  {users.map(u => {
                    const isSelected = allowedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleUserToggle(u.id)}
                        disabled={submitting}
                        className={`btn btn-sm d-flex align-items-center gap-1.5 py-1.5 px-3 border ${
                          isSelected 
                            ? 'bg-primary border-primary text-white shadow-sm' 
                            : 'bg-light bg-opacity-5 border-light border-opacity-10 text-muted'
                        }`}
                        style={{ borderRadius: '8px !important' }}
                      >
                        <span className="small">{isSelected ? '✓' : '+'}</span>
                        <span className="small">{u.username}</span>
                        <span className="badge" style={{ 
                          fontSize: '0.62rem', 
                          background: 'rgba(255,255,255,0.1)', 
                          color: isSelected ? '#ffffff' : '#94a3b8' 
                        }}>
                          {u.profile?.role}
                        </span>
                      </button>
                    );
                  })}
                  {users.length === 0 && <span className="text-muted small italic">Brak innych użytkowników w systemie do przypisania.</span>}
                </div>
              </div>

              <div className="d-flex gap-3 mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary px-4 py-2.5 d-flex align-items-center gap-2 shadow"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Szyfrowanie i Zapis...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Bezpieczny Zapis Dokumentu
                    </>
                  )}
                </button>
                <Link to="/documents" className="btn btn-outline-light px-4 py-2.5" disabled={submitting}>
                  Anuluj
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentPage;
