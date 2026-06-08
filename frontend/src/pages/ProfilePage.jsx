import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { QRCodeSVG } from 'qrcode.react';
import { mapRegistrationOptions, serializeRegistrationCredential } from '../utils/webauthn';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [mfaData, setMfaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [webauthnLoading, setWebauthnLoading] = useState(false);

  // Stan formularza zmiany hasla
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdOld, setPwdOld] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Automatyczne otwarcie formularza zmiany hasla gdy haslo jest przeterminowane
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setShowPasswordForm(true);
      setError('Twoje hasło wygasło. Ustaw nowe hasło, aby kontynuować korzystanie z systemu.');
    }
  }, [location.search]);

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

  // Ostrzezenie przed zamknieciem panelu MFA gdy kody nie zostaly zapisane
  const handleDisableMFA = async () => {
    if (mfaData) {
      const confirmed = window.confirm(
        'Masz niezapisane dane konfiguracji MFA. Czy na pewno chcesz wyjść bez zapisania kodów zapasowych?'
      );
      if (!confirmed) return;
    }
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

  // Zamkniecie sekcji MFA z potwierdzeniem jezeli dane nie zostaly zapisane
  const handleCloseMfaPanel = () => {
    if (mfaData) {
      const confirmed = window.confirm(
        'Czy na pewno chcesz zamknąć konfigurację MFA? Upewnij się, że zapisałeś kody zapasowe i zeskanowałeś kod QR.'
      );
      if (!confirmed) return;
    }
    setMfaData(null);
    setSuccess('');
  };

  const handleEnableWebAuthn = async () => {
    if (!window.PublicKeyCredential) {
      setError('Ta przeglądarka nie obsługuje WebAuthn.');
      return;
    }
    setWebauthnLoading(true);
    setError('');
    setSuccess('');
    try {
      const optionsResponse = await apiClient.post('auth/webauthn/register/options/');
      const publicKey = mapRegistrationOptions(optionsResponse.data.options);
      const credential = await navigator.credentials.create({ publicKey });
      const payload = serializeRegistrationCredential(credential);
      await apiClient.post('auth/webauthn/register/verify/', { credential: payload });
      setSuccess('Biometria została aktywowana.');
      await refreshUser();
    } catch (err) {
      setError('Błąd podczas aktywacji biometrii.');
    } finally {
      setWebauthnLoading(false);
    }
  };

  const handleDisableWebAuthn = async () => {
    if (!window.confirm('Czy na pewno chcesz wyłączyć biometrię?')) return;
    setWebauthnLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('auth/webauthn/disable/');
      setSuccess('Biometria została wyłączona.');
      await refreshUser();
    } catch (err) {
      setError('Błąd podczas wyłączania biometrii.');
    } finally {
      setWebauthnLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdNew !== pwdConfirm) {
      setError('Nowe hasła nie są zgodne.');
      return;
    }
    if (pwdNew.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.');
      return;
    }
    setPwdLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('auth/change-password/', {
        old_password: pwdOld,
        new_password: pwdNew,
      });
      setSuccess('Hasło zostało zmienione pomyślnie.');
      setShowPasswordForm(false);
      setPwdOld('');
      setPwdNew('');
      setPwdConfirm('');
      await refreshUser();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Błąd podczas zmiany hasła.';
      setError(detail);
    } finally {
      setPwdLoading(false);
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

            {/* Sekcja zmiany hasla */}
            <div className="mt-4">
              <button
                className="btn btn-outline-warning btn-sm px-3"
                id="btn-toggle-password-form"
                onClick={() => { setShowPasswordForm(v => !v); setError(''); setSuccess(''); }}
              >
                {showPasswordForm ? 'Anuluj zmianę hasła' : 'Zmień hasło'}
              </button>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="mt-3 p-3 border border-warning border-opacity-30 rounded bg-black bg-opacity-20" id="form-change-password">
                  <h6 className="text-warning mb-3">Zmiana hasła</h6>
                  <div className="mb-2">
                    <label className="form-label small text-white-50">Aktualne hasło</label>
                    <input
                      type="password"
                      id="input-old-password"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={pwdOld}
                      onChange={e => setPwdOld(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small text-white-50">Nowe hasło (min. 8 znaków)</label>
                    <input
                      type="password"
                      id="input-new-password"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={pwdNew}
                      onChange={e => setPwdNew(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-white-50">Powtórz nowe hasło</label>
                    <input
                      type="password"
                      id="input-confirm-password"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={pwdConfirm}
                      onChange={e => setPwdConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    id="btn-submit-password"
                    className="btn btn-warning btn-sm px-4"
                    disabled={pwdLoading}
                  >
                    {pwdLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Zapisywanie...
                      </>
                    ) : 'Zmień hasło'}
                  </button>
                </form>
              )}
            </div>
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
                    id="btn-enable-mfa"
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
                    id="btn-disable-mfa"
                    onClick={handleDisableMFA}
                    disabled={loading}
                  >
                    {loading ? 'Przetwarzanie...' : 'Dezaktywuj MFA'}
                  </button>
                )}
             </div>

              <div className="p-4 border border-light border-opacity-10 rounded bg-black bg-opacity-20 mt-3">
                 <h5 className="mb-3 text-start text-md-end">Windows Hello (odcisk palca)</h5>
                <p className="mb-4 text-start text-md-end">Status:
                  <span className={`ms-2 badge ${user?.profile?.webauthn_enabled ? 'bg-success' : 'bg-secondary'}`}>
                    {user?.profile?.webauthn_enabled ? 'Aktywne' : 'Nieaktywne'}
                  </span>
                </p>
                {!user?.profile?.webauthn_enabled ? (
                  <button
                    className="btn btn-primary px-4"
                    id="btn-enable-webauthn"
                    onClick={handleEnableWebAuthn}
                    disabled={webauthnLoading}
                  >
                    {webauthnLoading ? 'Rejestrowanie...' : 'Dodaj odcisk palca'}
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-danger px-4"
                    id="btn-disable-webauthn"
                    onClick={handleDisableWebAuthn}
                    disabled={webauthnLoading}
                  >
                    {webauthnLoading ? 'Przetwarzanie...' : 'Wyłącz biometrię'}
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-primary mb-0">Konfiguracja MFA</h4>
              <button
                className="btn btn-sm btn-outline-secondary"
                id="btn-close-mfa-panel"
                onClick={handleCloseMfaPanel}
                title="Zamknij konfigurację MFA"
              >
                Zamknij
              </button>
            </div>
            <div className="alert alert-warning py-2 small mb-3">
              <strong>Ważne:</strong> Zapisz kody zapasowe i zeskanuj kod QR zanim zamkniesz ten panel. Kody nie będą dostępne ponownie.
            </div>
            <div className="row g-4 mt-1">
              <div className="col-md-4 text-center">
                <div className="p-3 bg-white d-inline-block rounded shadow">
                  <QRCodeSVG value={otpAuthUrl} size={180} />
                </div>
                <p className="mt-3 small text-white-50">Zeskanuj w Google Authenticator lub Authy</p>
              </div>
              <div className="col-md-8">
                <h5 className="mb-3">Kody zapasowe</h5>
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
