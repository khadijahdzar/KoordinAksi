import React, { useEffect, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import api, { getErrorMessage } from "./api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import HeroSection from "./components/HeroSection";
import DonationImpact from "./components/DonationImpact";
import SiteHeader from "./components/SiteHeader";
import ActivityList from "./public/ActivityList";
import ActivityDetail from "./public/ActivityDetail";
import { featuredCategories } from "./public/activityImages";
import KabarAksi from "./public/KabarAksi";
import OrganizationDirectory from "./public/OrganizationDirectory";
import OrganizationProfile from "./public/OrganizationProfile";
import { AdminLayout } from "./AdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminActivityList from "./pages/admin/AdminActivityList";
import AdminVolunteerDatabase from "./pages/admin/AdminVolunteerDatabase";
import AdminUsers from "./pages/admin/AdminUsers";
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
import AuthPage from "./pages/AuthPage";
import RegistrationRolePage from "./pages/RegistrationRolePage";
import VolunteerRegistration from "./pages/VolunteerRegistration";
import OrganizationVerification from "./pages/OrganizationVerification";
import { Notice, NotFound } from "./formHelpers";

function Header() {
  return <SiteHeader />;
}

function Footer() {
  const { user } = useAuth();
  return <footer className="footer">
    <div className="container footer-main">
      <section className="footer-about">
        <Link className="brand" to={user ? getDashboardPath(user.role) : "/"}>
          <img className="brand-logo" src="/logokoordinaski.png" alt="" /> Koordin<span>Aksi</span>
        </Link>
        <p>Ruang bertemu untuk setiap niat baik. Temukan aksi, relawan, dan komunitas yang bergerak untuk Indonesia.</p>
      </section>
      <nav className="footer-column" aria-label="Tautan cepat">
        <h2>Tautan Cepat</h2>
        <Link to="/jelajah">Jelajah Kegiatan</Link>
        <Link to="/organisasi">Organisasi</Link>
        <Link to="/kabar-aksi">Kabar Aksi</Link>
        <Link to="/register">Bergabung</Link>
      </nav>
      <section className="footer-column">
        <h2>Kontak & Lokasi</h2>
        <a href="mailto:khadijahdzar2509@gmail.com"><Mail size={15} /> khadijahdzar2509@gmail.com</a>
        <a href="tel:+6282134008512"><Phone size={15} /> +62 821-3400-8512</a>
        <a href="https://maps.google.com/?q=Jl.+Sudirman+No.+45,+Jakarta+Selatan" target="_blank" rel="noreferrer">
          <MapPin size={15} /> Jl. Sudirman No. 45, Jakarta Selatan, DKI Jakarta
        </a>
      </section>
      <section className="footer-column footer-social">
        <h2>Ikuti Kami</h2>
        <a href="https://instagram.com/imkdijah" target="_blank" rel="noreferrer"><Instagram size={17} />imkdijah</a>
        <a href="https://www.linkedin.com/in/khadijah-dzar-990355405" target="_blank" rel="noreferrer"><Linkedin size={17} /> Khadijah Dzar</a>
        </section>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} KoordinAksi Indonesia</span><span>Ruang bertemu untuk setiap niat baik.</span></div>
  </footer>;
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
  const location = useLocation();
  if (loading) return <div className="container page-space"><p>Memuat sesi...</p></div>;
  if (sessionError && !user) return <SessionRecoveryNotice />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />;
  return <Outlet />;
}

function ProtectedAdminRoute() {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="container page-space" role="status"><p>Memeriksa akses admin...</p></div>;
  }
  if (sessionError && !user) return <SessionRecoveryNotice />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

