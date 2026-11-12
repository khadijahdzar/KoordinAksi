import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import { getActivityImage } from "./activityImages";
import { getMockActivities } from "./activityMockData";
import {
  featuredOrganizations,
  getOrganizationActivitiesUrl,
  organizationLeaderboard
} from "./organizationMockData";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  HandHeart,
  MapPin,
  Search,
  UsersRound
} from "lucide-react";
import api, { getErrorMessage } from "../api";

const pageSize = 9;
const categoryFilters = [
  "Semua Kategori",
  "Lingkungan Hidup",
  "Pendidikan & Anak",
  "Kesehatan & Lansia",
  "Bakti Sosial",
  "Semua Bencana",
  "Pemberdayaan UMKM",
  "Kebudayaan"
];
const locationOptions = [
  "Jakarta",
  "Bogor",
  "Bekasi",
  "Bandung",
  "Semarang",
  "Yogyakarta",
  "Surabaya",
  "Nusa Tenggara Timur",
  "Sumatera"
];
const sampleVolunteers = [
  { name: "Khadijah Dzar", activities: 8, hours: 32 },
  { name: "Kenneth Xanth Taylor", activities: 6, hours: 27 },
  { name: "Dije Joss", activities: 5, hours: 21 }
];

function formatActivityDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Tanggal menyusul";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsedDate);
}

function ActivityExploreCard({ activity }) {
  const capacity = Number(activity.capacity) || 0;
  const volunteers = Number(activity.activeRegistrations) || 0;
  const progress = capacity > 0 ? Math.min(100, Math.round((volunteers / capacity) * 100)) : 0;
  const isFull = capacity > 0 && volunteers >= capacity;

  return <article className="explore-card">
    <Link className="explore-card-image" to={`/kegiatan/${activity._id}`} aria-label={`Lihat detail ${activity.title}`}>
      <img src={getActivityImage(activity)} alt={`Dokumentasi kegiatan ${activity.title}`} loading="lazy" />
      <span className="explore-card-category">{activity.category}</span>
      <span className={`explore-card-status${isFull ? " is-full" : ""}`}>
        <i aria-hidden="true" />{isFull ? "Kuota terpenuhi" : "Pendaftaran dibuka"}
      </span>
    </Link>
    <div className="explore-card-content">
      <h2><Link to={`/kegiatan/${activity._id}`}>{activity.title}</Link></h2>
      <div className="explore-card-meta">
        <span><MapPin size={14} aria-hidden="true" />{activity.location}</span>
        <span><CalendarDays size={14} aria-hidden="true" />{formatActivityDate(activity.date)}</span>
      </div>
      <div className="explore-card-capacity">
        <div><span><UsersRound size={14} aria-hidden="true" />Kapasitas Relawan</span><strong>{volunteers} / {capacity || "—"} terisi</strong></div>
        <div className="explore-capacity-track" role="progressbar"
          aria-label={`Kapasitas kegiatan ${activity.title}`} aria-valuemin="0" aria-valuemax={capacity}
          aria-valuenow={Math.min(volunteers, capacity)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Link className="explore-card-cta" to={`/kegiatan/${activity._id}`}>
        Lihat Detail <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index);

  return <nav className="explore-pagination" aria-label="Navigasi halaman kegiatan">
    <button type="button" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onChange(page - 1)}>
      <ArrowLeft size={15} /> Sebelumnya
    </button>
    <div>{visiblePages.map((number) => <button
      type="button" key={number} aria-current={page === number ? "page" : undefined}
      className={page === number ? "is-current" : ""} onClick={() => onChange(number)}
    >{number}</button>)}</div>
    <button type="button" aria-label="Halaman selanjutnya" disabled={page >= pages} onClick={() => onChange(page + 1)}>
      Selanjutnya <ArrowRight size={15} />
    </button>
  </nav>;
}

