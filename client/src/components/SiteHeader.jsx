import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Compass, Home, Newspaper, Users } from "lucide-react";
import { motion } from "motion/react";
import { getDashboardPath, useAuth } from "@/AuthContext";

const publicLinks = [
  { to: "/", label: "Beranda", icon: Home, end: true },
  { to: "/jelajah", label: "Jelajah", icon: Compass },
  { to: "/organisasi", label: "Organisasi", icon: Users },
  { to: "/kabar-aksi", label: "Kabar", icon: Newspaper }
];

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
    function applyScroll(y) {
      setScrolled(y > 12);
    }
    function onLenisScroll(event) {
      applyScroll(event.detail?.scroll ?? 0);
    }
    function onWindowScroll() {
      applyScroll(window.scrollY || 0);
    }
    applyScroll(window.scrollY || 0);
    window.addEventListener("lenis-scroll", onLenisScroll);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("lenis-scroll", onLenisScroll);
      window.removeEventListener("scroll", onWindowScroll);
    };
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

  return (
    <>
      <header className={`site-header floating-pill-header${scrolled ? " is-scrolled" : ""}`}>
        <motion.div className="floating-pill" initial={false} animate={{ y: 0 }} whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
          <Link className="brand" to="/">
            <img className="brand-logo" src="/logokoordinaski.png" alt="" />
            <span className="brand-text">Koordin<span>Aksi</span></span>
          </Link>

          <nav className="floating-pill-nav" aria-label="Navigasi utama">
            {publicLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={Boolean(end)}>{label}</NavLink>
            ))}
            {user && (
              <NavLink to={getDashboardPath(user.role)}>Ruang Saya</NavLink>
            )}
          </nav>

          <div className="floating-pill-actions" ref={profileMenuRef}>
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
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link className="login-link" to="/login">Masuk</Link>
                <Link className="button button-small" to="/register">Bergabung</Link>
              </>
            )}
          </div>
        </motion.div>
      </header>

      <nav className="bottom-tab-bar" aria-label="Navigasi mobile">
        {publicLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={Boolean(end)} className="bottom-tab-item">
            <Icon size={20} strokeWidth={2.1} />
            <span>{label}</span>
          </NavLink>
        ))}
        {user ? (
          <NavLink to={getDashboardPath(user.role)} className="bottom-tab-item">
            <span className="bottom-tab-avatar">{initials}</span>
            <span>Saya</span>
          </NavLink>
        ) : (
          <NavLink to="/login" className="bottom-tab-item">
            <span className="bottom-tab-avatar">→</span>
            <span>Masuk</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
