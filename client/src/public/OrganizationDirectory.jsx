import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Star
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import HeroSection from "../components/HeroSection";

const pageSize = 9;
const focusOptions = [
  "Lingkungan & Konservasi",
  "Pendidikan & Literasi",
  "Kesehatan & Medis",
  "Tanggap Bencana",
  "Pemberdayaan Masyarakat",
  "Sosial & Kemanusiaan",
  "Lainnya"
];
const focusPills = [
  "Semua Fokus Bidang",
  "Lingkungan & Konservasi",
  "Pendidikan & Literasi",
  "Tanggap Bencana",
  "Pemberdayaan Masyarakat",
  "Sosial & Kemanusiaan"
];
const regions = ["Jakarta", "Bandung", "Bogor", "Semarang", "Yogyakarta", "Surabaya", "Sumatera", "Nusa Tenggara"];
const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

function OrganizationCard({ organization, followed, onToggleFollow }) {
  const activeActions = Number(organization.stats?.activeActionsCount) || 0;
  const volunteers = Number(organization.stats?.totalVolunteers) || 0;
  const completedActions = Number(organization.stats?.completedActions) || 0;
  const location = organization.address?.split(",").filter(Boolean).slice(-2).join(", ").trim() || "Indonesia";

  return <article className="organization-directory-card">
    <div className="organization-directory-image">
      <img src={organization.logoUrl || "/3fingers.jpg"} alt="" loading="lazy" />
      <span className="organization-focus-badge">{organization.focusCategory || "Sosial & Kemanusiaan"}</span>
      <span className="organization-verified-badge"><BadgeCheck size={13} /> Terverifikasi</span>
      <span className="organization-directory-mark">{organization.name?.slice(0, 1) || "O"}</span>
    </div>
    <div className="organization-directory-card-content">
      <div className="organization-directory-title">
        <div><h2>{organization.name}</h2><span><MapPin size={13} />{location}</span></div>
        <BadgeCheck size={18} aria-label="Organisasi terverifikasi" />
      </div>
      <p className="organization-directory-description">
        {organization.description || `Bergerak di bidang ${organization.focusCategory || "sosial dan kemanusiaan"} untuk mendukung masyarakat.`}
      </p>
      <div className="organization-directory-stats">
        <div><strong>{formatNumber(completedActions)}</strong><span>Aksi selesai</span></div>
        <div><strong>{formatNumber(volunteers)}</strong><span>Relawan</span></div>
        <div><strong><Star size={13} fill="currentColor" /> —</strong><span>Rating belum tersedia</span></div>
      </div>
      <div className="organization-directory-actions">
        <button type="button" className={`organization-follow-button${followed ? " is-followed" : ""}`}
          aria-pressed={followed} onClick={() => onToggleFollow(organization._id)}>
          {followed ? <Check size={14} /> : <Heart size={14} />}{followed ? "Diikuti" : "Ikuti"}
        </button>
        <Link className="organization-active-actions-button" to={`/jelajah?organization=${encodeURIComponent(organization._id)}`}>
          {activeActions} Aksi Aktif <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  </article>;
}

function PageControls({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pages) }, (_, index) => first + index);

  return <nav className="organization-directory-pagination" aria-label="Halaman direktori organisasi">
    <button type="button" aria-label="Sebelumnya" disabled={page === 1} onClick={() => onChange(page - 1)}><ArrowLeft size={15} /></button>
    {first > 1 && <><button type="button" onClick={() => onChange(1)}>1</button><span>…</span></>}
    {pageNumbers.map((number) => <button key={number} type="button"
      className={page === number ? "is-current" : ""} aria-current={page === number ? "page" : undefined}
      onClick={() => onChange(number)}>{number}</button>)}
    {first + pageNumbers.length - 1 < pages && <><span>…</span><button type="button" onClick={() => onChange(pages)}>{pages}</button></>}
    <button type="button" aria-label="Selanjutnya" disabled={page === pages} onClick={() => onChange(page + 1)}><ArrowRight size={15} /></button>
  </nav>;
}