export default function ActivityList() {
  const [params, setParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [followedOrganizations, setFollowedOrganizations] = useState(() =>
    (localStorage.getItem("koordinaksi_followed_organizations") || "").split(",").filter(Boolean)
  );
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingMockActivities, setUsingMockActivities] = useState(false);
  const [organizationsError, setOrganizationsError] = useState("");
  const [search, setSearch] = useState(params.get("search") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [date, setDate] = useState(params.get("date") || "");

  const category = params.get("category") || "Semua Kategori";
  const currentPage = Math.max(1, Number(params.get("page")) || 1);

  useEffect(() => {
    setSearch(params.get("search") || "");
    setLocation(params.get("location") || "");
    setDate(params.get("date") || "");
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(params);
    query.set("limit", String(pageSize));
    if (!query.has("page")) query.set("page", "1");
    const organization = query.get("organization");
    if (organization) {
      query.delete("search");
      query.delete("category");
      query.delete("location");
      query.delete("date");
    }

    async function loadActivities() {
      setLoading(true);
      try {
        const { data } = await api.get(`/activities?${query.toString()}`, { signal: controller.signal });
        const results = data.activities.length || organization
          ? { activities: data.activities, pagination: data.pagination }
          : getMockActivities(query, pageSize);
        setActivities(results.activities);
        setPagination(results.pagination);
        setUsingMockActivities(!data.activities.length && !organization);
        setError("");
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          setActivities([]);
          setPagination({ total: 0, page: 1, pages: 0 });
          setUsingMockActivities(false);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadActivities();
    return () => controller.abort();
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOrganizations() {
      try {
        const { data } = await api.get("/organizations", { signal: controller.signal });
        setOrganizations(data.organizations);
        setLeaderboard(data.leaderboard || []);
        setOrganizationsError("");
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") setOrganizationsError(getErrorMessage(requestError));
      }
    }
    loadOrganizations();
    return () => controller.abort();
  }, []);

  function applyFilters(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("search", search.trim());
    if (location) next.set("location", location);
    if (date) next.set("date", date);
    if (category !== "Semua Kategori") next.set("category", category);
    next.set("page", "1");
    setParams(next);
  }

  function selectCategory(nextCategory) {
    const next = new URLSearchParams(params);
    if (nextCategory === "Semua Kategori") next.delete("category");
    else next.set("category", nextCategory);
    next.set("page", "1");
    setParams(next);
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilters() {
    setSearch("");
    setLocation("");
    setDate("");
    setParams({ page: "1" });
  }

  function toggleFollow(organizationId) {
    setFollowedOrganizations((current) => {
      const updated = current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId];
      localStorage.setItem("koordinaksi_followed_organizations", updated.join(","));
      return updated;
    });
  }

  const selectedOrganizations = organizations.length ? organizations.slice(0, 4) : featuredOrganizations;
  const topOrganizations = leaderboard.length ? leaderboard.slice(0, 3) : organizationLeaderboard;

  return <section className="explore-page">
    <HeroSection
      className="explore-hero"
      eyebrow="Temukan kegiatan di sekitarmu"
      title={<>Satu aksi kecil,<br />perubahan besar.</>}
      subtitle="Temukan komunitas dan kegiatan yang sejalan dengan hal yang kamu pedulikan."
    >
      <div className="explore-heading-note"><HandHeart size={20} /><span>Mulai dari yang<br /><strong>berarti bagimu.</strong></span></div>
    </HeroSection>
    <div className="container">
      <form className="explore-search-panel" role="search" onSubmit={applyFilters}>
        <label className="explore-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">Cari kegiatan</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kegiatan, mangrove, dan lainnya" />
        </label>
        <label className="explore-location-field">
          <MapPin size={17} aria-hidden="true" />
          <span className="visually-hidden">Filter lokasi</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Semua lokasi</option>
            {locationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="explore-date-field">
          <CalendarDays size={17} aria-hidden="true" />
          <span className="visually-hidden">Tanggal kegiatan</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="submit" className="explore-search-button">Tampilkan</button>
        <button type="button" className="explore-reset-button" onClick={resetFilters}>Reset</button>
      </form>

      <div className="explore-categories" aria-label="Filter kategori">
        {categoryFilters.map((item) => <button
          key={item} type="button" className={`explore-category${category === item ? " is-active" : ""}`}
          aria-pressed={category === item} onClick={() => selectCategory(item)}
        >{item}</button>)}
      </div>

      <main className="explore-results">
        <div className="explore-results-heading">
          <div><span className="eyebrow">Kesempatan berkontribusi</span>
            <h2>{loading ? "Mencari kegiatan..." : `${pagination.total} aksi ditemukan`}</h2></div>
          <span className="explore-results-hint">Pilih aksi yang paling dekat denganmu</span>
        </div>
        {usingMockActivities && !loading && <p className="explore-demo-note" role="note">Data demonstrasi ditampilkan karena belum ada kegiatan yang cocok dengan filter. Pendaftaran belum tersedia untuk data ini.</p>}
        {error && <div className="explore-error" role="alert">
          <span>{error}</span><button type="button" onClick={() => setParams(new URLSearchParams(params))}>Coba lagi</button>
        </div>}
        {loading
          ? <div className="explore-loading" aria-live="polite">Memuat kegiatan untukmu…</div>
          : activities.length
            ? <div className="explore-grid">{activities.map((activity) =>
              <ActivityExploreCard key={activity._id} activity={activity} />)}</div>
            : !error && <div className="explore-empty">
              <HandHeart size={28} aria-hidden="true" />
              <h2>Belum ada aksi yang cocok</h2>
              <p>Coba ubah kata kunci, kategori, tanggal, atau lokasi pencarianmu.</p>
              <button type="button" onClick={resetFilters}>Hapus semua filter</button>
            </div>}
        <Pagination page={currentPage} pages={pagination.pages} onChange={changePage} />
      </main>

      <section className="explore-bottom-stack" aria-label="Komunitas KoordinAksi">
        <article className="explore-bottom-panel">
          <span className="eyebrow">Komunitas terpercaya</span>
          <h2>Organisasi Terpilih</h2>
          {organizationsError && <p className="explore-bottom-error" role="alert">{organizationsError}</p>}
          <ul className="explore-organization-list">
            {selectedOrganizations.map((organization) => <li key={organization._id}>
              <Link className="explore-selected-org" to={`/organisasi/${organization._id}`}>
                <img src={organization.logoUrl || "/logokoordinaski.png"} alt="" />
                <span><strong>{organization.name}</strong><small>{organization.focusCategory}</small></span>
              </Link>
              <span className={`explore-org-badge${organization.simulated ? " is-demo" : ""}`}>
                {organization.simulated ? "Profil demo" : <><BadgeCheck size={13} aria-label="Terverifikasi" /> Terverifikasi</>}
              </span>
              <button type="button" className={`explore-org-follow${followedOrganizations.includes(organization._id) ? " is-followed" : ""}`}
                aria-pressed={followedOrganizations.includes(organization._id)}
                onClick={() => toggleFollow(organization._id)}>
                {followedOrganizations.includes(organization._id) ? "Diikuti" : "Ikuti"}
              </button>
            </li>)}
          </ul>
          <Link className="explore-org-directory-link" to="/organisasi">Lihat semua profil <ArrowUpRight size={14} /></Link>
        </article>
        <article className="explore-bottom-panel">
          <span className="eyebrow">Bulan ini</span>
          <h2>Lembaga Teraktif</h2>
          {!leaderboard.length && <p className="explore-bottom-muted">Peringkat demonstrasi bulan ini.</p>}
          <ol className="explore-volunteer-list">
            {topOrganizations.map((organization, index) => <li key={organization._id || organization.name}>
              <span className="explore-volunteer-rank">{index + 1}</span>
              <span className="explore-volunteer-name">{organization.name}<small>{organization.score ?? organization.actions} aksi selesai</small></span>
              <strong>{organization.score ?? organization.actions} aksi</strong>
            </li>)}
          </ol>
        </article>
        <article className="explore-bottom-panel">
          <span className="eyebrow">Bulan ini · contoh</span>
          <h2>Relawan Teraktif</h2>
          <p className="explore-bottom-muted">Contoh tampilan leaderboard relawan.</p>
          <ol className="explore-volunteer-list">
            {sampleVolunteers.map((volunteer, index) => <li key={volunteer.name}>
              <span className="explore-volunteer-rank">{index + 1}</span>
              <span className="explore-volunteer-name">{volunteer.name}<small>{volunteer.activities} partisipasi</small></span>
              <strong>{volunteer.hours} jam</strong>
            </li>)}
          </ol>
        </article>
        <article className="explore-bottom-cta">
          <span>Untuk organisasi sosial</span>
          <h2>Ingin Membuat Inisiatif Sendiri?</h2>
          <p>Ajak komunitas bergerak dan temukan relawan yang siap berkontribusi.</p>
          <Link to="/register/organization">Daftarkan Organisasi <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </article>
      </section>
    </div>
  </section>;
}
