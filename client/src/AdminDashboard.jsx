import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "./api";
import { useAuth } from "./AuthContext";

const emptyStats = {
  activities: 0,
  organizations: 0,
  volunteers: 0,
  registrations: 0
};

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
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin/dashboard">Ringkasan</NavLink>
      </nav>
      <div className="admin-sidebar-account">
        <span>{user.name}</span>
        <button className="button button-small button-ghost" onClick={signOut}>Keluar</button>
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

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [statsResult, organizationsResult, auditLogsResult] = await Promise.all([
        api.get("/activities/stats"),
        api.get("/organizations/pending"),
        api.get("/admin/audit-logs?limit=10")
      ]);
      setStats(statsResult.data);
      setOrganizations(organizationsResult.data.organizations);
      setAuditLogs(auditLogsResult.data.auditLogs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function reviewOrganization(id, verified) {
    setReviewingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/organizations/${id}/verify`, { verified });
      setSuccess(verified ? "Organisasi berhasil diverifikasi." : "Organisasi ditolak.");
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewingId("");
    }
  }

  const statCards = [
    ["Relawan", stats.volunteers],
    ["Organisasi terverifikasi", stats.organizations],
    ["Kegiatan aktif", stats.activities],
    ["Partisipasi", stats.registrations]
  ];

  return <section className="admin-dashboard">
    <header className="admin-page-heading">
      <div><span className="eyebrow">KoordinAksi · Admin</span><h1>Ringkasan platform</h1><p>Pantau aktivitas dan tinjau organisasi yang menunggu verifikasi.</p></div>
      <Link className="button button-ghost" to="/">Lihat situs</Link>
    </header>

    {error && <div className="notice" role="alert">{error}</div>}
    {success && <div className="notice notice-success" role="status">{success}</div>}

    <div className="admin-stat-grid">
      {statCards.map(([label, value]) => <article className="admin-stat-card" key={label}>
        <span>{label}</span>
        <strong>{loading ? "—" : Number(value || 0).toLocaleString("id-ID")}</strong>
      </article>)}
    </div>

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><span className="eyebrow">Tinjauan admin</span><h2>Organisasi menunggu verifikasi</h2></div>
        <span className="admin-count">{organizations.length}</span>
      </div>
      {loading ? <p className="admin-empty">Memuat daftar organisasi...</p>
        : organizations.length ? <div className="admin-pending-list">
          {organizations.map((organization) => <article className="admin-pending-row" key={organization._id}>
            <div className="admin-pending-info">
              <strong>{organization.name}</strong>
              <span>{organization.owner?.name || "Pemilik tidak tersedia"} · {organization.email}</span>
              <small>Terdaftar {new Date(organization.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</small>
            </div>
            <div className="admin-review-actions">
              <button className="button button-small" disabled={reviewingId === organization._id} onClick={() => reviewOrganization(organization._id, true)}>
                {reviewingId === organization._id ? "Memproses..." : "Verifikasi"}
              </button>
              <button className="button button-small button-ghost admin-reject-button" disabled={reviewingId === organization._id} onClick={() => reviewOrganization(organization._id, false)}>
                Tolak
              </button>
            </div>
          </article>)}
        </div>
        : !error && <p className="admin-empty">Tidak ada organisasi yang menunggu verifikasi.</p>}
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><span className="eyebrow">Aktivitas sistem</span><h2>Audit log</h2></div></div>
      {loading ? <p className="admin-empty">Memuat audit log...</p>
        : auditLogs.length ? <div className="admin-pending-list">
          {auditLogs.map((log) => <article className="admin-pending-row" key={log._id}>
            <div className="admin-pending-info">
              <strong>{log.action === "organization.verified" ? "Organisasi diverifikasi" : "Verifikasi organisasi ditolak"}</strong>
              <span>{log.details?.organizationName || log.targetId} · {log.actorId?.name || "Admin tidak tersedia"}</span>
              <small>{new Date(log.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</small>
            </div>
          </article>)}
        </div>
        : !error && <p className="admin-empty">Belum ada aktivitas admin yang tercatat.</p>}
    </section>
  </section>;
}
