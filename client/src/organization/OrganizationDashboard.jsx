import React, { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import ActivityFormModal from "./ActivityFormModal";

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
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadCategories();
  }, [loadActivities, loadCategories]);

  async function retryLoading() {
    await Promise.all([loadActivities(), loadCategories()]);
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
    <div className="organization-list-heading">
      <h2>Kegiatan saya</h2><span>{loading ? "Memuat..." : `${activities.length} kegiatan`}</span>
    </div>
    {loading && !activities.length
      ? <div className="organization-empty-state" role="status">Memuat daftar kegiatan…</div>
      : activities.map((activity) => <article className="organization-activity-row" key={activity._id}>
        <div className="organization-activity-info">
          <div className="organization-activity-tags">
            <span className="volunteer-category">{activity.category}</span>
            <span className={`organization-activity-status status-${activity.status}`}>
              {statusLabels[activity.status] || activity.status}
            </span>
          </div>
          <h3>{activity.title}</h3>
          <p>{formatDate(activity.date)} <span aria-hidden="true">·</span> {activity.location}</p>
          <div className="organization-capacity">
            <span>{activity.activeRegistrations}/{activity.capacity} relawan terdaftar</span>
            <div className="volunteer-capacity-track" role="progressbar"
              aria-label={`Kapasitas ${activity.title}`}
              aria-valuemin="0" aria-valuemax={activity.capacity}
              aria-valuenow={Math.min(activity.activeRegistrations, activity.capacity)}>
              <span style={{ width: `${activity.capacity ? Math.min(100, activity.activeRegistrations / activity.capacity * 100) : 0}%` }} />
            </div>
          </div>
        </div>
        <div className="organization-activity-actions">
          <Link className="button button-small button-ghost"
            to={`/dashboard/organisasi/activities/${activity._id}/participants`}>Pendaftar</Link>
          {activity.status !== "cancelled" && <>
            <button type="button" className="button button-small button-ghost"
              onClick={() => { setModalActivity(activity); setCreateModalOpen(false); }}>Edit</button>
            <button type="button" className="button button-small organization-cancel-button"
              disabled={busyActivityId === activity._id}
              onClick={() => cancelActivity(activity)}>
              {busyActivityId === activity._id && busyAction === "cancel" ? "Membatalkan..." : "Batalkan"}
            </button>
          </>}
        </div>
      </article>)}
    {!loading && !error && !activities.length && <div className="empty-box">
      <span>✳</span><h3>Belum ada kegiatan</h3>
      <p>{canManagePublishedActivities ? "Buat kegiatan pertama untuk mulai mengajak relawan." : "Daftar kegiatan akan muncul setelah organisasi membuatnya."}</p>
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
