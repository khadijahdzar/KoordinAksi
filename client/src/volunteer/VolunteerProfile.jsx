import React from "react";
import { useAuth } from "../AuthContext";

export default function VolunteerProfile() {
  const { user } = useAuth();
  return <section className="container volunteer-dashboard volunteer-profile">
    <div className="volunteer-page-heading">
      <div><span className="eyebrow">Akun relawan</span><h1>Profil saya.</h1>
        <p>Informasi akun yang digunakan untuk berkoordinasi dengan penyelenggara.</p></div>
    </div>
    <div className="volunteer-profile-card">
      <div className="volunteer-profile-avatar">{user.name?.charAt(0)?.toUpperCase() || "R"}</div>
      <div><span className="eyebrow">Relawan</span><h2>{user.name}</h2></div>
      <dl>
        <div><dt>Nama lengkap</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Nomor telepon</dt><dd>{user.phone || "Belum ditambahkan"}</dd></div>
      </dl>
      <p className="volunteer-profile-note">Pengubahan profil belum tersedia melalui API akun saat ini.</p>
    </div>
  </section>;
}
