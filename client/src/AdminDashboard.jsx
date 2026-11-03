import React, { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "./api";
import { useAuth } from "./AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/");
  }

  return <div className="admin-portal">
    <aside className="admin-sidebar">
      <Link className="brand" to="/admin/dashboard"><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <span className="admin-sidebar-label">PORTAL ADMIN</span>
      <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
        <NavLink to="/admin/dashboard"><span aria-hidden="true">▦</span> Ringkasan</NavLink>
        <NavLink to="/admin/organizations/pending"><span aria-hidden="true">✓</span> Verifikasi organisasi</NavLink>
        <NavLink to="/admin/system"><span aria-hidden="true">⚙</span> Manajemen sistem</NavLink>
      </nav>
      <div className="admin-sidebar-account">
        <span>{user.name}</span>
        <button type="button" className="button button-small button-ghost" onClick={signOut}>Keluar</button>
      </div>
    </aside>
    <main className="admin-main"><SessionRecoveryNotice /><Outlet /></main>
  </div>;
}

function SessionRecoveryNotice() {
  const { sessionError, refreshSession } = useAuth();
  if (!sessionError) return null;
  return <div className="session-recovery" role="status">
    <span>{sessionError}</span>
    <button className="button button-small button-ghost" onClick={refreshSession}>Coba lagi</button>
  </div>;
}

const statDefinitions = [
  { key: "users", label: "Total pengguna", detail: "Seluruh akun platform", icon: "◉" },
  { key: "verifiedOrganizations", label: "Organisasi terverifikasi", detail: "Siap berkolaborasi", icon: "✓" },
  { key: "unverifiedOrganizations", label: "Belum terverifikasi", detail: "Menunggu atau ditolak", icon: "…" },
  { key: "activeActivities", label: "Kegiatan aktif", detail: "Berstatus dipublikasikan", icon: "✳" },
  { key: "registrations", label: "Total pendaftaran", detail: "Partisipasi tercatat", icon: "▤" }
];

function auditMessage(log) {
  if (log.action === "organization.verified") return "Organisasi diverifikasi";
  if (log.action === "organization.rejected") return "Verifikasi organisasi ditolak";
  return log.action;
}

function formatAuditDate(timestamp) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/organizations/pending"),
        api.get("/admin/audit-logs?limit=8")
      ]);
      const failures = [];
      if (results[0].status === "fulfilled") setStats(results[0].value.data);
      else failures.push(`Statistik: ${getErrorMessage(results[0].reason)}`);
      if (results[1].status === "fulfilled") setOrganizations(results[1].value.data.organizations);
      else failures.push(`Antrean verifikasi: ${getErrorMessage(results[1].reason)}`);
      if (results[2].status === "fulfilled") setAuditLogs(results[2].value.data.auditLogs);
      else failures.push(`Aktivitas admin: ${getErrorMessage(results[2].reason)}`);
      setError(failures.join(" "));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return <section className="admin-dashboard">
    <header className="admin-page-heading">
      <div><span className="eyebrow">KoordinAksi · Admin</span><h1>Ringkasan platform</h1>
        <p>Pantau pertumbuhan dan kelola aktivitas platform.</p></div>
      <Link className="button button-ghost" to="/">Lihat situs</Link>
    </header>
    {error && <div className="admin-error" role="alert">
      <span>{error}</span><button type="button" className="button button-small button-ghost" onClick={loadDashboard}>Coba lagi</button>
    </div>}
    <div className="admin-stat-grid admin-stat-grid-five" aria-live="polite">
      {statDefinitions.map(({ key, label, detail, icon }) => <article className="admin-stat-card" key={key}>
        <div className="admin-stat-card-top"><span className="admin-stat-icon" aria-hidden="true">{icon}</span>
          <span>{detail}</span></div>
        <strong>{loading || !stats ? "—" : Number(stats[key]).toLocaleString("id-ID")}</strong>
        <span className="admin-stat-label">{label}</span>
      </article>)}
    </div>
    <section className="admin-panel admin-overview-panel">
      <div className="admin-panel-heading">
        <div><span className="eyebrow">Tinjauan admin</span><h2>Organisasi menunggu verifikasi</h2></div>
        <span className="admin-count">{loading ? "—" : organizations.length}</span>
      </div>
      {loading && !organizations.length
        ? <p className="admin-empty">Memuat antrean organisasi…</p>
        : organizations.length
          ? <>
            <p className="admin-overview-description">Tinjau profil organisasi sebelum mereka menerbitkan kegiatan.</p>
            <Link className="button button-small" to="/admin/organizations/pending">Buka antrean verifikasi <span>→</span></Link>
          </>
          : !error && <p className="admin-empty">Tidak ada organisasi yang menunggu verifikasi.</p>}
    </section>
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><span className="eyebrow">Jejak aktivitas</span><h2>Aktivitas admin terbaru</h2></div>
        <Link className="text-link" to="/admin/system">Lihat semua →</Link>
      </div>
      {loading && !auditLogs.length
        ? <p className="admin-empty">Memuat aktivitas admin…</p>
        : auditLogs.length
          ? <div className="admin-audit-list">{auditLogs.map((log) => <article className="admin-audit-row" key={log._id}>
            <span className={`admin-audit-icon${log.action === "organization.verified" ? " is-success" : ""}`} aria-hidden="true">
              {log.action === "organization.verified" ? "✓" : "!"}
            </span>
            <div><strong>{auditMessage(log)}</strong>
              <span>{log.details?.organizationName || log.targetId} · {log.actorId?.name || "Admin tidak tersedia"}</span>
            </div>
            <time dateTime={new Date(log.timestamp).toISOString()}>{formatAuditDate(log.timestamp)}</time>
          </article>)}</div>
          : !error && <p className="admin-empty">Belum ada aktivitas admin yang tercatat.</p>}
    </section>
  </section>;
}
