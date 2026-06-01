import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

const DEFAULT_NEW_USER = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'EMPLOYEE',
  department: '',
  is_active: true,
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [newUser, setNewUser] = useState(DEFAULT_NEW_USER);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreatePasswords, setShowCreatePasswords] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [updateRole, setUpdateRole] = useState('');
  const [updateDepartment, setUpdateDepartment] = useState('');
  const [updateIsActive, setUpdateIsActive] = useState(true);
  const [updatePassword, setUpdatePassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)),
    [users, selectedUserId]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [usersRes, departmentsRes, meRes] = await Promise.all([
          apiClient.get('/users/'),
          apiClient.get('/departments/'),
          apiClient.get('/me/'),
        ]);
        setUsers(usersRes.data || []);
        setDepartments(departmentsRes.data || []);
        setCurrentUserId(meRes.data?.id || null);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403) {
          setError('Odmowa dostępu (403): Brak uprawnień administratora do przeglądania bazy użytkowników.');
        } else {
          setError('Błąd pobierania bazy użytkowników.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (departments.length > 0 && !newUser.department) {
      setNewUser((prev) => ({ ...prev, department: String(departments[0].id) }));
    }
  }, [departments, newUser.department]);

  useEffect(() => {
    if (selectedUser) {
      setUpdateRole(selectedUser.profile?.role || 'EMPLOYEE');
      setUpdateDepartment(selectedUser.profile?.department || '');
      setUpdateIsActive(Boolean(selectedUser.is_active));
      setUpdatePassword('');
    }
  }, [selectedUser]);

  const refreshUsers = async () => {
    const response = await apiClient.get('/users/');
    setUsers(response.data || []);
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-admin';
      case 'MANAGER':
        return 'role-manager';
      case 'EMPLOYEE':
        return 'role-employee';
      case 'AUDITOR':
        return 'role-auditor';
      default:
        return '';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'MANAGER':
        return 'Menedżer';
      case 'EMPLOYEE':
        return 'Pracownik';
      case 'AUDITOR':
        return 'Audytor';
      default:
        return role || '';
    }
  };

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    setActionMessage('');
    setCreateLoading(true);

    try {
      if (newUser.password !== newUser.confirmPassword) {
        setActionError('Hasla nie sa zgodne.');
        return;
      }
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        department: newUser.department || null,
        is_active: newUser.is_active,
      };
      await apiClient.post('/users/', payload);
      setActionMessage('Konto uzytkownika zostalo utworzone.');
      setNewUser(DEFAULT_NEW_USER);
      await refreshUsers();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const passwordErrors = err.response?.data?.password;
      if (passwordErrors) {
        setActionError(`Blad walidacji hasla: ${passwordErrors.join(' ')}`);
      } else if (detail) {
        setActionError(detail);
      } else {
        setActionError('Nie udalo sie utworzyc konta uzytkownika.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUserId) {
      setActionError('Wybierz uzytkownika do aktualizacji.');
      return;
    }
    setActionError('');
    setActionMessage('');
    setUpdateLoading(true);

    try {
      const payload = {
        role: updateRole,
        department: updateDepartment || null,
        is_active: updateIsActive,
      };
      if (updatePassword) {
        payload.password = updatePassword;
      }
      await apiClient.patch(`/users/${selectedUserId}/`, payload);
      setActionMessage('Zaktualizowano dane uzytkownika.');
      await refreshUsers();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const passwordErrors = err.response?.data?.password;
      if (passwordErrors) {
        setActionError(`Blad walidacji hasla: ${passwordErrors.join(' ')}`);
      } else if (detail) {
        setActionError(detail);
      } else {
        setActionError('Nie udalo sie zaktualizowac uzytkownika.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    setActionError('');
    setActionMessage('');
    try {
      await apiClient.post(`/users/${userId}/activate/`);
      setActionMessage('Uzytkownik zostal aktywowany.');
      await refreshUsers();
    } catch (err) {
      console.error(err);
      setActionError('Nie udalo sie aktywowac konta.');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Czy na pewno zdezaktywowac to konto?')) {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      await apiClient.post(`/users/${userId}/deactivate/`);
      setActionMessage('Uzytkownik zostal zdezaktywowany.');
      await refreshUsers();
    } catch (err) {
      console.error(err);
      setActionError('Nie udalo sie zdezaktywowac konta.');
    }
  };

  const handleResetMfa = async (userId) => {
    if (!window.confirm('Czy zresetowac MFA uzytkownika?')) {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      await apiClient.post(`/users/${userId}/reset-mfa/`);
      setActionMessage('MFA uzytkownika zostalo zresetowane.');
    } catch (err) {
      console.error(err);
      setActionError('Nie udalo sie zresetowac MFA.');
    }
  };

  if (loading) return <LoadingSpinner message="Synchronizacja bazy tozsamosci operatorow..." />;

  return (
    <div>
      <h2 className="section-title text-white">Książka Adresowa Operatorów</h2>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <p className="text-muted small mb-4">
            Poniższy wykaz przedstawia operatorów SecureDocs wraz z rolami dostępu i statusem konta.
          </p>

          {(actionError || actionMessage) && (
            <div className={`alert ${actionError ? 'alert-danger' : 'alert-success'}`}>
              {actionError || actionMessage}
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card p-4">
                <h5 className="fw-bold text-white mb-3">Onboarding (nowe konto)</h5>
                <form onSubmit={handleCreateSubmit}>
                  <div className="mb-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">Login</label>
                    <input
                      type="text"
                      name="username"
                      value={newUser.username}
                      onChange={handleCreateChange}
                      className="form-control"
                      required
                      disabled={createLoading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">E-mail</label>
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleCreateChange}
                      className="form-control"
                      required
                      disabled={createLoading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">Haslo startowe</label>
                    <input
                      type={showCreatePasswords ? 'text' : 'password'}
                      name="password"
                      value={newUser.password}
                      onChange={handleCreateChange}
                      className="form-control"
                      required
                      disabled={createLoading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">Powtorz haslo</label>
                    <input
                      type={showCreatePasswords ? 'text' : 'password'}
                      name="confirmPassword"
                      value={newUser.confirmPassword}
                      onChange={handleCreateChange}
                      className="form-control"
                      required
                      disabled={createLoading}
                    />
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="toggleCreatePassword"
                      checked={showCreatePasswords}
                      onChange={(event) => setShowCreatePasswords(event.target.checked)}
                      disabled={createLoading}
                    />
                    <label className="form-check-label text-white-50" htmlFor="toggleCreatePassword">
                      Pokaz haslo
                    </label>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="small text-uppercase tracking-wider font-monospace text-white">Rola</label>
                      <select
                        name="role"
                        value={newUser.role}
                        onChange={handleCreateChange}
                        className="form-select"
                        disabled={createLoading}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="AUDITOR">AUDITOR</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="small text-uppercase tracking-wider font-monospace text-white">Dzial</label>
                      <select
                        name="department"
                        value={newUser.department}
                        onChange={handleCreateChange}
                        className="form-select"
                        disabled={createLoading}
                      >
                        <option value="">Brak / Globalny</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="is_active"
                      id="newUserActive"
                      checked={newUser.is_active}
                      onChange={handleCreateChange}
                      disabled={createLoading}
                    />
                    <label className="form-check-label text-white-50" htmlFor="newUserActive">
                      Konto aktywne po utworzeniu
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary mt-3"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Tworzenie...' : 'Utworz konto'}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card p-4">
                <h5 className="fw-bold text-white mb-3">Edycja konta (rola/dzial/status)</h5>
                <form onSubmit={handleUpdateSubmit}>
                  <div className="mb-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">Uzytkownik</label>
                    <select
                      value={selectedUserId}
                      onChange={(event) => setSelectedUserId(event.target.value)}
                      className="form-select"
                      disabled={updateLoading}
                    >
                      <option value="">Wybierz uzytkownika</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="small text-uppercase tracking-wider font-monospace text-white">Rola</label>
                      <select
                        value={updateRole}
                        onChange={(event) => setUpdateRole(event.target.value)}
                        className="form-select"
                        disabled={!selectedUserId || updateLoading}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="AUDITOR">AUDITOR</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="small text-uppercase tracking-wider font-monospace text-white">Dzial</label>
                      <select
                        value={updateDepartment || ''}
                        onChange={(event) => setUpdateDepartment(event.target.value)}
                        className="form-select"
                        disabled={!selectedUserId || updateLoading}
                      >
                        <option value="">Brak / Globalny</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <label className="small text-uppercase tracking-wider font-monospace text-white">Nowe haslo (opcjonalnie)</label>
                    <input
                      type="password"
                      value={updatePassword}
                      onChange={(event) => setUpdatePassword(event.target.value)}
                      className="form-control"
                      disabled={!selectedUserId || updateLoading}
                    />
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="updateUserActive"
                      checked={updateIsActive}
                      onChange={(event) => setUpdateIsActive(event.target.checked)}
                      disabled={!selectedUserId || updateLoading}
                    />
                    <label className="form-check-label text-white-50" htmlFor="updateUserActive">
                      Konto aktywne
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-info mt-3"
                    disabled={!selectedUserId || updateLoading}
                  >
                    {updateLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden border border-light border-opacity-10 shadow">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nazwa Operatora</th>
                    <th>E-mail</th>
                    <th>Rola</th>
                    <th>Dzial</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-bold text-white">
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-2 rounded-circle bg-light bg-opacity-5 text-muted small" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                            👤
                          </div>
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td className="font-monospace text-white-50">{user.email}</td>
                      <td>
                        <span className={`role-tag ${getRoleClass(user.profile?.role)}`}>
                          {getRoleDisplay(user.profile?.role)}
                        </span>
                      </td>
                      <td className="fw-medium text-info">{user.profile?.department_name || 'Brak (Nadrzędny)'}</td>
                      <td>
                        {user.is_active ? (
                          <span className="badge-status-success">AKTYWNY</span>
                        ) : (
                          <span className="badge-status-danger">NIEAKTYWNY</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {user.is_active ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-light"
                              onClick={() => handleDeactivate(user.id)}
                              disabled={String(user.id) === String(currentUserId)}
                            >
                              Dezaktywuj
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-info"
                              onClick={() => handleActivate(user.id)}
                            >
                              Aktywuj
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light"
                            onClick={() => handleResetMfa(user.id)}
                          >
                            Reset MFA
                          </button>
                        </div>
                      </td>
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
