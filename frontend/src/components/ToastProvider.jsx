import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container position-fixed bottom-0 end-0 p-4" style={{ zIndex: 9999 }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast show align-items-center text-white bg-${toast.type === 'error' ? 'danger' : toast.type === 'success' ? 'success' : toast.type === 'warning' ? 'warning text-dark' : 'primary'} border-0 mb-3 shadow-lg`} role="alert" aria-live="assertive" aria-atomic="true" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div className="d-flex">
              <div className="toast-body fw-medium" style={{ fontSize: '0.95rem' }}>
                {toast.message}
              </div>
              <button type="button" className={`btn-close ${toast.type === 'warning' ? '' : 'btn-close-white'} me-3 m-auto`} onClick={() => removeToast(toast.id)} aria-label="Close"></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
