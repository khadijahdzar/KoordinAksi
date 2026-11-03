import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import ActivityCard from "./ActivityCard";

export default function ActivityFeed() {
  const { registrations, loadRegistrations, recordRegistration } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [busyActivityIds, setBusyActivityIds] = useState(() => new Set());
  const [actionError, setActionError] = useState("");
  const busyIds = useRef(new Set());
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    return params.toString();
  }, [filters]);

  const loadActivities = useCallback(async (signal) => {
    const { data } = await api.get(`/activities?${query}`, { signal });
    setActivities(data.activities);
    setError("");
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/activities/meta", { signal: controller.signal })
      .then(({ data }) => setCategories(data.categories))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") setCategoryError(getErrorMessage(requestError));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        await loadActivities(controller.signal);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadActivities, reloadKey]);

  const registeredActivityIds = useMemo(
    () => new Set(registrations.map((registration) => String(registration.activity?._id || registration.activity))),
    [registrations]
  );

  async function register(activityId) {
    if (busyIds.current.has(activityId)) return;
    busyIds.current.add(activityId);
    setBusyActivityIds((current) => new Set(current).add(activityId));
    setActionError("");
    try {
      const { data } = await api.post("/registrations", { activityId });
      recordRegistration(data.registration);
      setActivities((current) => current.map((activity) => activity._id === activityId
        ? { ...activity, activeRegistrations: activity.activeRegistrations + 1 }
        : activity));
      await loadRegistrations();
      try {
        await loadActivities();
      } catch (refreshError) {
        setError(getErrorMessage(refreshError));
      }
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
      if (requestError.response?.status === 409) {
        try {
          await loadActivities();
        } catch (refreshError) {
          setError(getErrorMessage(refreshError));
        }
      }
    } finally {
      busyIds.current.delete(activityId);
      setBusyActivityIds((current) => {
        const updated = new Set(current);
        updated.delete(activityId);
        return updated;
      });
    }
  }

  return <section className="volunteer-dashboard">
    <div className="volunteer-welcome">
      <div>
        <span className="eyebrow">Jelajahi kegiatan</span>
        <h1>Temukan aksi yang berarti.</h1>
        <p>Pilih kegiatan yang dekat dengan hatimu dan mulai bergerak bersama.</p>
      </div>
      <span className="volunteer-welcome-art" aria-hidden="true">✳</span>
    </div>
    {categoryError && <div className="notice" role="alert">{categoryError}</div>}
    <div className="volunteer-filter-panel" role="search">
      <label className="volunteer-search-field">
        <span>Cari kegiatan</span>
        <input type="search" value={filters.search} placeholder="Judul atau kata kunci"
          onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
      </label>
      <label>
        <span>Kategori</span>
        <select value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Semua kategori</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label>
        <span>Lokasi</span>
        <input value={filters.location} placeholder="Misalnya: Jakarta"
          onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
      </label>
    </div>
    {actionError && <div className="notice" role="alert">{actionError}</div>}
    {error && <div className="volunteer-feed-error" role="alert">
      <span>{error}</span>
      <button className="button button-small button-ghost" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</button>
    </div>}
    <div className="volunteer-results-heading">
      <div><span className="eyebrow">Kesempatan berkontribusi</span><h2>{loading ? "Memuat kegiatan..." : `${activities.length} kegiatan tersedia`}</h2></div>
      <Link to="/kegiatan" className="text-link">Lihat halaman publik →</Link>
    </div>
    {loading && !activities.length
      ? <div className="volunteer-feed-loading" aria-live="polite">Memuat kegiatan untukmu…</div>
      : <div className="volunteer-activity-grid">
        {activities.map((activity) => <ActivityCard key={activity._id} activity={activity}
          isRegistered={registeredActivityIds.has(String(activity._id))}
          busy={busyActivityIds.has(activity._id)} onRegister={register} />)}
      </div>}
    {!loading && !error && !activities.length && <div className="empty-box">
      <span>⌕</span><h3>Belum ada kegiatan yang cocok</h3>
      <p>Coba ubah kata kunci, kategori, atau lokasi pencarianmu.</p>
    </div>}
  </section>;
}
