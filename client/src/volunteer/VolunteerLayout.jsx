import React, { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";

export default function VolunteerLayout() {
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [registrationError, setRegistrationError] = useState("");

  const recordRegistration = useCallback((registration) => {
    setRegistrations((current) => current.some((item) => item._id === registration._id)
      ? current
      : [registration, ...current]);
  }, []);

  const loadRegistrations = useCallback(async () => {
    setLoadingRegistrations(true);
    try {
      const { data } = await api.get("/registrations/mine");
      setRegistrations(data.registrations);
      setRegistrationError("");
      return true;
    } catch (error) {
      setRegistrationError(getErrorMessage(error));
      return false;
    } finally {
      setLoadingRegistrations(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const outletContext = {
    registrations,
    loadingRegistrations,
    registrationError,
    loadRegistrations,
    recordRegistration
  };

  return <>
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/dashboard/relawan">
          <span className="brand-mark">K</span> Koordin<span>Aksi</span>
        </Link>
        <span className="volunteer-header-greeting">Ruang relawan</span>
        <div className="nav-actions">
          <span className="user-greeting">Hai, {user.name.split(" ")[0]}</span>
          <button className="button button-small button-ghost" onClick={logout}>Keluar</button>
        </div>
      </div>
    </header>
    <div className="volunteer-portal">
      <aside className="volunteer-sidebar" aria-label="Navigasi relawan">
        <div className="volunteer-sidebar-label">MENU RELAWAN</div>
        <nav className="volunteer-sidebar-nav">
          <NavLink end to="/dashboard/relawan"><span aria-hidden="true">⌕</span> Jelajahi kegiatan</NavLink>
          <NavLink to="/dashboard/relawan/history"><span aria-hidden="true">▤</span> Pendaftaran saya</NavLink>
          <NavLink to="/dashboard/relawan/feed"><span aria-hidden="true">♡</span> Kabar Aksi</NavLink>
          <NavLink to="/dashboard/relawan/profile"><span aria-hidden="true">◉</span> Profil</NavLink>
        </nav>
        <div className="volunteer-sidebar-note">
          <strong>Setiap waktu yang kamu berikan berarti.</strong>
          <span>Temukan aksi baik di sekitarmu.</span>
        </div>
      </aside>
      <main className="volunteer-main">
        {registrationError && <div className="volunteer-load-error" role="alert">
          <span>{registrationError}</span>
          <button type="button" className="button button-small button-ghost" onClick={loadRegistrations}>Coba lagi</button>
        </div>}
        <Outlet context={outletContext} />
      </main>
    </div>
    <footer className="footer"><div className="container footer-row">
      <Link className="brand" to="/dashboard/relawan"><span className="brand-mark">K</span> Koordin<span>Aksi</span></Link>
      <p>Ruang bertemu untuk setiap niat baik.</p>
      <small>© {new Date().getFullYear()} KoordinAksi</small>
    </div></footer>
  </>;
}
