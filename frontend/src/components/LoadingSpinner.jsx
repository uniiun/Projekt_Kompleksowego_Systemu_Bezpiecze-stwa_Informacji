import React from 'react';

const LoadingSpinner = ({ message = 'Inicjalizacja bezpiecznego połączenia...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center my-5 p-5">
      <div className="position-relative" style={{ width: '80px', height: '80px' }}>
        {/* Outer glowing pulsing circle */}
        <div
          className="position-absolute border border-primary rounded-circle w-100 h-100"
          style={{
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            opacity: 0.35,
            borderWidth: '2px !important'
          }}
        />
        {/* Inner spinning border */}
        <div
          className="spinner-border text-primary position-absolute"
          style={{
            width: '80px',
            height: '80px',
            borderWidth: '4px',
            filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))'
          }}
          role="status"
        >
          <span className="visually-hidden">Ładowanie...</span>
        </div>
      </div>
      <p className="mt-4 text-muted font-monospace small tracking-wider uppercase" style={{ letterSpacing: '2px' }}>
        {message}
      </p>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
