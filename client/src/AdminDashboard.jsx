import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ClipboardCheck, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "./AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/");
  }

  return <div className="admin-portal">
    <aside className="admin-sidebar">
      <Link className="brand" to="/admin/dashboard"><img className="brand-logo" src="/logokoordinaski.png" alt="" /> Koordin<span>Aksi</span></Link>
      <span className="admin-sidebar-label">PORTAL ADMIN</span>
      <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
        <NavLink to="/admin/dashboard"><span aria-hidden="true"><LayoutDashboard size={17} /></span> Ringkasan</NavLink>
        <NavLink to="/admin/organizations/pending"><span aria-hidden="true"><ShieldCheck size={17} /></span> Verifikasi organisasi</NavLink>
        <NavLink to="/admin/activities"><span aria-hidden="true"><ClipboardCheck size={17} /></span> Daftar kegiatan</NavLink>
        <NavLink to="/admin/volunteers"><span aria-hidden="true"><Users size={17} /></span> Database relawan</NavLink>
        <NavLink to="/admin/system"><span aria-hidden="true">⚙</span> Manajemen sistem</NavLink>
      </nav>
      <div className="admin-sidebar-account">
        <span>{user.name}</span>
        <button type="button" className="button button-small button-ghost" onClick={signOut}>Keluar</button>
      </div>
    </aside>
    <main className="admin-main"><SessionRecoveryNotice /><Outlet /></main>
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
