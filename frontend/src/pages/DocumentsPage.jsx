import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await apiClient.get('/me/');
      setMe(userRes.data);
      const docsRes = await apiClient.get('/documents/');
      setDocuments(docsRes.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('Brak uprawnień do przeglądania dokumentów.');
      }
    }
  };

  const handleTestForbidden = async (id) => {
    try {
      await apiClient.get(`/documents/${id}/`);
      alert("Dostęp przyznany!");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert("Błąd 403: Odmowa dostępu (zapisano w logach).");
      }
    }
  };

  return (
    <div>
      <h2>Dokumenty</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="list-group mt-4">
        {documents.map(doc => (
          <div key={doc.id} className="list-group-item">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">{doc.title}</h5>
              <small>Poufność: <span className="badge bg-secondary">{doc.confidentiality_level}</span></small>
            </div>
            <p className="mb-1">{doc.description}</p>
            <small>Dział: {doc.department_name}</small>
            <div className="mt-2">
              <button className="btn btn-sm btn-info me-2" onClick={() => handleTestForbidden(doc.id)}>
                Test dostępu (zobacz szczegóły)
              </button>
            </div>
          </div>
        ))}
        {documents.length === 0 && <p>Brak dostępnych dokumentów.</p>}
      </div>
    </div>
  );
};
export default DocumentsPage;