function DashboardRedirect() {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container page-space" role="status"><p>Memuat sesi...</p></div>;
  if (sessionError && !user) return <SessionRecoveryNotice />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
      <Route path="/register" element={<RegistrationRolePage />} />
      <Route path="/register/volunteer" element={<VolunteerRegistration />} />
      <Route path="/register/organization" element={<OrganizationVerification />} />
      <Route path="/register/organisasi" element={<OrganizationVerification />} />
      <Route path="/organisasi/pendaftaran" element={<OrganizationVerification />} />
      <Route path="/organisasi" element={<OrganizationDirectory />} />
      <Route path="/organisasi/:id" element={<OrganizationProfile />} />
      <Route path="/jelajah" element={<ActivityList />} />
      <Route path="/kegiatan" element={<ActivityList />} />
      <Route path="/kegiatan/:id" element={<ActivityDetail />} />
      <Route path="/kabar-aksi" element={<KabarAksi />} />
      <Route path="/kabar-aksi/:id" element={<KabarAksi />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/masuk" element={<AuthPage mode="login" />} />
      <Route element={<ProtectedRoute roles={["volunteer"]} />}>
        <Route path="/dashboard/relawan" element={<VolunteerLayout />}>
          <Route index element={<VolunteerDashboard />} />
          <Route path="history" element={<RegistrationHistory />} />
          <Route path="profile" element={<VolunteerProfile />} />
          <Route path="feed" element={<VolunteerFeed />} />
        </Route>
      </Route>
    </Route>
    <Route path="/dashboard" element={<DashboardRedirect />} />
    <Route element={<ProtectedRoute roles={["volunteer"]} />}>
      <Route path="/dashboard/volunteer" element={<Navigate to="/dashboard/relawan" replace />} />
    </Route>
    <Route element={<ProtectedRoute roles={["organization"]} />}>
      <Route path="/dashboard/organization" element={<Navigate to="/dashboard/organisasi" replace />} />
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
        <Route path="users" element={<AdminUsers />} />
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
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/activities/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);
  return <>
    <HeroSection
      className="home-hero"
      eyebrow="Platform aksi sosial Indonesia"
      title={<>Kebaikan kecil,<br />dampak besar.</>}
      subtitle="Temukan kegiatan sosial yang berarti bagimu. Terhubung dengan organisasi terpercaya dan bergerak bersama untuk Indonesia yang lebih baik."
    >
      <div className="hero-section-actions">
        <Link className="button button-light" to="/jelajah">Jelajahi kegiatan <span>↗</span></Link>
        <Link className="hero-section-link" to="/register">Saya mengelola organisasi <span>→</span></Link>
      </div>
      <div className="hero-note"><div className="avatar-stack"><i>R</i><i>A</i><i>D</i><i>+</i></div><span>Bergabung bersama komunitas penuh kepedulian</span></div>
    </HeroSection>
    {error && <div className="container"><Notice message={error} /></div>}
    <section className="stats-strip" data-reveal><div className="container stats-grid">
      <Stat value={stats?.volunteers} label="Relawan bergabung" /><Stat value={stats?.organizations} label="Organisasi terverifikasi" /><Stat value={stats?.activities} label="Aksi terbuka" /><Stat value={stats?.registrations} label="Partisipasi tercatat" />
    </div></section>
    <DonationImpact />
    <section className="section container" data-reveal><div className="section-heading"><div><span className="eyebrow">Pilih cara berkontribusi</span><h2>Satu kepedulian,<br />banyak kemungkinan.</h2></div><Link to="/jelajah" className="text-link">Lihat semua kegiatan <span>→</span></Link></div>
      <div className="category-grid">{featuredCategories.map(({ label, category, icon, image }, index) => <Link className={`category-tile tile-${index}${image ? " category-tile-image" : ""}`} key={label} to={`/jelajah?category=${encodeURIComponent(category)}`}>
        {image && <img src={image} alt="" aria-hidden="true" loading="lazy" />}
        <span>{icon}</span><strong>{label}</strong><small>Jadi bagian dari perubahan</small><b>↗</b>
      </Link>)}</div>
    </section>
    <section className="callout" data-reveal><div className="container callout-inner"><div><span className="eyebrow">Untuk organisasi sosial</span><h2>Setiap aksi lebih kuat<br />saat dilakukan bersama.</h2><p>Kelola relawan, publikasi kegiatan, dan perluas dampak organisasimu.</p></div><Link className="button button-light" to="/register">Daftarkan organisasi <span>↗</span></Link></div></section>
  </>;
}

function Stat({ value, label }) {
  return <div className="stat"><strong>{value == null ? "—" : Number(value).toLocaleString("id-ID")}<span>+</span></strong><small>{label}</small></div>;
}

export default function App() {
  return <AppRoutes />;
}
