import React, { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "./api";

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export default function AdminSystem() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/audit-logs?limit=50");
      setAuditLogs(data.auditLogs);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return <section className="admin-dashboard">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Manajemen sistem</span><h1>Aktivitas admin</h1>
        <p>Audit log mencatat keputusan verifikasi dan tindakan admin lainnya.</p></div>
      <button type="button" className="button button-ghost" onClick={loadAuditLogs} disabled={loading}>
        {loading ? "Memuat…" : "Muat ulang"}
      </button>
    </header>
    {error && <div className="admin-error" role="alert">
      <span>{error}</span><button type="button" className="button button-small button-ghost" onClick={loadAuditLogs}>Coba lagi</button>
    </div>}
    <section className="admin-panel">
      <div className="admin-panel-heading"><div><span className="eyebrow">Log audit</span><h2>Riwayat aktivitas sistem</h2></div>
        <span className="admin-count">{loading ? "—" : auditLogs.length}</span></div>
      {loading
        ? <div className="admin-table-state" role="status">Memuat audit log…</div>
        : auditLogs.length
          ? <div className="admin-audit-list">{auditLogs.map((log) => <article className="admin-audit-row" key={log._id}>
            <span className={`admin-audit-icon${log.action === "organization.verified" ? " is-success" : ""}`} aria-hidden="true">
              {log.action === "organization.verified" ? "✓" : "!"}
            </span>
            <div><strong>{log.action === "organization.verified" ? "Organisasi diverifikasi" : log.action === "organization.rejected" ? "Verifikasi organisasi ditolak" : log.action}</strong>
              <span>{log.details?.organizationName || log.targetId} · {log.actorId?.name || "Admin tidak tersedia"}</span></div>
            <time dateTime={new Date(log.timestamp).toISOString()}>{formatTimestamp(log.timestamp)}</time>
          </article>)}</div>
          : !error && <div className="admin-table-state">Belum ada aktivitas admin yang tercatat.</div>}
    </section>
  </section>;
}
