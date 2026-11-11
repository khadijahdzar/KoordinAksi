import React, { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Building2, Clock3, Search, TrendingUp, Users } from "lucide-react";
import api, { getErrorMessage } from "../api";
import ActivityFormModal from "./ActivityFormModal";
import { getOrganizationStats } from "./orgApi";

const statusLabels = { draft: "Draft", published: "Dipublikasikan", cancelled: "Dibatalkan" };
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short"
}).format(new Date(date));

export default function OrganizationDashboard() {
  const { canManagePublishedActivities } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalActivity, setModalActivity] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [busyActivityId, setBusyActivityId] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/activities/meta");
      setCategories(data.categories);
      setCategoryError("");
      return true;
    } catch (requestError) {
      setCategoryError(getErrorMessage(requestError));
      return false;
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/activities/mine");
      setActivities(data.activities);
      setError("");
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await getOrganizationStats();
      setStats(data.stats);
      setStatsError("");
    } catch (requestError) {
      setStatsError(getErrorMessage(requestError));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadCategories();
    loadStats();
  }, [loadActivities, loadCategories, loadStats]);

  async function retryLoading() {
    await Promise.all([loadActivities(), loadCategories(), loadStats()]);
  }

  async function savedActivity() {
    const loaded = await loadActivities();
    if (loaded) {
      setCreateModalOpen(false);
      setModalActivity(null);
      setNotice("Kegiatan berhasil disimpan.");
    }
  }

  async function cancelActivity(activity) {
    if (!window.confirm(`Batalkan kegiatan "${activity.title}"?`)) return;
    setBusyActivityId(activity._id);
    setBusyAction("cancel");
    setError("");
    setNotice("");
    try {
      await api.delete(`/activities/${activity._id}`);
      if (await loadActivities()) setNotice("Kegiatan berhasil dibatalkan.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyActivityId("");
      setBusyAction("");
    }
  }

  const visibleActivities = activities.filter((activity) => {
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [activity.title, activity.category, activity.location]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return <section className="organization-dashboard">
    <div className="organization-page-heading">
      <div><span className="eyebrow">Kelola kegiatan</span><h1>Ruang aksi sosialmu.</h1>
        <p>Publikasikan kegiatan dan koordinasikan para relawan.</p></div>
      {canManagePublishedActivities && <button type="button" className="button"
        onClick={() => setCreateModalOpen(true)}>+ Buat kegiatan</button>}
    </div>
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {categoryError && <div className="organization-load-error" role="alert">
      <span>{categoryError}</span><button className="button button-small button-ghost" onClick={loadCategories}>Coba lagi memuat kategori</button>
    </div>}
    {error && <div className="organization-load-error" role="alert">
      <span>{error}</span><button className="button button-small button-ghost" onClick={retryLoading}>Coba lagi</button>
    </div>}
    {statsError && <div className="organization-load-error" role="alert"><span>{statsError}</span><button className="button button-small button-ghost" onClick={loadStats}>Muat ulang metrik</button></div>}
    <div className="organization-metric-grid" aria-label="Ringkasan dampak organisasi">
      <article><span><Building2 size={16} /> Total kegiatan</span><strong>{statsLoading ? "—" : stats?.totalActivities ?? 0}</strong><small>Semua status kecuali dibatalkan</small></article>
      <article><span><Users size={16} /> Relawan aktif</span><strong>{statsLoading ? "—" : stats?.totalVolunteers ?? 0}</strong><small>Relawan terdaftar pada kegiatanmu</small></article>
      <article><span><Clock3 size={16} /> Jam kontribusi</span><strong>{statsLoading ? "—" : stats?.totalHours ?? 0}</strong><small>Jam kehadiran yang sudah dicatat</small></article>
      <article><span><TrendingUp size={16} /> Pertumbuhan dampak</span><strong>{statsLoading ? "—" : `${stats?.impactGrowth > 0 ? "+" : ""}${stats?.impactGrowth ?? 0}%`}</strong><small>Dibanding bulan sebelumnya</small></article>
    </div>
    <div className="organization-list-heading">
      <div><h2>Kegiatan saya</h2><span>{loading ? "Memuat..." : `${visibleActivities.length} dari ${activities.length} kegiatan`}</span></div>
      <label className="organization-table-search"><Search size={15} /><span className="visually-hidden">Cari kegiatan</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul, kategori, lokasi" /></label>
    </div>
    <div className="organization-action-tabs" role="tablist" aria-label="Filter status kegiatan">
      {[{ value: "all", label: "Semua" }, { value: "published", label: "Aktif" }, { value: "draft", label: "Draft" }, { value: "cancelled", label: "Dibatalkan" }].map((tab) => <button type="button" role="tab" aria-selected={statusFilter === tab.value} className={statusFilter === tab.value ? "active" : ""} key={tab.value} onClick={() => setStatusFilter(tab.value)}>{tab.label}</button>)}
    </div>
    {loading && !activities.length
      ? <div className="organization-table-skeleton" role="status"><span /><span /><span /><span /></div>
      : <div className="organization-table-wrap"><table className="organization-action-table"><thead><tr><th>Kegiatan</th><th>Tanggal & lokasi</th><th>Relawan</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>{visibleActivities.map((activity) => <tr key={activity._id}>
          <td><strong>{activity.title}</strong><small>{activity.category}</small></td>
          <td><strong>{formatDate(activity.date)}</strong><small>{activity.location}</small></td>
          <td><strong>{activity.activeRegistrations}/{activity.capacity}</strong><small>terdaftar</small></td>
          <td><span className={`organization-activity-status status-${activity.status}`}>{statusLabels[activity.status] || activity.status}</span></td>
          <td><div className="organization-table-actions"><Link className="button button-small button-ghost" to={`/dashboard/organisasi/activities/${activity._id}/participants`}>Pendaftar</Link>{activity.status !== "cancelled" && <><button type="button" className="button button-small button-ghost" onClick={() => { setModalActivity(activity); setCreateModalOpen(false); }}>Edit</button><button type="button" className="organization-cancel-button" disabled={busyActivityId === activity._id} onClick={() => cancelActivity(activity)}>{busyActivityId === activity._id && busyAction === "cancel" ? "Membatalkan..." : "Batalkan"}</button></>}</div></td>
        </tr>)}</tbody></table></div>}
    {!loading && !error && !visibleActivities.length && <div className="empty-box">
      <span>✳</span><h3>{activities.length ? "Tidak ada kegiatan yang cocok" : "Belum ada kegiatan"}</h3>
      <p>{activities.length ? "Ubah kata kunci atau filter status." : canManagePublishedActivities ? "Buat kegiatan pertama untuk mulai mengajak relawan." : "Daftar kegiatan akan muncul setelah organisasi membuatnya."}</p>
    </div>}
    {(createModalOpen || modalActivity) && <ActivityFormModal
      activity={modalActivity}
      categories={categories}
      canPublish={canManagePublishedActivities}
      onClose={() => { setCreateModalOpen(false); setModalActivity(null); }}
      onSaved={savedActivity}
    />}
  </section>;
}
