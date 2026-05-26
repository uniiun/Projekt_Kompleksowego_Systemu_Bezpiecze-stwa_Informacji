import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/audit-logs/')
      .then(res => setLogs(res.data))
      .catch(err => {
        if (err.response && err.response.status === 403) {
          setError('Brak uprawnień do przeglądania logów audytu.');
        }
      });
  }, []);

  return (
    <div>
      <h2>Logi Audytu</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {!error && (
        <table className="table table-striped mt-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Użytkownik</th>
              <th>Akcja</th>
              <th>Dokument</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.user_name || 'Brak'}</td>
                <td>{log.action}</td>
                <td>{log.document_title || '-'}</td>
                <td>
                  <span className={`badge ${log.success ? 'bg-success' : 'bg-danger'}`}>
                    {log.success ? 'SUKCES' : 'ODMOWA'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default AuditLogsPage;
