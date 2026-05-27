import { Link } from 'react-router-dom';

const ForbiddenPage = () => (
  <div className="card p-4 border border-danger border-opacity-20 bg-danger bg-opacity-10 text-center my-5">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="mb-3 mx-auto">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
    <h4 className="text-white fw-bold">Odmowa Dostępu (403)</h4>
    <p className="text-muted">Nie masz uprawnień do tego zasobu. Skontaktuj się z administratorem.</p>
    <div className="mt-4">
      <Link to="/" className="btn btn-outline-light">Powrót do kokpitu</Link>
    </div>
  </div>
);

export default ForbiddenPage;
