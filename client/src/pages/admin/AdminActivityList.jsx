import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Search } from "lucide-react";
import api, { getErrorMessage } from "../../api";
import AdminToast from "../../admin/AdminToast";

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminActivityList() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [workingId, setWorkingId] = useState("");

  const loadActivities = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/activities", {
        params: { page, limit: 20, search: search.trim() || undefined, status: status || undefined },
        signal
      });
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (requestError) {
      if (!signal?.aborted) setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadActivities(controller.signal), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadActivities]);

  async function moderate(decision) {
    if (!selected || workingId) return;
    setWorkingId(selected._id);
    setToast(null);
    try {
      await api.patch(`/admin/verify/${selected._id}`, { entityType: "activity", decision });
      setSelected(null);
      setToast({ type: "success", message: decision === "approved" ? "Kegiatan berhasil disetujui." : "Kegiatan berhasil diturunkan." });
      await loadActivities();
    } catch (requestError) {
      setToast({ type: "error", message: getErrorMessage(requestError) });
    } finally {
      setWorkingId("");
    }
  }

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return <section className="admin-dashboard admin-data-page">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Moderasi platform</span><h1>Daftar kegiatan admin</h1>
        <p>Tinjau dan kelola kegiatan komunitas yang dipublikasikan di platform.</p></div>
      <span className="admin-count admin-queue-count">{pagination.total.toLocaleString("id-ID")} kegiatan</span>
    </header>
    <AdminToast toast={toast} onDismiss={() => setToast(null)} />
    {error && <div className="admin-error" role="alert"><span>{error}</span>
      <button type="button" className="button button-small button-ghost" onClick={() => loadActivities()}>Coba lagi</button></div>}
    <section className="admin-panel">
      <div className="admin-data-filters">
        <label className="admin-search-field"><Search size={16} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => changeFilter(setSearch, event.target.value)}
            placeholder="Cari nama, kategori, atau lokasi" aria-label="Cari kegiatan" /></label>
        <select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} aria-label="Filter status kegiatan">
          <option value="">Semua status</option><option value="published">Dipublikasikan</option>
          <option value="draft">Draf</option><option value="cancelled">Dibatalkan</option>
        </select>
      </div>
      {loading
        ? <div className="admin-table-state" role="status"><span className="admin-spinner" aria-hidden="true" /> Memuat kegiatan…</div>
        : activities.length
          ? <div className="admin-table-wrap"><table className="admin-data-table">
            <thead><tr><th scope="col">Kegiatan</th><th scope="col">Organisasi</th><th scope="col">Jadwal</th>
              <th scope="col">Status</th><th scope="col"><span className="visually-hidden">Tindakan</span></th></tr></thead>
            <tbody>{activities.map((activity) => {
              const isPending = activity.verificationStatus === "pending";
              const canModerate = activity.status === "published" || isPending;
              return <tr key={activity._id}>
                <td data-label="Kegiatan"><strong>{activity.title}</strong><small>{activity.category} · {activity.location}</small></td>
                <td data-label="Organisasi">{activity.organization?.name || "Organisasi tidak tersedia"}</td>
                <td data-label="Jadwal">{formatDate(activity.date)}</td>
                <td data-label="Status"><span className={`admin-status-pill is-${activity.verificationStatus || activity.status}`}>
                  {isPending ? "Menunggu verifikasi" : activity.status === "published" ? "Dipublikasikan" : activity.status === "draft" ? "Draf" : "Dibatalkan"}
                </span></td>
                <td data-label="Tindakan"><div className="admin-table-actions">
                  {isPending && <button type="button" className="button button-small admin-approve-button" disabled={Boolean(workingId)}
                    onClick={() => setSelected({ ...activity, moderationDecision: "approved" })}><Check size={14} /> Setujui</button>}
                  {canModerate && <button type="button" className="button button-small admin-takedown-button" disabled={Boolean(workingId)}
                    onClick={() => setSelected({ ...activity, moderationDecision: "rejected" })}>
                    <AlertCircle size={14} /> {isPending ? "Tolak" : "Turunkan"}
                  </button>}
                </div></td>
              </tr>;
            })}</tbody>
          </table></div>
          : <div className="admin-table-state"><strong>Tidak ada kegiatan ditemukan</strong><span>Ubah filter atau kata kunci pencarian.</span></div>}
      <div className="admin-pagination">
        <span>{pagination.total.toLocaleString("id-ID")} hasil · Halaman {page} dari {Math.max(1, pagination.pages)}</span>
        <div><button type="button" className="button button-small button-ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
          <button type="button" className="button button-small button-ghost" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Berikutnya</button></div>
      </div>
    </section>

    {selected && <div className="admin-confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !workingId) setSelected(null);
    }}>
      <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="activity-confirm-title">
        <span className="eyebrow">Konfirmasi tindakan</span>
        <h2 id="activity-confirm-title">{selected.moderationDecision === "approved" ? "Setujui kegiatan?" : "Turunkan kegiatan?"}</h2>
        <p><strong>{selected.title}</strong> {selected.moderationDecision === "approved"
          ? "akan disetujui untuk ditampilkan sesuai status publikasinya."
          : "akan dihentikan dan tidak lagi ditampilkan kepada relawan."}</p>
        <div><button type="button" className="button button-ghost" disabled={Boolean(workingId)} onClick={() => setSelected(null)}>Kembali</button>
          <button type="button" className={`button ${selected.moderationDecision === "rejected" ? "admin-danger-button" : ""}`}
            disabled={Boolean(workingId)} onClick={() => moderate(selected.moderationDecision || "rejected")}>
            {workingId ? "Memproses…" : selected.moderationDecision === "approved" ? "Ya, setujui" : "Ya, turunkan"}
          </button></div>
      </section>
    </div>}
  </section>;
}
