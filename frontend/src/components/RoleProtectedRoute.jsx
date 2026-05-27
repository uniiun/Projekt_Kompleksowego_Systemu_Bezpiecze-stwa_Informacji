import { Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const RoleProtectedRoute = ({ roles = [], children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Weryfikacja uprawnień..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.profile?.role;
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
