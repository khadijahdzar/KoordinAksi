import React, { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "./api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import ActivityList from "./public/ActivityList";
import { AdminLayout } from "./AdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminActivityList from "./pages/admin/AdminActivityList";
import AdminVolunteerDatabase from "./pages/admin/AdminVolunteerDatabase";
import AdminOrganizations from "./AdminOrganizations";
import AdminSystem from "./AdminSystem";
import VolunteerLayout from "./volunteer/VolunteerLayout";
import VolunteerDashboard from "./volunteer/VolunteerDashboard";
import RegistrationHistory from "./volunteer/RegistrationHistory";
import VolunteerProfile from "./volunteer/VolunteerProfile";
import VolunteerFeed from "./volunteer/VolunteerFeed";
import OrganizationLayout from "./organization/OrganizationLayout";
import OrganizationDashboard from "./organization/OrganizationDashboard";
import ActivityParticipants from "./organization/ActivityParticipants";
import VolunteerVerification from "./organization/VolunteerVerification";
import OrganizationImpactReport from "./organization/OrganizationImpactReport";

const categories = ["Donor Darah", "Bantuan Bencana", "Bakti Sosial", "Penghijauan", "Pendidikan", "Kesehatan", "Lainnya"];
const volunteerInterests = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Medis & PKS", "Tanggap Bencana", "Logistik", "Dokumen & Media"];
const organizationFocusCategories = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Kesehatan & Medis", "Tanggap Bencana", "Pemberdayaan Masyarakat", "Sosial & Kemanusiaan", "Lainnya"];
const organizationDocumentTypes = [
  { key: "skDocument", title: "SK Kemenkumham", detail: "Surat keputusan pengesahan atau akta notaris", icon: "▤" },
  { key: "taxDocument", title: "NPWP Lembaga", detail: "Kartu atau surat keterangan NPWP lembaga", icon: "▣" }
];
const organizationRegistrationDraftKey = "koordinaksi_organization_verification_draft";
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const homePath = user ? getDashboardPath(user.role) : "/";
  return <header className="site-header">
    <div className="container nav-wrap">
      <Link className="brand" to={homePath}><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <nav>
        <NavLink to="/kegiatan">Jelajah</NavLink>
        <Link to="/register/organization">Organisasi</Link>
        <Link to="/#kegiatan-unggulan">Kabar Aksi</Link>
        {user && <NavLink to={homePath}>Dashboard</NavLink>}
      </nav>
      <div className="nav-actions">
        {user ? <>{user.role === "volunteer" && <Link className="registered-actions-link" to="/dashboard/relawan/history">Aksi Terdaftar</Link>}<Link className="header-avatar" to={homePath} aria-label={`Profil ${user.name}`}>{user.name.charAt(0).toUpperCase()}</Link><button className="button button-small button-ghost" onClick={() => { logout(); navigate("/"); }}>Keluar</button></>
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
    <Route path="/register" element={<RegistrationRolePage />} />
    <Route path="/register/volunteer" element={<VolunteerRegistration />} />
    <Route path="/register/organization" element={<OrganizationVerification />} />
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/kegiatan" element={<ActivityList />} />
      <Route path="/kegiatan/:id" element={<ActivityDetail />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
    </Route>
    <Route element={<ProtectedRoute roles={["volunteer"]} />}>
      <Route path="/dashboard/relawan" element={<VolunteerLayout />}>
        <Route index element={<VolunteerDashboard />} />
        <Route path="history" element={<RegistrationHistory />} />
        <Route path="profile" element={<VolunteerProfile />} />
        <Route path="feed" element={<VolunteerFeed />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={["organization"]} />}>
      <Route path="/dashboard/organisasi" element={<OrganizationLayout />}>
        <Route index element={<OrganizationDashboard />} />
        <Route path="activities/:id/participants" element={<ActivityParticipants />} />
        <Route path="volunteers" element={<VolunteerVerification />} />
        <Route path="impact" element={<OrganizationImpactReport />} />
      </Route>
    </Route>
    <Route path="/admin" element={<ProtectedAdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="activities" element={<AdminActivityList />} />
        <Route path="volunteers" element={<AdminVolunteerDatabase />} />
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
    <section id="kegiatan-unggulan" className="section featured-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Kesempatan untuk berbuat baik</span><h2>Kegiatan pilihan</h2></div><Link to="/kegiatan" className="text-link">Jelajahi semua <span>→</span></Link></div>
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

function RegistrationRolePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pilih Peran Pendaftaran - KoordinAksi";
    return () => { document.title = previousTitle; };
  }, []);

  const roles = [
    {
      name: "Volunteer",
      title: "Daftar sebagai Volunteer",
      icon: "♡",
      description: "Jadilah bagian dari aksi nyata dan salurkan kepedulianmu.",
      benefits: ["Temukan kegiatan yang sesuai minatmu", "Terhubung dengan organisasi terpercaya", "Catat kontribusi dan pengalamanmu"],
      estimate: "~2 menit",
      action: "Pilih Volunteer",
      role: "volunteer"
    },
    {
      name: "Organisasi",
      title: "Daftar sebagai Organisasi",
      icon: "▤",
      description: "Wujudkan lebih banyak kebaikan bersama komunitasmu.",
      benefits: ["Kelola kegiatan sosial dengan mudah", "Temukan relawan yang siap membantu", "Pantau pendaftaran dalam satu tempat"],
      estimate: "~5 menit",
      action: "Pilih Organisasi",
      role: "organization"
    }
  ];

  return <main className="registration-choice-page">
    <div className="registration-choice-backdrop" aria-hidden="true" />
    <section className="registration-choice-card" aria-labelledby="registration-choice-title">
      <div className="registration-choice-brand"><span className="brand-mark">K</span><span>Koordin<span>Aksi</span></span></div>
      <header className="registration-choice-heading">
        <span className="eyebrow">Langkah baik dimulai di sini</span>
        <h1 id="registration-choice-title">Mulai Langkah Baikmu<br />Bersama KoordinAksi</h1>
        <p>Pilih peran yang paling sesuai untukmu dan mari ciptakan dampak bersama.</p>
      </header>

      <div className="registration-role-grid">
        {roles.map((item) => <article className={`registration-role-card registration-role-${item.role}`} key={item.role}>
          <div className="registration-role-icon" aria-hidden="true">{item.icon}</div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <span className="registration-role-estimate">⏱ Estimasi: {item.estimate}</span>
          <ul>{item.benefits.map((benefit) => <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>)}</ul>
          <Link className="button registration-role-button" to={`/register/${item.role}`}>{item.action}<span aria-hidden="true">→</span></Link>
        </article>)}
      </div>

      <div className="registration-choice-stats" aria-label="Dampak KoordinAksi">
        <div><strong>45.200<span>+</span></strong><small>Relawan Aktif</small></div>
        <div><strong>2.450<span>+</span></strong><small>Aksi Terlaksana</small></div>
        <div><strong>34</strong><small>Provinsi</small></div>
      </div>
      <p className="registration-choice-login">Sudah memiliki akun? <Link to="/login">Masuk Sekarang <span aria-hidden="true">→</span></Link></p>
    </section>
  </main>;
}

function VolunteerRegistration() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    interests: [],
    email: "",
    password: "",
    role: "volunteer",
    acceptedTerms: false
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [googleMessage, setGoogleMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pendaftaran Relawan - KoordinAksi";
    return () => { document.title = previousTitle; };
  }, []);

  function toggleInterest(interest) {
    setFieldErrors((current) => ({ ...current, interests: "" }));
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest]
    }));
  }

  function validateVolunteerForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = "Masukkan nama lengkap.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) errors.phone = "Masukkan nomor WhatsApp yang aktif.";
    else if (!/^[+\d\s().-]+$/.test(form.phone.trim())) errors.phone = "Gunakan hanya angka, spasi, tanda +, tanda kurung, atau tanda hubung.";
    else if (phoneDigits.length < 8 || phoneDigits.length > 15) errors.phone = "Masukkan nomor dengan 8–15 digit, termasuk kode negara bila ada.";
    if (!form.city.trim()) errors.city = "Masukkan kota atau kabupaten domisili.";
    if (!form.email.trim()) errors.email = "Masukkan alamat email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Periksa kembali format alamat email.";
    if (!form.password) errors.password = "Buat password untuk akunmu.";
    else if (form.password.length < 8) errors.password = "Password harus terdiri dari minimal 8 karakter.";
    if (!form.interests.length) errors.interests = "Pilih minimal satu minat atau keahlian relawan.";
    if (!form.acceptedTerms) errors.acceptedTerms = "Persetujuan diperlukan untuk membuat akun.";
    return errors;
  }

  function updateVolunteerField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const errors = validateVolunteerForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("");
      focusFirstInvalidField();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await register(form);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length) {
        setFieldErrors((current) => ({
          ...current,
          ...Object.fromEntries(validationErrors.map(({ field, message }) => [field, message]))
        }));
        setError("");
        focusFirstInvalidField();
      } else if (err.response?.status === 409) {
        setFieldErrors((current) => ({ ...current, email: getErrorMessage(err) }));
        setError("");
        focusFirstInvalidField();
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return <main className="volunteer-signup-page">
    <div className="volunteer-signup-backdrop" aria-hidden="true" />
    <section className="volunteer-signup-card" aria-labelledby="volunteer-signup-title">
      <Link className="volunteer-signup-brand" to="/"><span className="brand-mark">K</span><span>Koordin<span>Aksi</span></span></Link>
      <header className="volunteer-signup-heading">
        <span className="eyebrow">Satu langkah menuju aksi nyata</span>
        <h1 id="volunteer-signup-title">Pendaftaran Relawan KoordinAksi</h1>
        <p>Lengkapi data singkatmu untuk mulai terhubung dengan berbagai aksi kebaikan.</p>
      </header>

      <button className="volunteer-google-button" type="button" onClick={() => setGoogleMessage("Pendaftaran dengan Google belum tersedia. Silakan lanjutkan menggunakan formulir ini.")}>
        <span className="volunteer-google-mark" aria-hidden="true">G</span>
        Lanjutkan dengan Google
      </button>
      {googleMessage && <p className="volunteer-google-message" role="status">{googleMessage}</p>}
      <div className="volunteer-signup-divider"><span>atau daftar dengan email</span></div>

      <form className="volunteer-signup-form" noValidate onSubmit={submit}>
        {error && <Notice message={error} />}
        <div className="volunteer-signup-fields volunteer-signup-two-col">
          <label>Nama Lengkap<input aria-describedby={fieldErrors.name ? "volunteer-name-error" : undefined} aria-invalid={Boolean(fieldErrors.name)} autoComplete="name" required maxLength="100" value={form.name} onChange={(event) => updateVolunteerField("name", event.target.value)} placeholder="Masukkan nama lengkap" />{fieldErrors.name && <InlineFieldError id="volunteer-name-error">{fieldErrors.name}</InlineFieldError>}</label>
          <label>Nomor WhatsApp Aktif<input aria-describedby={fieldErrors.phone ? "volunteer-phone-error" : undefined} aria-invalid={Boolean(fieldErrors.phone)} autoComplete="tel" required minLength="8" maxLength="30" type="tel" value={form.phone} onChange={(event) => updateVolunteerField("phone", event.target.value)} placeholder="Contoh: 0812 3456 7890" />{fieldErrors.phone && <InlineFieldError id="volunteer-phone-error">{fieldErrors.phone}</InlineFieldError>}</label>
        </div>
        <div className="volunteer-signup-fields">
          <label>Domisili (Kota / Kabupaten)<input aria-describedby={fieldErrors.city ? "volunteer-city-error" : undefined} aria-invalid={Boolean(fieldErrors.city)} autoComplete="address-level2" required maxLength="100" value={form.city} onChange={(event) => updateVolunteerField("city", event.target.value)} placeholder="Contoh: Bandung" />{fieldErrors.city && <InlineFieldError id="volunteer-city-error">{fieldErrors.city}</InlineFieldError>}</label>
        </div>
        <div className="volunteer-signup-fields volunteer-signup-two-col">
          <label>Email<input aria-describedby={fieldErrors.email ? "volunteer-email-error" : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" required type="email" maxLength="254" value={form.email} onChange={(event) => updateVolunteerField("email", event.target.value)} placeholder="nama@email.com" />{fieldErrors.email && <InlineFieldError id="volunteer-email-error">{fieldErrors.email}</InlineFieldError>}</label>
          <label>Password<input aria-describedby={fieldErrors.password ? "volunteer-password-error" : undefined} aria-invalid={Boolean(fieldErrors.password)} autoComplete="new-password" required minLength="8" maxLength="128" type="password" value={form.password} onChange={(event) => updateVolunteerField("password", event.target.value)} placeholder="Minimal 8 karakter" />{fieldErrors.password && <InlineFieldError id="volunteer-password-error">{fieldErrors.password}</InlineFieldError>}</label>
        </div>

        <fieldset aria-describedby={fieldErrors.interests ? "volunteer-interests-error" : undefined} aria-invalid={Boolean(fieldErrors.interests)} className="volunteer-interest-fieldset">
          <legend>Minat &amp; Keahlian Relawan <span>Pilih satu atau lebih</span></legend>
          <div className="volunteer-interest-tags">
            {volunteerInterests.map((interest) => <button
              aria-pressed={form.interests.includes(interest)}
              className={`volunteer-interest-tag${form.interests.includes(interest) ? " is-selected" : ""}`}
              key={interest}
              onClick={() => toggleInterest(interest)}
              type="button"
            ><span aria-hidden="true">{form.interests.includes(interest) ? "✓" : "+"}</span>{interest}</button>)}
          </div>
          {fieldErrors.interests && <InlineFieldError id="volunteer-interests-error">{fieldErrors.interests}</InlineFieldError>}
        </fieldset>

        <label className="volunteer-signup-consent">
          <input aria-describedby={fieldErrors.acceptedTerms ? "volunteer-consent-error" : undefined} aria-invalid={Boolean(fieldErrors.acceptedTerms)} required type="checkbox" checked={form.acceptedTerms} onChange={(event) => updateVolunteerField("acceptedTerms", event.target.checked)} />
          <span>Saya menyetujui <strong>Ketentuan Layanan &amp; Kebijakan Data Privasi (PDP)</strong></span>
        </label>
        {fieldErrors.acceptedTerms && <InlineFieldError id="volunteer-consent-error">{fieldErrors.acceptedTerms}</InlineFieldError>}
        <button className="button full-width volunteer-signup-submit" disabled={busy}>{busy ? "Memproses..." : "Daftar"} {!busy && <span aria-hidden="true">→</span>}</button>
      </form>

      <p className="volunteer-signup-login">Sudah memiliki akun? <Link to="/login">Masuk Sekarang</Link></p>
    </section>
  </main>;
}

function OrganizationVerification() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    organizationName: "",
    focusCategory: "",
    legalNumber: "",
    picName: "",
    picTitle: "",
    email: "",
    phone: "",
    password: ""
  });
  const [documents, setDocuments] = useState({ skDocument: null, taxDocument: null });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Verifikasi Lembaga & Organisasi - KoordinAksi";
    try {
      const savedDraft = localStorage.getItem(organizationRegistrationDraftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft && typeof draft === "object") {
          setForm((current) => ({ ...current, ...draft.form }));
          setStep(Math.min(2, Math.max(0, Number(draft.step) || 0)));
        }
      }
    } catch {
      setError("Draft verifikasi tidak dapat dibaca. Silakan lanjutkan dengan formulir baru.");
    }
    return () => { document.title = previousTitle; };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function saveDraft() {
    try {
      localStorage.setItem(organizationRegistrationDraftKey, JSON.stringify({ form: { ...form, password: "" }, step }));
      setError("");
      setNotice("Draft berhasil disimpan di perangkat ini. Berkas yang dipilih belum diunggah ke server.");
    } catch (saveError) {
      setNotice("");
      setError("Draft tidak dapat disimpan di perangkat ini. Pastikan penyimpanan browser tersedia.");
    }
  }

  function validateStep(currentStep) {
    const errors = {};
    if (currentStep === 0) {
      if (!form.organizationName.trim()) errors.organizationName = "Masukkan nama resmi organisasi atau yayasan.";
      if (!form.focusCategory) errors.focusCategory = "Pilih kategori fokus lembaga.";
      if (!form.legalNumber.trim()) errors.legalNumber = "Masukkan nomor SK Kemenkumham atau Akta Notaris.";
    } else if (currentStep === 1) {
      if (!form.picName.trim()) errors.picName = "Masukkan nama penanggung jawab.";
      if (!form.picTitle.trim()) errors.picTitle = "Masukkan jabatan dalam organisasi.";
      if (!form.email.trim()) errors.email = "Masukkan email resmi lembaga.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Periksa kembali format alamat email.";
      const phoneDigits = form.phone.replace(/\D/g, "");
      if (!phoneDigits) errors.phone = "Masukkan nomor WhatsApp PIC.";
      else if (!/^[+\d\s().-]+$/.test(form.phone.trim())) errors.phone = "Gunakan hanya angka, spasi, tanda +, tanda kurung, atau tanda hubung.";
      else if (phoneDigits.length < 8 || phoneDigits.length > 15) errors.phone = "Masukkan nomor dengan 8–15 digit, termasuk kode negara bila ada.";
      if (!form.password) errors.password = "Buat password untuk akun organisasi.";
      else if (form.password.length < 8) errors.password = "Password harus terdiri dari minimal 8 karakter.";
    }
    return errors;
  }

  function continueWizard() {
    const errors = validateStep(step);
    if (Object.keys(errors).length) {
      setFieldErrors((current) => ({ ...current, ...errors }));
      setNotice("");
      setError("");
      focusFirstInvalidField();
      return;
    }
    setFieldErrors({});
    setError("");
    setNotice("");
    setStep((current) => Math.min(2, current + 1));
  }

  async function submit(event) {
    event.preventDefault();
    const firstStepErrors = validateStep(0);
    const secondStepErrors = validateStep(1);
    const errors = { ...firstStepErrors, ...secondStepErrors };
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("");
      setStep(Object.keys(firstStepErrors).length ? 0 : 1);
      focusFirstInvalidField();
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const user = await register({
        name: form.picName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "organization",
        phone: form.phone.trim(),
        organizationName: form.organizationName.trim(),
        focusCategory: form.focusCategory,
        legalNumber: form.legalNumber.trim(),
        picTitle: form.picTitle.trim()
      });
      localStorage.removeItem(organizationRegistrationDraftKey);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length) {
        setFieldErrors((current) => ({
          ...current,
          ...Object.fromEntries(validationErrors.map(({ field, message }) => {
            const formField = field === "name" ? "picName" : field;
            return [formField, message];
          }))
        }));
        setError("");
        focusFirstInvalidField();
      } else if (err.response?.status === 409) {
        setFieldErrors((current) => ({ ...current, email: getErrorMessage(err) }));
        setError("");
        focusFirstInvalidField();
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  function selectDocument(event) {
    const { name, files } = event.target;
    const selectedFile = files?.[0] || null;
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, [name]: "Ukuran berkas maksimal 10 MB." }));
      setError("");
      event.target.value = "";
      return;
    }
    if (selectedFile && !["application/pdf", "image/jpeg", "image/png"].includes(selectedFile.type)) {
      setFieldErrors((current) => ({ ...current, [name]: "Gunakan berkas PDF, JPG, atau PNG." }));
      setError("");
      event.target.value = "";
      return;
    }
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
    setDocuments((current) => ({ ...current, [name]: selectedFile }));
  }

  const steps = ["Identitas & Legalitas", "Penanggung Jawab (PIC)", "Berkas & Dokumen"];
  return <main className="organization-verification-page">
    <div className="organization-verification-backdrop" aria-hidden="true" />
    <section className="organization-verification-card" aria-labelledby="organization-verification-title">
      <header className="organization-verification-header">
        <Link className="organization-verification-brand" to="/"><span className="brand-mark">K</span><span>Koordin<span>Aksi</span></span></Link>
        <Link className="organization-verification-exit" to="/register">Kembali ke pilihan peran</Link>
      </header>
      <div className="organization-verification-title-row">
        <div><span className="eyebrow">Verifikasi lembaga</span><h1 id="organization-verification-title">Verifikasi Lembaga &amp; Organisasi</h1><p>Lengkapi informasi berikut agar lembagamu dapat dipercaya komunitas.</p></div>
        <span className="organization-verification-badge"><i /> Proses aman</span>
      </div>

      <nav className="organization-verification-steps" aria-label="Langkah verifikasi organisasi">
        {steps.map((label, index) => <button
          aria-current={step === index ? "step" : undefined}
          className={`organization-verification-step${step === index ? " is-active" : ""}${step > index ? " is-complete" : ""}`}
          key={label}
          onClick={() => {
            if (index < step) {
              setStep(index);
              setError("");
              setNotice("");
            } else if (index > step) {
              continueWizard();
            }
          }}
          type="button"
        ><span>{step > index ? "✓" : `0${index + 1}`}</span><strong>{label}</strong></button>)}
      </nav>

      <form className="organization-verification-form" noValidate onSubmit={submit}>
        {error && <Notice message={error} />}
        {notice && <Notice success message={notice} />}
        {step === 0 && <section className="organization-verification-section">
          <div className="organization-verification-section-heading"><span>01</span><div><h2>Identitas &amp; Legalitas Lembaga</h2><p>Gunakan data resmi sesuai dokumen pendirian lembaga.</p></div></div>
          <div className="organization-verification-grid">
            <label className="organization-verification-wide">Nama Resmi Organisasi / Yayasan<input aria-describedby={fieldErrors.organizationName ? "organization-name-error" : undefined} aria-invalid={Boolean(fieldErrors.organizationName)} autoComplete="organization" maxLength="150" name="organizationName" onChange={updateField} placeholder="Contoh: Yayasan Peduli Sesama Indonesia" required value={form.organizationName} />{fieldErrors.organizationName && <InlineFieldError id="organization-name-error">{fieldErrors.organizationName}</InlineFieldError>}</label>
            <label>Kategori Fokus Lembaga<select aria-describedby={fieldErrors.focusCategory ? "organization-category-error" : undefined} aria-invalid={Boolean(fieldErrors.focusCategory)} name="focusCategory" onChange={updateField} required value={form.focusCategory}><option value="">Pilih kategori fokus</option>{organizationFocusCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>{fieldErrors.focusCategory && <InlineFieldError id="organization-category-error">{fieldErrors.focusCategory}</InlineFieldError>}</label>
            <label>Nomor SK Kemenkumham / Akta Notaris<input aria-describedby={fieldErrors.legalNumber ? "organization-legal-error" : undefined} aria-invalid={Boolean(fieldErrors.legalNumber)} maxLength="100" name="legalNumber" onChange={updateField} placeholder="Masukkan nomor dokumen legalitas" required value={form.legalNumber} />{fieldErrors.legalNumber && <InlineFieldError id="organization-legal-error">{fieldErrors.legalNumber}</InlineFieldError>}</label>
          </div>
        </section>}

        {step === 1 && <section className="organization-verification-section">
          <div className="organization-verification-section-heading"><span>02</span><div><h2>Penanggung Jawab (PIC) &amp; Narahubung</h2><p>Kontak ini digunakan untuk komunikasi verifikasi dan akun organisasi.</p></div></div>
          <div className="organization-verification-grid">
            <label>Nama Ketua / Penanggung Jawab<input aria-describedby={fieldErrors.picName ? "organization-pic-name-error" : undefined} aria-invalid={Boolean(fieldErrors.picName)} autoComplete="name" maxLength="100" name="picName" onChange={updateField} placeholder="Nama lengkap penanggung jawab" required value={form.picName} />{fieldErrors.picName && <InlineFieldError id="organization-pic-name-error">{fieldErrors.picName}</InlineFieldError>}</label>
            <label>Jabatan dalam Organisasi<input aria-describedby={fieldErrors.picTitle ? "organization-pic-title-error" : undefined} aria-invalid={Boolean(fieldErrors.picTitle)} maxLength="100" name="picTitle" onChange={updateField} placeholder="Contoh: Ketua / Direktur" required value={form.picTitle} />{fieldErrors.picTitle && <InlineFieldError id="organization-pic-title-error">{fieldErrors.picTitle}</InlineFieldError>}</label>
            <label>Email Resmi Lembaga<input aria-describedby={fieldErrors.email ? "organization-email-error" : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" maxLength="254" name="email" onChange={updateField} placeholder="kontak@organisasi.id" required type="email" value={form.email} />{fieldErrors.email && <InlineFieldError id="organization-email-error">{fieldErrors.email}</InlineFieldError>}</label>
            <label>No. WhatsApp Layanan (PIC)<input aria-describedby={fieldErrors.phone ? "organization-phone-error" : undefined} aria-invalid={Boolean(fieldErrors.phone)} autoComplete="tel" maxLength="30" minLength="8" name="phone" onChange={updateField} placeholder="Contoh: 0812 3456 7890" required type="tel" value={form.phone} />{fieldErrors.phone && <InlineFieldError id="organization-phone-error">{fieldErrors.phone}</InlineFieldError>}</label>
            <label className="organization-verification-wide">Password Akun Organisasi<input aria-describedby={fieldErrors.password ? "organization-password-error" : undefined} aria-invalid={Boolean(fieldErrors.password)} autoComplete="new-password" maxLength="128" minLength="8" name="password" onChange={updateField} placeholder="Minimal 8 karakter" required type="password" value={form.password} />{fieldErrors.password && <InlineFieldError id="organization-password-error">{fieldErrors.password}</InlineFieldError>}</label>
          </div>
        </section>}

        {step === 2 && <section className="organization-verification-section">
          <div className="organization-verification-section-heading"><span>03</span><div><h2>Berkas &amp; Dokumen</h2><p>Unggah dokumen yang jelas dan dapat dibaca (PDF, JPG, atau PNG; maksimal 10 MB).</p></div></div>
          <div className="organization-verification-documents">
            {organizationDocumentTypes.map((document) => {
              const selectedFile = documents[document.key];
              const documentError = fieldErrors[document.key];
              return <label className={`organization-document-upload${selectedFile ? " is-selected" : ""}${documentError ? " has-error" : ""}`} key={document.key}>
                <input aria-describedby={documentError ? `${document.key}-error` : undefined} aria-invalid={Boolean(documentError)} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" name={document.key} onChange={selectDocument} type="file" />
                <span className="organization-document-icon" aria-hidden="true">{document.icon}</span>
                <span className="organization-document-copy"><strong>{document.title}</strong><small>{selectedFile ? selectedFile.name : document.detail}</small></span>
                <span className={`organization-document-status${selectedFile ? " is-selected" : ""}`}>{selectedFile ? "Dipilih" : "Belum diunggah"}</span>
                <span className="organization-document-action">{selectedFile ? "Ganti berkas" : "Pilih berkas"}</span>
                {documentError && <InlineFieldError id={`${document.key}-error`}>{documentError}</InlineFieldError>}
              </label>;
            })}
          </div>
          <p className="organization-document-note">Berkas saat ini hanya dipilih di browser dan belum diunggah ke server.</p>
        </section>}

        <aside className="organization-verification-security">
          <span aria-hidden="true">✓</span><div><strong>Jaminan Keamanan Verifikasi</strong><p>Dokumen lembaga hanya digunakan untuk proses verifikasi dan dijaga kerahasiaannya. Tim kami meninjau pengajuan dalam 1–3 hari kerja.</p></div>
        </aside>
        <aside className="organization-upload-warning" role="note">
          <strong>Berkas belum diunggah</strong>
          <p>File yang dipilih saat ini hanya tersimpan sementara di browser dan tidak dikirim bersama pembuatan akun. Pengiriman dan verifikasi berkas memerlukan endpoint upload backend yang belum tersedia.</p>
        </aside>
        <div className="organization-verification-actions">
          {step > 0 && <button className="organization-verification-back" onClick={() => { setStep((current) => current - 1); setError(""); setNotice(""); }} type="button">← Kembali</button>}
          <button className="organization-verification-save" onClick={saveDraft} type="button">Simpan Draft</button>
          {step < 2
            ? <button className="button organization-verification-next" onClick={continueWizard} type="button">Lanjutkan <span aria-hidden="true">→</span></button>
            : <button className="button organization-verification-submit" disabled={busy} type="submit">{busy ? "Menyimpan akun..." : "Simpan Akun & Lanjutkan ke Verifikasi Berkas"} {!busy && <span aria-hidden="true">→</span>}</button>}
        </div>
      </form>
    </section>
  </main>;
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { role: requestedRole } = useParams();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: requestedRole === "organization" ? "organization" : "volunteer", organizationName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (isRegister && requestedRole !== "volunteer" && requestedRole !== "organization") return <Navigate to="/register" replace />;
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

function InlineFieldError({ id, children }) {
  return <span className="registration-field-error" id={id} role="alert">{children}</span>;
}

function focusFirstInvalidField() {
  window.requestAnimationFrame(() => {
    const invalidField = document.querySelector('[aria-invalid="true"]');
    const focusTarget = invalidField?.querySelector("input, select, button") || invalidField;
    focusTarget?.focus();
  });
}

function NotFound() {
  return <div className="container page-space not-found"><span className="eyebrow">404 · Halaman tidak ditemukan</span><h1>Sepertinya jalan ini<br /><em>belum tersedia.</em></h1><Link className="button" to="/">Kembali ke beranda →</Link></div>;
}

export default function App() {
  return <AppRoutes />;
}
