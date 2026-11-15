import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, LayoutDashboard, Menu, ShieldCheck, Users, UserRound, X } from "lucide-react";
import { useAuth } from "./AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  function signOut() {
    logout();
    navigate("/");
  }

  return <div className={`admin-portal${mobileMenuOpen ? " is-mobile-menu-open" : ""}`}>
    {mobileMenuOpen && <button type="button" className="admin-sidebar-backdrop"
      aria-label="Tutup navigasi admin" onClick={() => setMobileMenuOpen(false)} />}
    <aside className="admin-sidebar" id="admin-sidebar">
      <Link className="brand" to="/admin/dashboard"><img className="brand-logo" src="/logokoordinaski.png" alt="" /> Koordin<span>Aksi</span></Link>
      <span className="admin-sidebar-label">PORTAL ADMIN</span>
      <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
        <NavLink to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true"><LayoutDashboard size={17} /></span> Ringkasan</NavLink>
        <NavLink to="/admin/organizations/pending" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true"><ShieldCheck size={17} /></span> Verifikasi organisasi</NavLink>
        <NavLink to="/admin/activities" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true"><ClipboardCheck size={17} /></span> Daftar kegiatan</NavLink>
        <NavLink to="/admin/users" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true"><UserRound size={17} /></span> Pengguna</NavLink>
        <NavLink to="/admin/volunteers" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true"><Users size={17} /></span> Database relawan</NavLink>
        <NavLink to="/admin/system" onClick={() => setMobileMenuOpen(false)}><span aria-hidden="true">⚙</span> Manajemen sistem</NavLink>
      </nav>
      <div className="admin-sidebar-account">
        <span>{user?.name || "Admin"}</span>
        <button type="button" className="button button-small button-ghost" onClick={signOut}>Keluar</button>
      </div>
    </aside>
    <main className="admin-main">
      <button type="button" className="admin-mobile-menu-toggle" aria-controls="admin-sidebar"
        aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
        {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
        {mobileMenuOpen ? "Tutup menu" : "Menu admin"}
      </button>
      <SessionRecoveryNotice />
      <Outlet />
    </main>
  </div>;
}

function SessionRecoveryNotice() {
  const { sessionError, refreshSession } = useAuth();
  if (!sessionError) return null;
  return <div className="session-recovery" role="status">
    <span>{sessionError}</span>
    <button className="button button-small button-ghost" onClick={refreshSession}>Coba lagi</button>
  </div>;
}

export { default } from "./pages/admin/AdminDashboard";
