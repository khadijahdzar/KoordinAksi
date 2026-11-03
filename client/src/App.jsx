import React, { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "./api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import AdminDashboard, { AdminLayout } from "./AdminDashboard";
import AdminOrganizations from "./AdminOrganizations";
import AdminSystem from "./AdminSystem";
import VolunteerLayout from "./volunteer/VolunteerLayout";
import VolunteerDashboard from "./volunteer/VolunteerDashboard";
import RegistrationHistory from "./volunteer/RegistrationHistory";
import VolunteerProfile from "./volunteer/VolunteerProfile";
import OrganizationLayout from "./organization/OrganizationLayout";
import OrganizationDashboard from "./organization/OrganizationDashboard";
import ActivityParticipants from "./organization/ActivityParticipants";

const categories = ["Donor Darah", "Bantuan Bencana", "Bakti Sosial", "Penghijauan", "Pendidikan", "Kesehatan", "Lainnya"];
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const homePath = user ? getDashboardPath(user.role) : "/";
  return <header className="site-header">
    <div className="container nav-wrap">
      <Link className="brand" to={homePath}><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <nav>
        <NavLink to="/kegiatan">Kegiatan</NavLink>
        <a href="/#tentang">Tentang</a>
        {user && <NavLink to={homePath}>Dashboard</NavLink>}
      </nav>
      <div className="nav-actions">
        {user ? <><span className="user-greeting">Hai, {user.name.split(" ")[0]}</span><button className="button button-small button-ghost" onClick={() => { logout(); navigate("/"); }}>Keluar</button></>
          : <><Link className="login-link" to="/login">Masuk</Link><Link className="button button-small" to="/register">Mulai Bergabung</Link></>}
      </div>
    </div>
  </header>;
}

function Footer() {
  const { user } = useAuth();
  return <footer className="footer"><div className="container footer-row"><Link className="brand" to={user ? getDashboardPath(user.role) : "/"}><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link><p>Ruang bertemu untuk setiap niat baik.</p><small>© {new Date().getFullYear()} KoordinAksi</small></div></footer>;
}

function PublicLayout() {
  return <><Header /><SessionRecoveryNotice /><main className="main-content"><Outlet /></main><Footer /></>;
}

function SessionRecoveryNotice() {
  const { sessionError, refreshSession } = useAuth();
  if (!sessionError) return null;
  return <div className="container session-recovery" role="status">
    <span>{sessionError}</span>
    <button className="button button-small button-ghost" onClick={refreshSession}>Coba lagi</button>
  </div>;
}

function ProtectedRoute({ roles }) {
  const { user, loading, sessionError } = useAuth();
  if (loading) return <div className="container page-space"><p>Memuat sesi...</p></div>;
  if (sessionError && !user) return <SessionRecoveryNotice />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />;
  return <Outlet />;
}

function ProtectedAdminRoute() {
  const { user, loading, sessionError } = useAuth();
  if (loading) return <div className="container page-space"><p>Memuat sesi...</p></div>;
  if (sessionError && !user) return <SessionRecoveryNotice />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to={getDashboardPath(user.role)} replace />;
  return <Outlet />;
}

