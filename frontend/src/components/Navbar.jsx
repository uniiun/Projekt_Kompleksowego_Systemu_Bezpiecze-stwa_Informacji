import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">SecureDocs</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-toggle="target">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/documents">Dokumenty</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/audit">Audyt</Link>
            </li>
          </ul>
          <button className="btn btn-outline-light" onClick={handleLogout}>Wyloguj</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
