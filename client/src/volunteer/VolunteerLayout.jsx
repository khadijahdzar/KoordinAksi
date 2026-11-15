import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Settings, Users, MessageCircle } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { getVolunteerProfile } from "../services/volunteerApi";

export default function VolunteerLayout() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [registrationError, setRegistrationError] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");

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

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await getVolunteerProfile();
      setProfile(data.profile);
      setProfileError("");
    } catch (error) {
      setProfileError(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
    loadProfile();
  }, [loadRegistrations, loadProfile]);

  const activeCount = useMemo(
    () => registrations.filter((item) => !["cancelled", "rejected"].includes(item.status)).length,
    [registrations]
  );
  const displayName = user.name || profile?.name || "Relawan";
  const avatarUrl = user.avatarUrl || profile?.avatarUrl;
  const bio = user.bio ?? profile?.bio ?? "Setiap langkah kecilmu ikut membawa perubahan.";
  const initials = displayName.trim().split(/\s+/)
    .slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const outletContext = {
    registrations,
    loadingRegistrations,
    registrationError,
    loadRegistrations,
    recordRegistration
  };

  return <main className="volunteer-hub">
    <div className="container">
      <section className="volunteer-hub-profile">
        <div className="volunteer-hub-avatar" aria-label={`Foto ${displayName}`}>
          <span>{initials}</span>
          {avatarUrl && <img src={avatarUrl} alt="" />}
        </div>
        <div className="volunteer-hub-identity">
          <span className="eyebrow">RUANG PRIBADI · RELAWAN</span>
          <h1>{displayName}</h1>
          <p>{bio}</p>
        </div>
        <NavLink className="button button-small button-ghost volunteer-hub-edit" to="/dashboard/relawan/profile">
          <Settings size={15} /> Pengaturan profil
        </NavLink>
      </section>

      <section className="volunteer-hub-stats" aria-label="Ringkasan kontribusi">
        <article><span><Users size={15} /> Aksi diikuti</span><strong>{loadingRegistrations ? "—" : activeCount}</strong></article>
        <article><span><Clock3 size={15} /> Jam kontribusi</span><strong>{profile?.stats?.totalHours ?? "—"}<small> jam</small></strong></article>
        <article><span><CalendarDays size={15} /> Aksi dihadiri</span><strong>{profile?.stats?.totalActions ?? "—"}</strong></article>
      </section>

      <nav className="volunteer-hub-tabs" aria-label="Navigasi ruang relawan">
        <NavLink end to="/dashboard/relawan"><CalendarDays size={16} /> Aksi Saya</NavLink>
        <NavLink to="/dashboard/relawan/history"><Clock3 size={16} /> Riwayat &amp; Sertifikat</NavLink>
        <NavLink to="/dashboard/relawan/profile"><Settings size={16} /> Pengaturan Profil</NavLink>
        <NavLink to="/dashboard/relawan/feed"><MessageCircle size={16} /> Kabar Aksi</NavLink>
      </nav>

      {registrationError && <div className="volunteer-load-error" role="alert">
        <span>{registrationError}</span>
        <button type="button" className="button button-small button-ghost" onClick={loadRegistrations}>Coba lagi</button>
      </div>}
      {profileError && <div className="volunteer-load-error" role="alert">
        <span>Ringkasan profil tidak dapat dimuat. {profileError}</span>
        <button type="button" className="button button-small button-ghost" onClick={loadProfile}>Coba lagi</button>
      </div>}
      <Outlet context={outletContext} />
    </div>
  </main>;
}
