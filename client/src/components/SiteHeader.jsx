import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Compass, Building2, Newspaper, UserRound, LogIn, Home } from "lucide-react";
import { getDashboardPath, useAuth } from "@/AuthContext";

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef(null);
  const name = user?.name || "Pengguna";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleLabel = { volunteer: "Relawan", organization: "Organisasi", admin: "Admin" }[user?.role] || "Pengguna";

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navItems = [
    { to: "/jelajah", label: "Jelajah", icon: Compass },
    { to: "/organisasi", label: "Organisasi", icon: Building2 },
    { to: "/kabar-aksi", label: "Kabar Aksi", icon: Newspaper }
  ];

  return <>
    <header className={`site-header floating-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="floating-pill" ref={profileMenuRef}>
        <Link className="brand" to="/">
          <img className="brand-logo" src="/logokoordinaski.png" alt="" />
          <span>Koordin<span>Aksi</span></span>
        </Link>

        <nav className="floating-nav" aria-label="Navigasi utama">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
          {user && <NavLink to={getDashboardPath(user.role)}>Ruang Saya</NavLink>}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="header-profile">
              <button
                type="button"
                className="header-avatar"
                aria-label="Buka menu profil"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span>{initials}</span>
                {user.avatarUrl && !avatarError && (
                  <img src={user.avatarUrl} alt="" onError={() => setAvatarError(true)} />
                )}
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-identity">
                    <strong>{name}</strong>
                    <span>{roleLabel}</span>
                  </div>
                  <Link role="menuitem" to={getDashboardPath(user.role)}>Ruang Saya</Link>
                  {user.role === "volunteer" && (
                    <Link role="menuitem" to="/dashboard/relawan/profile">Profil Saya</Link>
                  )}
                  <button type="button" role="menuitem" onClick={() => { logout(); navigate("/"); }}>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="login-link desktop-only" to="/login">Masuk</Link>
              <Link className="button button-small desktop-only" to="/register">Mulai Bergabung</Link>
            </>
          )}
        </div>
      </div>
    </header>

    <nav className="mobile-tab-bar" aria-label="Navigasi bawah">
      <NavLink to="/" end className={({ isActive }) => isActive ? "is-active" : ""}>
        <Home size={18} />
        <span>Beranda</span>
      </NavLink>
      <NavLink to="/jelajah" className={({ isActive }) => isActive ? "is-active" : ""}>
        <Compass size={18} />
        <span>Jelajah</span>
      </NavLink>
      <NavLink to="/organisasi" className={({ isActive }) => isActive ? "is-active" : ""}>
        <Building2 size={18} />
        <span>Organisasi</span>
      </NavLink>
      <NavLink to="/kabar-aksi" className={({ isActive }) => isActive ? "is-active" : ""}>
        <Newspaper size={18} />
        <span>Kabar</span>
      </NavLink>
      {user ? (
        <NavLink to={getDashboardPath(user.role)} className={({ isActive }) => isActive ? "is-active" : ""}>
          <UserRound size={18} />
          <span>Saya</span>
        </NavLink>
      ) : (
        <NavLink to="/login" className={({ isActive }) => isActive ? "is-active" : ""}>
          <LogIn size={18} />
          <span>Masuk</span>
        </NavLink>
      )}
    </nav>
  </>;
}
