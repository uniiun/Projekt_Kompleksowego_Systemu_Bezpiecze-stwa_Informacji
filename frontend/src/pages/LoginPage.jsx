import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login/', {
        username: email,
        password: password
      });
      localStorage.setItem('access_token', response.data.access);
      navigate('/');
    } catch (err) {
      setError('Niepoprawne dane logowania');
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-center mb-4">Logowanie</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label>Email (Username)</label>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="form-control" required />
              </div>
              <div className="mb-3">
                <label>Hasło</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Zaloguj</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
