import React, { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "./api";
import { useAuth } from "@/AuthContext";

const categories = ["Donor Darah", "Bantuan Bencana", "Bakti Sosial", "Penghijauan", "Pendidikan", "Kesehatan", "Lainnya"];
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <header className="site-header">
    <div className="container nav-wrap">
      <Link className="brand" to="/"><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <nav>
        <NavLink to="/kegiatan">Kegiatan</NavLink>
        <a href="/#tentang">Tentang</a>
        {user && <NavLink to={user.role === "organization" ? "/dashboard/organisasi" : "/dashboard/relawan"}>Dashboard</NavLink>}
      </nav>
      <div className="nav-actions">
        {user ? <><span className="user-greeting">Hai, {user.name.split(" ")[0]}</span><button className="button button-small button-ghost" onClick={() => { logout(); navigate("/"); }}>Keluar</button></>
          : <><Link className="login-link" to="/login">Masuk</Link><Link className="button button-small" to="/register">Mulai Bergabung</Link></>}
      </div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="footer"><div className="container footer-row"><Link className="brand" to="/"><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link><p>Ruang bertemu untuk setiap niat baik.</p><small>© {new Date().getFullYear()} KoordinAksi</small></div></footer>;
}

function Layout() {
  return <><Header /><main className="main-content"><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/kegiatan" element={<ActivityList />} />
    <Route path="/kegiatan/:id" element={<ActivityDetail />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/dashboard/relawan" element={<Protected roles={["volunteer"]}><VolunteerDashboard /></Protected>} />
    <Route path="/dashboard/organisasi" element={<Protected roles={["organization", "admin"]}><OrganizationDashboard /></Protected>} />
    <Route path="*" element={<NotFound />} />
  </Routes></main><Footer /></>;
}

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container page-space"><p>Memuat sesi...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === "organization" ? "/dashboard/organisasi" : "/dashboard/relawan"} replace />;
  return children;
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
        : <Link className="button full-width" to={user ? "/dashboard/organisasi" : "/login"}>{user ? "Masuk ke dashboard" : "Masuk untuk mendaftar"} <span>→</span></Link>}
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
      navigate(user.role === "organization" || user.role === "admin" ? "/dashboard/organisasi" : "/dashboard/relawan");
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

function VolunteerDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/registrations/mine").then(({ data }) => setRegistrations(data.registrations)).catch((err) => setError(getErrorMessage(err))); }, []);
  return <section className="container page-space"><div className="dashboard-heading"><div><span className="eyebrow">Ruang relawan</span><h1>Halo, {user.name.split(" ")[0]}.</h1><p>Perjalanan kecilmu berarti. Berikut aktivitas relawanmu.</p></div><Link className="button" to="/kegiatan">Cari kegiatan <span>→</span></Link></div>{error && <Notice message={error} />}<h2 className="dashboard-section-title">Riwayat pendaftaran <span>{registrations.length}</span></h2><div className="registration-list">{registrations.map((item) => <article className="registration-row" key={item._id}><div className="registration-date">{item.activity ? new Date(item.activity.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "—"}</div><div className="registration-info"><strong>{item.activity?.title || "Kegiatan telah dihapus"}</strong><span>{item.activity?.organization?.name || "Organisasi"} · {item.activity?.location}</span></div><StatusBadge status={item.status} />{item.activity && <Link className="row-arrow" to={`/kegiatan/${item.activity._id}`}>↗</Link>}</article>)}{!registrations.length && !error && <div className="empty-box"><span>♡</span><h3>Belum ada pendaftaran</h3><p>Temukan kegiatan pertama yang ingin kamu ikuti.</p><Link className="text-link" to="/kegiatan">Jelajahi kegiatan →</Link></div>}</div></section>;
}

function OrganizationDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [registrations, setRegistrations] = useState({});
  const [form, setForm] = useState({ title: "", description: "", category: categories[0], location: "", date: "", capacity: 10 });
  const canCreateActivity = user.role === "organization" && user.organization?.verified === true;
  async function loadActivities() {
    try {
      const { data } = await api.get("/activities/mine");
      setActivities(data.activities);
      const results = await Promise.all(data.activities.map(async (activity) => {
        const result = await api.get(`/registrations/activity/${activity._id}`);
        return [activity._id, result.data.registrations];
      }));
      setRegistrations(Object.fromEntries(results));
      setError("");
    } catch (err) { setError(getErrorMessage(err)); }
  }
  useEffect(() => { loadActivities(); }, []);
  async function createActivity(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/activities", { ...form, date: new Date(form.date).toISOString(), capacity: Number(form.capacity) });
      setSuccess("Kegiatan berhasil dipublikasikan.");
      setError("");
      setShowForm(false);
      setForm({ title: "", description: "", category: categories[0], location: "", date: "", capacity: 10 });
      await loadActivities();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setCreating(false); }
  }
  async function updateStatus(id, status) {
    try {
      await api.patch(`/registrations/${id}/status`, { status });
      await loadActivities();
      setSuccess("Status pendaftaran berhasil diperbarui.");
    } catch (err) { setError(getErrorMessage(err)); }
  }
  async function cancelActivity(id) {
    try {
      await api.delete(`/activities/${id}`);
      await loadActivities();
      setSuccess("Kegiatan berhasil dibatalkan.");
    } catch (err) { setError(getErrorMessage(err)); }
  }
  return <section className="container page-space"><div className="dashboard-heading"><div><span className="eyebrow">Ruang organisasi</span><h1>Kelola aksi sosialmu.</h1><p>Publikasikan kegiatan dan koordinasikan para relawan.</p></div>{canCreateActivity && <button className="button" onClick={() => setShowForm(!showForm)}>{showForm ? "Tutup form" : "+ Buat kegiatan"}</button>}</div>
    {!canCreateActivity && user.role === "organization" && <Notice message="Fitur publikasi kegiatan tersedia setelah organisasi terverifikasi oleh admin." />}
    {success && <Notice success message={success} />}{error && <Notice message={error} />}
    {showForm && canCreateActivity && <form className="activity-form" onSubmit={createActivity}><span className="eyebrow">Kegiatan baru</span><h2>Bagikan kesempatan berbuat baik.</h2><div className="form-grid"><label>Nama kegiatan<input required maxLength="160" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Lokasi<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kota atau alamat" /></label><label>Tanggal dan waktu<input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Kuota relawan<input required type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label><label className="wide-field">Deskripsi<textarea required rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div><button className="button" disabled={creating}>{creating ? "Menerbitkan..." : "Publikasikan kegiatan"} {!creating && <span>→</span>}</button></form>}
    <h2 className="dashboard-section-title">Kegiatan yang dikelola <span>{activities.length}</span></h2>
    {activities.map((activity) => <article className="managed-activity" key={activity._id}><div className="managed-heading"><div><span className="category-label">{activity.category}</span><h3>{activity.title}</h3><p>{formatDate(activity.date)} · {activity.location} · Kuota {activity.capacity}</p></div><button className="button button-ghost button-small" onClick={() => cancelActivity(activity._id)}>Batalkan</button></div><div className="applicant-list">{(registrations[activity._id] || []).map((registration) => <div className="applicant-row" key={registration._id}><span className="org-avatar">{registration.volunteer?.name?.charAt(0) || "R"}</span><div><strong>{registration.volunteer?.name}</strong><small>{registration.volunteer?.email}</small></div><StatusBadge status={registration.status} />{registration.status === "pending" && <><button className="approve-button" onClick={() => updateStatus(registration._id, "approved")}>Terima</button><button className="reject-button" onClick={() => updateStatus(registration._id, "rejected")}>Tolak</button></>}</div>)}{!registrations[activity._id]?.length && <p className="muted">Belum ada relawan yang mendaftar.</p>}</div></article>)}
    {!activities.length && !error && <div className="empty-box"><h3>Belum ada kegiatan</h3><p>Buat kegiatan pertama untuk mulai mengajak relawan.</p></div>}
  </section>;
}

function StatusBadge({ status }) {
  const labels = { pending: "Menunggu", approved: "Diterima", rejected: "Ditolak", attended: "Hadir", cancelled: "Dibatalkan" };
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>;
}

function Notice({ message, success = false }) {
  return <div className={`notice ${success ? "notice-success" : ""}`} role="status">{message}</div>;
}

function NotFound() {
  return <div className="container page-space not-found"><span className="eyebrow">404 · Halaman tidak ditemukan</span><h1>Sepertinya jalan ini<br /><em>belum tersedia.</em></h1><Link className="button" to="/">Kembali ke beranda →</Link></div>;
}

export default function App() {
  return <Layout />;
}
