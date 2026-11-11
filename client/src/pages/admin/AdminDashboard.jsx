import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, FileSpreadsheet, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api";
import HeroSection from "../../components/HeroSection";
import AdminToast from "../../admin/AdminToast";

const metricsConfig = [
  { key: "totalUsers", label: "Total pengguna", detail: "Seluruh akun platform", Icon: Users },
  { key: "activeVolunteers", label: "Relawan aktif", detail: "Pernah mencatat kehadiran", Icon: ShieldCheck },
  { key: "totalImpactHours", label: "Jam dampak", detail: "Jam kontribusi terverifikasi", Icon: TrendingUp },
  { key: "pendingVerifications", label: "Menunggu verifikasi", detail: "Organisasi dan kegiatan", Icon: AlertCircle }
];

function activityMessage(action) {
  const messages = {
    "organization.verified": "Organisasi disetujui",
    "organization.rejected": "Organisasi ditolak",
    "organization.approved": "Organisasi disetujui",
    "activity.approved": "Kegiatan disetujui",
    "activity.rejected": "Kegiatan diturunkan"
  };
  return messages[action] || action;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [verifications, setVerifications] = useState({ organizations: [], activities: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [workingId, setWorkingId] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      api.get("/admin/metrics"),
      api.get("/admin/verifications"),
      api.get("/admin/audit-logs?limit=8")
    ]);
    const failures = [];
    if (results[0].status === "fulfilled") setMetrics(results[0].value.data);
    else failures.push(`Metrik: ${getErrorMessage(results[0].reason)}`);
    if (results[1].status === "fulfilled") setVerifications(results[1].value.data);
    else failures.push(`Antrean verifikasi: ${getErrorMessage(results[1].reason)}`);
    if (results[2].status === "fulfilled") setAuditLogs(results[2].value.data.auditLogs);
    else failures.push(`Log aktivitas: ${getErrorMessage(results[2].reason)}`);
    setError(failures.join(" "));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function moderate(item, entityType, decision) {
    if (!item || workingId) return;
    setWorkingId(item._id);
    setToast(null);
    try {
      await api.patch(`/admin/verify/${item._id}`, { entityType, decision });
      setSelected(null);
      setToast({
        type: "success",
        message: decision === "approved" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak."
      });
      await loadDashboard();
    } catch (requestError) {
      setToast({ type: "error", message: getErrorMessage(requestError) });
    } finally {
      setWorkingId("");
    }
  }

  const pendingItems = [
    ...verifications.organizations.map((item) => ({ ...item, entityType: "organization", label: item.name, subtitle: item.owner?.name || item.email || "Organisasi" })),
    ...verifications.activities.map((item) => ({ ...item, entityType: "activity", label: item.title, subtitle: item.organization?.name || item.location || "Kegiatan" }))
  ];
  const maxHours = Math.max(1, ...(metrics?.monthlyImpact || []).map((month) => month.hours));

  return <section className="admin-dashboard admin-console-dashboard">
    <HeroSection
      className="dashboard-hero admin-dashboard-hero"
      eyebrow="KoordinAksi · Admin"
      title="Verifikasi & metrik admin"
      subtitle="Pantau dampak platform dan tinjau pengajuan yang membutuhkan tindakan."
    >
      <button type="button" className="button button-ghost" onClick={loadDashboard} disabled={loading}>
        {loading ? "Memuat…" : "Muat ulang"}
      </button>
    </HeroSection>
    <AdminToast toast={toast} onDismiss={() => setToast(null)} />
    {error && <div className="admin-error" role="alert">
      <span>{error}</span><button type="button" className="button button-small button-ghost" onClick={loadDashboard}>Coba lagi</button>
    </div>}

    <div className="admin-stat-grid admin-console-metrics" aria-live="polite">
      {metricsConfig.map(({ key, label, detail, Icon }) => <article className="admin-stat-card" key={key}>
        <div className="admin-console-metric-top"><span className="admin-console-icon"><Icon size={18} aria-hidden="true" /></span>
          <span>{detail}</span></div>
        <strong>{loading || !metrics ? "—" : Number(metrics[key] || 0).toLocaleString("id-ID")}</strong>
        <span className="admin-stat-label">{label}</span>
      </article>)}
    </div>

    <div className="admin-console-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="eyebrow">Analitik dampak</span><h2>Jam relawan per bulan</h2></div>
          <TrendingUp size={19} aria-hidden="true" />
        </div>
        {loading && !metrics
          ? <div className="admin-table-state" role="status">Memuat metrik…</div>
          : <div className="admin-impact-chart" role="img" aria-label="Grafik jam kontribusi relawan enam bulan terakhir">
            {(metrics?.monthlyImpact || []).map((month) => <div className="admin-impact-month" key={month.month}>
              <span>{Number(month.hours).toLocaleString("id-ID")} jam</span>
              <div className="admin-impact-bar-track"><i style={{ height: `${Math.max(6, (month.hours / maxHours) * 100)}%` }} /></div>
              <small>{month.month}</small>
            </div>)}
          </div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="eyebrow">Tindakan cepat</span><h2>Antrean moderasi</h2></div>
          <span className="admin-count">{loading ? "—" : pendingItems.length}</span>
        </div>
        {loading && !pendingItems.length
          ? <div className="admin-table-state" role="status">Memuat pengajuan…</div>
          : pendingItems.length
            ? <div className="admin-quick-actions">{pendingItems.slice(0, 5).map((item) => <article className="admin-quick-action" key={`${item.entityType}-${item._id}`}>
              <span className="admin-quick-action-icon">{item.entityType === "organization" ? <ShieldCheck size={17} /> : <FileSpreadsheet size={17} />}</span>
              <div><strong>{item.label}</strong><small>{item.entityType === "organization" ? "Organisasi" : "Kegiatan"} · {item.subtitle}</small></div>
              <div className="admin-review-actions">
                <button type="button" className="admin-icon-action" aria-label={`Setujui ${item.label}`}
                  disabled={Boolean(workingId)} onClick={() => moderate(item, item.entityType, "approved")}><Check size={16} /></button>
                <button type="button" className="admin-icon-action is-reject" aria-label={`Tolak ${item.label}`}
                  disabled={Boolean(workingId)} onClick={() => setSelected(item)}><AlertCircle size={16} /></button>
              </div>
            </article>)}
              {pendingItems.length > 5 && <Link className="admin-more-link" to="/admin/organizations/pending">Lihat seluruh antrean <ArrowRight size={14} /></Link>}
            </div>
            : <div className="admin-table-state"><strong>Antrean verifikasi kosong</strong><span>Pengajuan baru akan muncul di sini.</span></div>}
      </section>
    </div>

    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><span className="eyebrow">Jejak aktivitas</span><h2>Aktivitas admin terbaru</h2></div>
        <Link className="text-link" to="/admin/system">Lihat semua <ArrowRight size={14} /></Link>
      </div>
      {loading && !auditLogs.length
        ? <p className="admin-empty">Memuat aktivitas admin…</p>
        : auditLogs.length
          ? <div className="admin-audit-list">{auditLogs.map((log) => <article className="admin-audit-row" key={`${log.targetModel}-${log._id}`}>
            <span className={`admin-audit-icon${log.action.endsWith("approved") || log.action.endsWith("verified") ? " is-success" : ""}`} aria-hidden="true">
              {log.action.endsWith("approved") || log.action.endsWith("verified") ? <Check size={14} /> : <AlertCircle size={14} />}
            </span>
            <div><strong>{activityMessage(log.action)}</strong>
              <span>{log.details?.name || log.details?.organizationName || log.targetId} · {log.actorId?.name || "Admin tidak tersedia"}</span>
            </div>
            <time dateTime={new Date(log.timestamp).toISOString()}>{formatDate(log.timestamp)}</time>
          </article>)}</div>
          : !error && <p className="admin-empty">Belum ada aktivitas admin yang tercatat.</p>}
    </section>

    {selected && <div className="admin-confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !workingId) setSelected(null);
    }}>
      <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <span className="eyebrow">Konfirmasi moderasi</span>
        <h2 id="admin-confirm-title">Tolak pengajuan ini?</h2>
        <p><strong>{selected.label}</strong> tidak akan disetujui. Tindakan ini akan dicatat di log audit.</p>
        <div><button type="button" className="button button-ghost" disabled={Boolean(workingId)} onClick={() => setSelected(null)}>Kembali</button>
          <button type="button" className="button admin-danger-button" disabled={Boolean(workingId)}
            onClick={() => moderate(selected, selected.entityType, "rejected")}>
            {workingId ? "Memproses…" : "Ya, tolak pengajuan"}
          </button></div>
      </section>
    </div>}
  </section>;
}
