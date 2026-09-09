import React from 'react';

export function LoadingState({ message='Loading...' }: { message?: string }) {
  return <div className="state-container"><div className="spinner"/><div className="state-desc">{message}</div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-container">
      <div className="state-icon">⚠</div>
      <div className="state-title">Error</div>
      <div className="state-desc">{message}</div>
      {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function UnavailableState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-container">
      <div className="state-icon">—</div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{message}</div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-container">
      <div className="state-icon">◦</div>
      <div className="state-title">{title}</div>
      <div className="state-desc">{message}</div>
    </div>
  );
}
