import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/users/')
      .then(res => {
        setUsers(res.data);
      })
      .catch(err => {
        console.error(err);
        if (err.response && err.response.status === 403) {
            setError('Odmowa dostępu (403): Brak uprawnień administratora do przeglądania bazy użytkowników.');
        } else {
            setError('Błąd pobierania bazy użytkowników.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

  if (loading) return <LoadingSpinner message="Synchronizacja bazy tożsamości operatorów..." />;

  return (
    <div>
      <h2 className="section-title text-white">Książka Adresowa Operatorów</h2>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <p className="text-muted small mb-4">
            Poniższy wykaz przedstawia wszystkich zarejestrowanych operatorów systemu SecureDocs wraz z przypisanymi rolami dostępu (RBAC) oraz działami organizacyjnymi:
          </p>

          <div className="card overflow-hidden border border-light border-opacity-10 shadow">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nazwa Operatora</th>
                    <th>E-mail</th>
                    <th>Poziom Uprawnień (Rola)</th>
                    <th>Przypisany Dział</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-bold text-white">
                        <div className="d-flex align-items-center gap-2">
                          {/* Mini avatar icon */}
                          <div className="p-2 rounded-circle bg-light bg-opacity-5 text-muted small" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                            👤
                          </div>
                          <span>{u.username}</span>
                        </div>
                      </td>
                      <td className="font-monospace text-white-50">{u.email}</td>
                      <td>
                        <span className={`role-tag ${getRoleClass(u.profile?.role)}`}>
                          {getRoleDisplay(u.profile?.role)}
                        </span>
                      </td>
                      <td className="fw-medium text-info">{u.profile?.department_name || 'Brak (Nadrzędny)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
