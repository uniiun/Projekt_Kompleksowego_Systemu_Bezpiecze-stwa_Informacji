import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const DashboardPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    apiClient.get('/me/').then(res => {
      setUser(res.data);
    }).catch(err => console.error(err));
  }, []);

  if (!user) return <div>Ładowanie...</div>;

  return (
    <div>
      <h2>Witaj, {user.first_name || user.username}</h2>
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Twoje dane:</h5>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Rola:</strong> {user.profile?.role}</p>
          <p><strong>Dział:</strong> {user.profile?.department_name || 'Brak'}</p>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