function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/kegiatan" element={<ActivityList />} />
      <Route path="/kegiatan/:id" element={<ActivityDetail />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
    </Route>
    <Route element={<ProtectedRoute roles={["volunteer"]} />}>
      <Route path="/dashboard/relawan" element={<VolunteerLayout />}>
        <Route index element={<VolunteerDashboard />} />
        <Route path="history" element={<RegistrationHistory />} />
        <Route path="profile" element={<VolunteerProfile />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={["organization"]} />}>
      <Route path="/dashboard/organisasi" element={<OrganizationLayout />}>
        <Route index element={<OrganizationDashboard />} />
        <Route path="activities/:id/participants" element={<ActivityParticipants />} />
      </Route>
    </Route>
    <Route path="/admin" element={<ProtectedAdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="organizations/pending" element={<AdminOrganizations />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
    <Route path="*" element={<PublicLayout />}>
      <Route index element={<NotFound />} />
    </Route>
  </Routes>;
}

function Home() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/activities/stats"), api.get("/activities?limit=3")])
      .then(([statsResult, activityResult]) => {
        setStats(statsResult.data);
        setActivities(activityResult.data.activities);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><span className="eyebrow"><span className="pulse" /> Platform aksi sosial Indonesia</span>
        <h1>Kebaikan kecil,<br /><em>dampak besar.</em></h1>
        <p>Temukan kegiatan sosial yang berarti bagimu. Terhubung dengan organisasi terpercaya dan bergerak bersama untuk Indonesia yang lebih baik.</p>
        <div className="hero-actions"><Link className="button" to="/kegiatan">Jelajahi kegiatan <span>↗</span></Link><Link className="text-link" to="/register">Saya mengelola organisasi <span>→</span></Link></div>
        <div className="hero-note"><div className="avatar-stack"><i>R</i><i>A</i><i>D</i><i>+</i></div><span>Bergabung bersama komunitas penuh kepedulian</span></div>
      </div>
      <div className="hero-art" aria-label="Ilustrasi kegiatan relawan"><div className="art-sun" /><div className="art-circle"><span>♧</span></div><div className="art-card card-top"><b>01</b><span>mulai dari sekitar</span></div><div className="art-card card-bottom"><strong>Ruang untuk<br />berbuat baik.</strong><span>Temukan aksi yang tepat untukmu ↗</span></div><div className="art-leaf">✳</div></div>
    </div></section>
    <section className="stats-strip"><div className="container stats-grid">
      <Stat value={stats?.volunteers} label="Relawan bergabung" /><Stat value={stats?.organizations} label="Organisasi terverifikasi" /><Stat value={stats?.activities} label="Aksi terbuka" /><Stat value={stats?.registrations} label="Partisipasi tercatat" />
    </div></section>
    <section className="section container"><div className="section-heading"><div><span className="eyebrow">Pilih cara berkontribusi</span><h2>Satu kepedulian,<br />banyak kemungkinan.</h2></div><Link to="/kegiatan" className="text-link">Lihat semua kegiatan <span>→</span></Link></div>
      <div className="category-grid">{categories.slice(0, 6).map((category, index) => <Link className={`category-tile tile-${index}`} key={category} to={`/kegiatan?category=${encodeURIComponent(category)}`}><span>{["♡", "⌂", "✳", "♧", "▤", "＋"][index]}</span><strong>{category}</strong><small>Jadi bagian dari perubahan</small><b>↗</b></Link>)}</div>
    </section>
    <section className="section featured-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Kesempatan untuk berbuat baik</span><h2>Kegiatan pilihan</h2></div><Link to="/kegiatan" className="text-link">Jelajahi semua <span>→</span></Link></div>
      {error && <Notice message={error} />}
      <div className="activity-grid">{activities.map((activity) => <ActivityCard key={activity._id} activity={activity} />)}</div>
      {!activities.length && !error && <p className="empty-state">Belum ada kegiatan tersedia. Coba kembali nanti.</p>}
    </div></section>
    <section className="callout"><div className="container callout-inner"><div><span className="eyebrow">Untuk organisasi sosial</span><h2>Setiap aksi lebih kuat<br />saat dilakukan bersama.</h2><p>Kelola relawan, publikasi kegiatan, dan perluas dampak organisasimu.</p></div><Link className="button button-light" to="/register">Daftarkan organisasi <span>↗</span></Link></div></section>
  </>;
}

function Stat({ value, label }) {
  return <div className="stat"><strong>{value == null ? "—" : Number(value).toLocaleString("id-ID")}<span>+</span></strong><small>{label}</small></div>;
}

function ActivityCard({ activity }) {
  return <article className="activity-card"><div className="activity-visual"><span className="category-label">{activity.category}</span><span className="visual-symbol">{activity.category === "Penghijauan" ? "♧" : activity.category === "Donor Darah" ? "♡" : "✳"}</span><span className="visual-index">AKSI SOSIAL&nbsp; / &nbsp;{String(activity._id).slice(-4).toUpperCase()}</span></div>
    <div className="activity-card-body"><div className="card-meta"><span>◷ {formatDate(activity.date)}</span><span>⌖ {activity.location}</span></div><h3><Link to={`/kegiatan/${activity._id}`}>{activity.title}</Link></h3><div className="card-bottom"><span>{activity.organization?.name || "Organisasi"}</span><Link aria-label={`Lihat ${activity.title}`} to={`/kegiatan/${activity._id}`}>↗</Link></div></div>
  </article>;
}

function ActivityList() {
  const [params, setParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (category) query.set("category", category);
    if (location.trim()) query.set("location", location.trim());
    setParams(query, { replace: true });
    api.get(`/activities?${query}`).then(({ data }) => {
      setActivities(data.activities);
      setError("");
    }).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, [search, category, location, setParams]);
  return <section className="container page-space"><div className="page-intro"><span className="eyebrow">Temukan kegiatan</span><h1>Mulai dari langkah<br /><em>yang berarti.</em></h1><p>Temukan ruang untuk menyumbangkan waktu, tenaga, dan perhatianmu.</p></div>
    <div className="filter-panel"><label className="search-field"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kegiatan atau kata kunci" /></label><label><span>Kategori</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Semua kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Lokasi</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Bandung" /></label></div>
    {error && <Notice message={error} />}
    <div className="results-heading"><h2>{loading ? "Memuat kegiatan..." : `${activities.length} kegiatan ditemukan`}</h2></div>
    <div className="activity-grid">{activities.map((activity) => <ActivityCard key={activity._id} activity={activity} />)}</div>
    {!loading && activities.length === 0 && !error && <p className="empty-state">Belum ada kegiatan yang cocok dengan filter ini.</p>}
  </section>;
}

function ActivityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  useEffect(() => {
    api.get(`/activities/${id}`).then(({ data }) => setActivity(data.activity))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);
  async function register(event) {
    event.preventDefault();
    if (!user) return navigate("/login");
    setRegistering(true);
    setError("");
    setMessage("");
    try {
      await api.post("/registrations", { activityId: id, note });
      setMessage("Pendaftaran berhasil dikirim. Organisasi akan meninjau permohonanmu.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  }
  if (error && !activity) return <div className="container page-space"><Notice message={error} /></div>;
  if (!activity) return <div className="container page-space"><p>Memuat kegiatan...</p></div>;
  return <section className="container page-space detail-layout"><div><Link className="back-link" to="/kegiatan">← Kembali ke kegiatan</Link><div className="detail-visual"><span>{activity.category}</span><strong>Jadilah bagian<br />dari perubahan.</strong></div><span className="eyebrow">{activity.category}</span><h1 className="detail-title">{activity.title}</h1><div className="detail-meta"><span>◷ {formatDate(activity.date)}</span><span>⌖ {activity.location}</span><span>◉ {activity.capacity} relawan</span></div><h2>Tentang kegiatan</h2><p className="long-copy">{activity.description}</p><div className="organization-note"><span className="org-avatar">{activity.organization?.name?.charAt(0) || "O"}</span><div><small>Diselenggarakan oleh</small><strong>{activity.organization?.name}</strong></div>{activity.organization?.verified && <span className="verified">✓ Terverifikasi</span>}</div></div>
    <aside className="register-panel"><span className="eyebrow">Ambil bagian</span><h2>Waktumu berarti.</h2><p>Daftar sebagai relawan dan tunggu konfirmasi dari penyelenggara.</p>{message && <Notice success message={message} />}{error && <Notice message={error} />}
      {user?.role === "volunteer" ? <form onSubmit={register}><label>Pesan untuk penyelenggara <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" placeholder="Ceritakan sedikit tentang motivasimu (opsional)" /></label><button className="button full-width" disabled={registering}>{registering ? "Mengirim..." : "Daftar sebagai relawan"} {!registering && <span>→</span>}</button></form>
        : <Link className="button full-width" to={user ? getDashboardPath(user.role) : "/login"}>{user ? "Masuk ke dashboard" : "Masuk untuk mendaftar"} <span>→</span></Link>}
    </aside></section>;
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer", organizationName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = isRegister
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return <section className="auth-layout"><div className="auth-aside"><span className="eyebrow">KoordinAksi</span><h1>{isRegister ? "Kebaikan dimulai dari sini." : "Senang melihatmu kembali."}</h1><p>{isRegister ? "Buat akun dan temukan cara sederhana untuk membuat perubahan." : "Lanjutkan perjalananmu dalam membuat dampak yang berarti."}</p><div className="auth-decoration">✳</div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">{isRegister ? "Buat akun baru" : "Selamat datang kembali"}</span><h2>{isRegister ? "Bergabung dengan kami" : "Masuk ke akunmu"}</h2><p>{isRegister ? "Isi informasi berikut untuk memulai." : "Masukkan email dan password untuk melanjutkan."}</p>
      {error && <Notice message={error} />}
      {isRegister && <><label>Nama lengkap<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kamu" /></label><label>Daftar sebagai<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="volunteer">Relawan</option><option value="organization">Organisasi</option></select></label>{form.role === "organization" && <label>Nama organisasi<input required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} placeholder="Nama organisasi sosial" /></label>}</>}
      <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" /></label><button className="button full-width" disabled={busy}>{busy ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"} <span>→</span></button>
      <small className="auth-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar sekarang"}</Link></small>
    </form></div></section>;
}

function Notice({ message, success = false }) {
  return <div className={`notice ${success ? "notice-success" : ""}`} role="status">{message}</div>;
}

function NotFound() {
  return <div className="container page-space not-found"><span className="eyebrow">404 · Halaman tidak ditemukan</span><h1>Sepertinya jalan ini<br /><em>belum tersedia.</em></h1><Link className="button" to="/">Kembali ke beranda →</Link></div>;
}

export default function App() {
  return <AppRoutes />;
}
