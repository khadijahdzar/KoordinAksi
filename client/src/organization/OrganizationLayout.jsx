import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Building2, Users } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function OrganizationLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const organization = user.organization;
  const verified = organization?.verified === true;

  function signOut() {
    logout();
    navigate("/");
  }

  return <>
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/dashboard/organisasi">
          <span className="brand-mark">K</span> Koordin<span>Aksi</span>
        </Link>
        <span className="organization-header-label">Portal organisasi</span>
        <div className="nav-actions">
          <span className="user-greeting">{organization?.name || user.name}</span>
          <button type="button" className="button button-small button-ghost" onClick={signOut}>Keluar</button>
        </div>
      </div>
    </header>
    <div className="organization-portal">
      <aside className="organization-sidebar" aria-label="Navigasi organisasi">
        <span className="organization-sidebar-label">RUANG ORGANISASI</span>
        <nav className="organization-sidebar-nav">
          <NavLink end to="/dashboard/organisasi"><Building2 size={16} aria-hidden="true" /> Kegiatan saya</NavLink>
          <NavLink to="/dashboard/organisasi/volunteers"><Users size={16} aria-hidden="true" /> Verifikasi & log</NavLink>
          <NavLink to="/dashboard/organisasi/impact"><BarChart3 size={16} aria-hidden="true" /> Laporan dampak</NavLink>
        </nav>
        <div className="organization-sidebar-account">
          <span className={`organization-verification-indicator${verified ? " is-verified" : ""}`}>
            <i aria-hidden="true" /> {verified ? "Terverifikasi" : "Menunggu verifikasi"}
          </span>
          <strong>{organization?.name || user.name}</strong>
        </div>
      </aside>
      <main className="organization-main">
        {!verified && <section className={`organization-verification-banner${organization?.verificationStatus === "rejected" ? " is-rejected" : ""}`}
          role="status">
          <span className="organization-verification-icon" aria-hidden="true">!</span>
          <div>
            <strong>{organization?.verificationStatus === "rejected" ? "Verifikasi organisasi belum disetujui" : "Menunggu verifikasi admin"}</strong>
            <p>Akun Anda sedang ditinjau oleh Admin. Mohon menunggu verifikasi untuk mulai mempublikasikan kegiatan.</p>
            {organization?.verificationStatus === "rejected" && <p>Verifikasi belum disetujui. Silakan hubungi admin untuk informasi tindak lanjut.</p>}
          </div>
        </section>}
        <Outlet context={{ canManagePublishedActivities: verified }} />
      </main>
    </div>
    <footer className="footer"><div className="container footer-row">
      <Link className="brand" to="/dashboard/organisasi"><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <p>Ruang bertemu untuk setiap niat baik.</p>
      <small>© {new Date().getFullYear()} KoordinAksi</small>
    </div></footer>
  </>;
}
