import React, { useEffect } from "react";

export default function AdminToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timeout);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return <div className={`admin-toast admin-toast-${toast.type}`}
    role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"}>
    <span className="admin-toast-icon" aria-hidden="true">{toast.type === "error" ? "!" : "✓"}</span>
    <span>{toast.message}</span>
    <button type="button" aria-label="Tutup notifikasi" onClick={onDismiss}>×</button>
  </div>;
}
