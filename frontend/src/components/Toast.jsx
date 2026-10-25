import { useEffect } from 'react';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };
const DURATION_MS = 5000;

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`toast toast--${toast.kind}`} role="status">
      <span className="toast__icon" aria-hidden>{ICONS[toast.kind]}</span>
      <span>{toast.message}</span>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Fechar">×</button>
    </div>
  );
}
