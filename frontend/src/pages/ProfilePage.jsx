import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { QRCodeSVG } from 'qrcode.react';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [mfaData, setMfaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEnableMFA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.post('auth/mfa/enable/');
      setMfaData(response.data);
      setSuccess('MFA zostało wygenerowane. Zeskanuj kod QR i zapisz kody zapasowe.');
      await refreshUser();
    } catch (err) {
      setError('Błąd podczas włączania MFA.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('Czy na pewno chcesz wyłączyć MFA?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('auth/mfa/disable/');
      setMfaData(null);
      setSuccess('MFA zostało wyłączone.');
      await refreshUser();
    } catch (err) {
      setError('Błąd podczas wyłączania MFA.');
    } finally {
      setLoading(false);
    }
  };

  const otpAuthUrl = mfaData ? `otpauth://totp/SecureDocs:${user.email}?secret=${mfaData.totp_secret}&issuer=SecureDocs` : '';

  return (
    <div className="card shadow-sm border-0 bg-dark text-light">
      <div className="card-body p-4">
        <h2 className="mb-4 d-flex align-items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Twój Profil
        </h2>

        <div className="row mb-4">
          <div className="col-md-6">
            <h5 className="text-primary mb-3">Informacje podstawowe</h5>
            <div className="mb-2"><strong>Email:</strong> <span className="ms-2 text-white-50">{user?.email}</span></div>
            <div className="mb-2"><strong>Nazwa użytkownika:</strong> <span className="ms-2 text-white-50">{user?.username}</span></div>
            <div className="mb-2"><strong>Rola:</strong> <span className="ms-2 text-white-50">{user?.profile?.role}</span></div>
            <div className="mb-2"><strong>Dział:</strong> <span className="ms-2 text-white-50">{user?.profile?.department_name || 'Globalny'}</span></div>
          </div>

          <div className="col-md-6 text-md-end mt-4 mt-md-0">
             <div className="p-4 border border-light border-opacity-10 rounded bg-black bg-opacity-20">
                <h5 className="mb-3 text-start text-md-end">Dwuetapowa weryfikacja (MFA)</h5>
                <p className="mb-4 text-start text-md-end">Status:
                  <span className={`ms-2 badge ${user?.profile?.mfa_enabled ? 'bg-success' : 'bg-secondary'}`}>
                    {user?.profile?.mfa_enabled ? 'Aktywne' : 'Nieaktywne'}
                  </span>
                </p>
                {!user?.profile?.mfa_enabled ? (
                  <button
                    className="btn btn-primary px-4"
                    onClick={handleEnableMFA}
                    disabled={loading}
                  >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Generowanie...
                        </>
                    ) : 'Aktywuj MFA'}
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-danger px-4"
                    onClick={handleDisableMFA}
                    disabled={loading}
                  >
                    {loading ? 'Przetwarzanie...' : 'Dezaktywuj MFA'}
                  </button>
                )}
             </div>
          </div>
        </div>

        {error && <div className="alert alert-danger d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
        </div>}
        {success && <div className="alert alert-success d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            {success}
        </div>}

        {mfaData && (
          <div className="mt-4 p-4 border border-primary rounded bg-primary bg-opacity-10 animate-fade-in">
            <h4 className="text-primary mb-4">Konfiguracja MFA</h4>
            <div className="row g-4 mt-1">
              <div className="col-md-4 text-center">
                <div className="p-3 bg-white d-inline-block rounded shadow">
                  <QRCodeSVG value={otpAuthUrl} size={180} />
                </div>
                <p className="mt-3 small text-white-50">Zeskanuj w Google Authenticator lub Authy</p>
              </div>
              <div className="col-md-8">
                <h5 className="mb-3">Kody zapasowe</h5>
                <div className="alert alert-warning py-2 small mb-3">
                  <strong>Ważne:</strong> Zapisz te kody! Każdy z nich pozwoli Ci się zalogować jednorazowo w przypadku utraty telefonu.
                </div>
                <div className="row g-2 mb-4">
                  {mfaData.backup_codes.map((code, index) => (
                    <div key={index} className="col-6 col-sm-4">
                      <div className="p-2 bg-dark border border-light border-opacity-20 text-center font-monospace rounded text-info fw-bold">
                        {code}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                    <p className="mb-1 small text-white-50">Klucz konfiguracji ręcznej:</p>
                    <code className="text-info fs-5">{mfaData.totp_secret}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
