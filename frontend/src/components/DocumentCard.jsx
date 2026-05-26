import React from 'react';
import { Link } from 'react-router-dom';

const DocumentCard = ({ doc, me }) => {
  // Determine role permissions for editing
  const isManager = me?.profile?.role === 'MANAGER';
  const isAdmin = me?.profile?.role === 'ADMIN';

  // A manager can edit documents belonging to their own department
  const canEdit = isAdmin || (isManager && String(doc.department) === String(me?.profile?.department));

  const getConfidentialityBadge = (level) => {
    switch (level) {
      case 'PUBLIC':
        return <span className="badge-security badge-public">PUBLIC</span>;
      case 'INTERNAL':
        return <span className="badge-security badge-internal">INTERNAL</span>;
      case 'CONFIDENTIAL':
        return <span className="badge-security badge-confidential">CONFIDENTIAL</span>;
      case 'SECRET':
        return <span className="badge-security badge-secret">SECRET</span>;
      default:
        return <span className="badge-security bg-secondary">{level}</span>;
    }
  };

  return (
    <div className="card h-100 glass-panel-hover">
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex align-items-start justify-content-between mb-3">
          {/* Cyber Document Icon */}
          <div className="p-3 rounded-3 bg-opacity-10 bg-light border border-light border-opacity-10" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <circle cx="10" cy="13" r="2"></circle>
              <path d="m16 17-4.5-4.5"></path>
            </svg>
          </div>
          {getConfidentialityBadge(doc.confidentiality_level)}
        </div>

        <h5 className="card-title text-white fw-bold mb-2 text-truncate" title={doc.title}>
          {doc.title}
        </h5>

        <p className="card-text text-muted small flex-grow-1 mb-4" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {doc.description || 'Brak opisu dokumentu.'}
        </p>

        <div className="border-top border-light border-opacity-10 pt-3 mt-auto">
          <div className="d-flex align-items-center justify-content-between mb-3 text-muted small">
            <span className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1 text-info">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              {doc.department_name}
            </span>
            <span>
              {doc.created_by_name || 'System'}
            </span>
          </div>

          <div className="d-flex gap-2">
            <Link to={`/documents/${doc.id}`} className="btn btn-sm btn-info flex-grow-1 d-flex align-items-center justify-content-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="me-1">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Szczegóły
            </Link>
            {canEdit && (
              <Link to={`/documents/${doc.id}/edit`} className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
