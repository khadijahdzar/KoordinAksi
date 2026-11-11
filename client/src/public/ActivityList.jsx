import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  HandHeart,
  Leaf,
  MapPin,
  Search,
  UsersRound
} from "lucide-react";
import api, { getErrorMessage } from "../api";

const categoryFilters = [
  { label: "Semua aksi", value: "", icon: HandHeart },
  { label: "Lingkungan", value: "Penghijauan", icon: Leaf },
  { label: "Pendidikan", value: "Pendidikan", icon: BookOpen },
  { label: "Sosial", value: "Bakti Sosial", icon: HandHeart },
  { label: "Kemanusiaan", value: "Bantuan Bencana", icon: HandHeart }
];

function formatActivityDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Tanggal menyusul";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function ActivityExploreCard({ activity }) {
  const capacity = Number(activity.capacity) || 0;
  const volunteers = Number(activity.activeRegistrations) || 0;
  const progress = capacity > 0 ? Math.min(100, Math.round((volunteers / capacity) * 100)) : 0;
  const isFull = capacity > 0 && volunteers >= capacity;

  return <article className="explore-card">
    <Link className="explore-card-image" to={`/kegiatan/${activity._id}`} aria-label={`Lihat detail ${activity.title}`}>
      {activity.imageUrl
        ? <img src={activity.imageUrl} alt="" loading="lazy" />
        : <span className="explore-image-placeholder" aria-hidden="true"><Leaf size={42} /></span>}
      <span className="explore-card-category">{activity.category}</span>
      <span className={`explore-card-status${isFull ? " is-full" : ""}`}>
        <i aria-hidden="true" />{isFull ? "Kuota terpenuhi" : "Pendaftaran dibuka"}
      </span>
    </Link>
    <div className="explore-card-content">
      <div className="explore-card-organization">
        <span className="explore-org-mark">{activity.organization?.name?.charAt(0) || "K"}</span>
        <span>{activity.organization?.name || "Organisasi sosial"}</span>
        {activity.organization?.verified && <BadgeCheck size={15} aria-label="Organisasi terverifikasi" />}
      </div>
      <h2><Link to={`/kegiatan/${activity._id}`}>{activity.title}</Link></h2>
      <div className="explore-card-meta">
        <span><MapPin size={14} />{activity.location}</span>
        <span><CalendarDays size={14} />{formatActivityDate(activity.date)}</span>
      </div>
      <div className="explore-card-capacity">
        <div><span><UsersRound size={14} /> Relawan</span><strong>{volunteers} / {capacity || "—"}</strong></div>
        <div className="explore-capacity-track" role="progressbar"
          aria-label={`Kuota relawan ${activity.title}`} aria-valuemin="0"
          aria-valuemax={capacity} aria-valuenow={Math.min(volunteers, capacity)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Link className="explore-card-cta" to={`/kegiatan/${activity._id}`}>
        Lihat detail <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

export default function ActivityList() {
  const [params, setParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const location = params.get("location") || "";

  useEffect(() => {
    const controller = new AbortController();
    const query = params.toString();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/activities${query ? `?${query}` : ""}`, {
          signal: controller.signal
        });
        setActivities(data.activities);
        setError("");
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [params, reloadKey]);

  function updateFilter(key, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  }

  return <section className="explore-page">
    <div className="container">
      <div className="explore-heading">
        <div>
          <span className="eyebrow"><span className="pulse" /> Temukan kegiatan di sekitarmu</span>
          <h1>Satu aksi kecil,<br /><em>perubahan besar.</em></h1>
          <p>Temukan komunitas dan kegiatan yang sejalan dengan hal yang kamu pedulikan.</p>
        </div>
        <div className="explore-heading-note"><HandHeart size={20} /><span>Mulai dari yang<br /><strong>berarti bagimu.</strong></span></div>
      </div>

      <div className="explore-search-panel" role="search">
        <label className="explore-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">Cari kegiatan</span>
          <input type="search" value={search} onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Cari nama kegiatan atau kata kunci" />
        </label>
        <label className="explore-location-field">
          <MapPin size={17} aria-hidden="true" />
          <span className="visually-hidden">Lokasi</span>
          <input value={location} onChange={(event) => updateFilter("location", event.target.value)}
            placeholder="Kota atau lokasi" />
        </label>
        <button type="button" className="explore-search-button" onClick={() => setReloadKey((key) => key + 1)}>
          Cari aksi
        </button>
      </div>

      <div className="explore-categories" aria-label="Filter kategori">
        {categoryFilters.map(({ label, value, icon: Icon }) => <button
          key={label} type="button" className={`explore-category${category === value ? " is-active" : ""}`}
          aria-pressed={category === value} onClick={() => updateFilter("category", value)}>
          <Icon size={15} aria-hidden="true" />{label}
        </button>)}
      </div>

      <div className="explore-layout">
        <main className="explore-results">
          <div className="explore-results-heading">
            <div><span className="eyebrow">Kesempatan berkontribusi</span>
              <h2>{loading ? "Mencari kegiatan..." : `${activities.length} aksi ditemukan`}</h2></div>
            <span className="explore-results-hint">Pilih aksi yang paling dekat denganmu</span>
          </div>
          {error && <div className="explore-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</button>
          </div>}
          {loading && !activities.length
            ? <div className="explore-loading" aria-live="polite">Memuat kegiatan untukmu…</div>
            : <div className="explore-grid">
              {activities.map((activity) => <ActivityExploreCard key={activity._id} activity={activity} />)}
            </div>}
          {!loading && !error && !activities.length && <div className="explore-empty">
            <HandHeart size={28} aria-hidden="true" />
            <h2>Belum ada aksi yang cocok</h2>
            <p>Coba ubah kata kunci, kategori, atau lokasi pencarianmu.</p>
            <button type="button" onClick={() => setParams({}, { replace: true })}>Hapus semua filter</button>
          </div>}
        </main>

        <aside className="explore-sidebar" aria-label="Panduan menjelajahi aksi">
          <section className="explore-sidebar-card explore-popular-card">
            <span className="eyebrow">Mulai dari minatmu</span>
            <h2>Aksi populer</h2>
            <div className="explore-popular-links">
              {categoryFilters.slice(1).map(({ label, value, icon: Icon }) => <button
                type="button" key={value} onClick={() => updateFilter("category", value)}>
                <span><Icon size={16} />{label}</span><ArrowUpRight size={15} />
              </button>)}
            </div>
          </section>
          <section className="explore-sidebar-card explore-guide-card">
            <span className="explore-guide-icon"><HandHeart size={19} /></span>
            <h2>Kebaikan tumbuh saat dibagikan.</h2>
            <p>Daftar sebagai relawan, pilih kegiatan yang cocok, lalu mulai bergerak bersama komunitas.</p>
            <Link to="/register/volunteer">Gabung jadi relawan <ArrowUpRight size={15} /></Link>
          </section>
          <section className="explore-organization-card">
            <span>Kelola komunitas?</span>
            <strong>Ajak lebih banyak orang untuk beraksi.</strong>
            <Link to="/register/organization">Daftarkan organisasi <ArrowUpRight size={14} /></Link>
          </section>
        </aside>
      </div>
    </div>
  </section>;
}
