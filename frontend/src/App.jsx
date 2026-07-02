import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import AddDocumentPage from './pages/AddDocumentPage';
import EditDocumentPage from './pages/EditDocumentPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import InactivityTimeout from './components/InactivityTimeout';
import { ToastProvider } from './components/ToastProvider';

function AppContent() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
  const { token } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="d-flex w-100 min-vh-100 bg-app-base">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <InactivityTimeout />
      
      {/* Main Content wrapper with dynamic margin if sidebar is present */}
      <div className="main-content flex-grow-1" style={{ marginLeft: token ? '280px' : '0', transition: 'margin 0.3s ease' }}>
        <div className="container-fluid py-4 px-4 px-md-5 pb-5">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/documents/new" element={
              <RoleProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <AddDocumentPage />
              </RoleProtectedRoute>
            } />
            <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailsPage /></ProtectedRoute>} />
            <Route path="/documents/:id/edit" element={
              <RoleProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <EditDocumentPage />
              </RoleProtectedRoute>
            } />
            <Route path="/users" element={
              <RoleProtectedRoute roles={["ADMIN"]}>
                <UsersPage />
              </RoleProtectedRoute>
            } />
            <Route path="/audit" element={
              <RoleProtectedRoute roles={["ADMIN", "AUDITOR"]}>
                <AuditLogsPage />
              </RoleProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