export default function OrganizationDirectory() {
  const [params, setParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [summary, setSummary] = useState({ verifiedOrganizations: 0, legalRecords: 0, completedActions: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(params.get("search") || "");
  const [focus, setFocus] = useState(params.get("focus") || "");
  const [region, setRegion] = useState(params.get("region") || "");
  const [scale, setScale] = useState(params.get("scale") || "");
  const [legalOnly, setLegalOnly] = useState(params.get("legalRegistered") === "true");
  const [showFilters, setShowFilters] = useState(false);
  const [followedIds, setFollowedIds] = useState(() =>
    (localStorage.getItem("koordinaksi_followed_organizations") || "").split(",").filter(Boolean)
  );
  const page = Math.max(1, Number(params.get("page")) || 1);
  const selectedPill = focus || "Semua Fokus Bidang";

  useEffect(() => {
    setSearch(params.get("search") || "");
    setFocus(params.get("focus") || "");
    setRegion(params.get("region") || "");
    setScale(params.get("scale") || "");
    setLegalOnly(params.get("legalRegistered") === "true");
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(params);
    query.set("limit", String(pageSize));

    async function loadDirectory() {
      setLoading(true);
      try {
        const { data } = await api.get(`/organizations?${query.toString()}`, { signal: controller.signal });
        setOrganizations(data.organizations);
        setSummary(data.summary);
        setLeaderboard(data.leaderboard);
        setPagination(data.pagination);
        setError("");
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDirectory();
    return () => controller.abort();
  }, [params]);

  const legalCoverage = useMemo(() => summary.verifiedOrganizations
    ? Math.round((summary.legalRecords / summary.verifiedOrganizations) * 100)
    : 0, [summary]);

  function applyFilters(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("search", search.trim());
    if (focus) next.set("focus", focus);
    if (region) next.set("region", region);
    if (scale) next.set("scale", scale);
    if (legalOnly) next.set("legalRegistered", "true");
    next.set("page", "1");
    setParams(next);
  }

  function chooseFocus(value) {
    setFocus(value === "Semua Fokus Bidang" ? "" : value);
    const next = new URLSearchParams(params);
    if (value === "Semua Fokus Bidang") next.delete("focus");
    else next.set("focus", value);
    next.set("page", "1");
    setParams(next);
  }

  function resetFilters() {
    setSearch("");
    setFocus("");
    setRegion("");
    setScale("");
    setLegalOnly(false);
    setParams({ page: "1" });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFollow(id) {
    setFollowedIds((current) => {
      const updated = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      localStorage.setItem("koordinaksi_followed_organizations", updated.join(","));
      return updated;
    });
  }

  return <main className="organization-directory-page">
    <HeroSection
      className="organization-directory-hero"
      eyebrow="Mitra terpercaya KoordinAksi"
      title="Jelajah Organisasi & Lembaga Penggerak"
      subtitle="Temukan yayasan, komunitas independen, dan lembaga kemanusiaan terverifikasi yang menggerakkan perubahan di berbagai wilayah Indonesia."
    >
      <div className="organization-directory-hero-stats">
        <span><strong>{formatNumber(summary.verifiedOrganizations)}+</strong> Lembaga Terverifikasi</span>
        <span><strong>{formatNumber(summary.completedActions)}+</strong> Aksi terlaksana</span>
        <span><strong>{legalCoverage}%</strong> Memiliki data legalitas</span>
      </div>
    </HeroSection>

    <div className="container organization-directory-main">
      <form className="organization-directory-filters" role="search" onSubmit={applyFilters}>
        <label className="organization-directory-search">
          <Search size={17} aria-hidden="true" /><span className="visually-hidden">Cari organisasi</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama organisasi, yayasan, atau kota..." />
        </label>
        <label><span className="visually-hidden">Fokus bidang</span><select value={focus} onChange={(event) => setFocus(event.target.value)}>
          <option value="">Semua Fokus Bidang</option>{focusOptions.map((option) => <option key={option}>{option}</option>)}
        </select></label>
        <label><span className="visually-hidden">Wilayah</span><select value={region} onChange={(event) => setRegion(event.target.value)}>
          <option value="">Semua Wilayah</option>{regions.map((option) => <option key={option}>{option}</option>)}
        </select></label>
        <label><span className="visually-hidden">Skala organisasi</span><select value={scale} onChange={(event) => setScale(event.target.value)}>
          <option value="">Semua Skala</option><option value="local">Lokal · &lt;50 relawan</option>
          <option value="growing">Berkembang · 50–199 relawan</option><option value="national">Nasional · 200+ relawan</option>
        </select></label>
        <button className="organization-directory-submit" type="submit">Tampilkan</button>
        <button className="organization-directory-reset" type="button" onClick={resetFilters}>Reset</button>
      </form>

      <div className="organization-directory-pills" aria-label="Filter fokus bidang">
        {focusPills.map((item) => <button key={item} type="button"
          className={selectedPill === item ? "is-active" : ""} aria-pressed={selectedPill === item}
          onClick={() => chooseFocus(item)}>{item}</button>)}
      </div>

      <div className="organization-directory-tools">
        <span>{loading ? "Memuat lembaga…" : `Menampilkan ${organizations.length} dari ${formatNumber(pagination.total)} lembaga`}</span>
        <div>
          <button type="button" className="organization-filter-toggle" aria-expanded={showFilters}
            onClick={() => setShowFilters((visible) => !visible)}>Tampilkan Filter</button>
          <button type="button" className="organization-directory-submit" onClick={applyFilters}>Tampilkan</button>
          <button type="button" className="organization-directory-reset" onClick={resetFilters}>Reset</button>
        </div>
      </div>
      {showFilters && <label className="organization-legal-filter">
        <input type="checkbox" checked={legalOnly} onChange={(event) => setLegalOnly(event.target.checked)} />
        <span className="organization-legal-switch" aria-hidden="true" />
        <ShieldCheck size={16} aria-hidden="true" /> Hanya lembaga dengan nomor legalitas tercatat
      </label>}
      {error && <div className="organization-directory-error" role="alert">
        <span>{error}</span><button type="button" onClick={applyFilters}>Coba lagi</button>
      </div>}

      <section className="organization-directory-grid" aria-label="Direktori organisasi">
        {loading && !organizations.length
          ? <div className="organization-directory-state" role="status">Memuat organisasi terverifikasi…</div>
          : organizations.map((organization) => <OrganizationCard
            key={organization._id} organization={organization}
            followed={followedIds.includes(organization._id)} onToggleFollow={toggleFollow}
          />)}
      </section>
      {!loading && !error && !organizations.length && <div className="organization-directory-state">
        <Building2 size={26} /><h2>Belum ada lembaga yang cocok</h2>
        <p>Coba ubah kata kunci atau filter pencarian.</p><button type="button" onClick={resetFilters}>Hapus filter</button>
      </div>}

      <PageControls page={page} pages={pagination.pages} onChange={changePage} />

      <section className="organization-directory-bottom" aria-label="Informasi kemitraan">
        <article className="organization-directory-cta">
          <span>Mulai bergerak bersama</span><h2>Punya Komunitas atau Inisiatif Aksi?</h2>
          <p>Daftarkan lembagamu untuk terhubung dengan relawan dan memperluas dampak.</p>
          <Link to="/organisasi/pendaftaran">Registrasi Lembaga Baru <ArrowUpRight size={15} /></Link>
        </article>
        <article className="organization-directory-bottom-panel">
          <span className="eyebrow">Performa bulan ini</span><h2>Lembaga Teraktif</h2>
          {leaderboard.length
            ? <ol>{leaderboard.map((organization, index) => <li key={organization._id}>
              <span>{index + 1}</span><strong>{organization.name}</strong>
              <small>{formatNumber(organization.score)} aksi</small>
            </li>)}</ol>
            : <p className="organization-directory-muted">Data performa belum tersedia.</p>}
        </article>
        <article className="organization-directory-bottom-panel">
          <span className="eyebrow">Panduan kemitraan</span><h2>Standar Integritas Mitra</h2>
          <ul className="organization-integrity-list">
            <li><Check size={15} /> Lengkapi dokumen legalitas lembaga untuk proses peninjauan.</li>
            <li><Check size={15} /> Gunakan rekening atas nama lembaga untuk transparansi dana.</li>
            <li><Check size={15} /> Siapkan SOP keselamatan dan perlindungan relawan di lapangan.</li>
          </ul>
          <p className="organization-directory-muted">Panduan ini mendukung kemitraan yang aman dan akuntabel.</p>
        </article>
      </section>
    </div>
  </main>;
}
