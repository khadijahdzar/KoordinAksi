import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Calendar, Clock, MapPin, Pencil, User, X } from "lucide-react";
import { getErrorMessage } from "../api";
import { useAuth } from "../AuthContext";
import { getVolunteerActions, getVolunteerProfile, updateVolunteerProfile } from "../services/volunteerApi";

function formatDate(value) {
  if (!value) return "Tanggal belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}

export default function VolunteerProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("actions");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", avatarUrl: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResponse, actionsResponse] = await Promise.all([getVolunteerProfile(), getVolunteerActions()]);
      const nextProfile = profileResponse.data.profile;
      setProfile(nextProfile);
      setActions(actionsResponse.data.actions);
      setForm({ name: nextProfile.name || "", bio: nextProfile.bio || "", avatarUrl: nextProfile.avatarUrl || "" });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data } = await updateVolunteerProfile(form);
      setProfile((current) => ({ ...current, ...data.profile }));
      updateUser(data.profile);
      setEditing(false);
      setNotice("Profil berhasil diperbarui.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="volunteer-dashboard volunteer-profile"><div className="volunteer-loading"><span className="volunteer-spinner" />Memuat profil…</div></section>;
  if (!profile) return <section className="volunteer-dashboard volunteer-profile">
    <div className="notice" role="alert">{error || "Profil tidak dapat dimuat."}</div>
    <button type="button" className="button button-small button-ghost" onClick={loadProfile}>Coba lagi</button>
  </section>;

  return <section className="volunteer-dashboard volunteer-profile">
    <header className="volunteer-profile-settings-heading">
      <div><span className="eyebrow">PENGATURAN AKUN</span><h2>Profil relawan</h2>
        <p><User size={15} /> {profile.username ? `@${profile.username}` : profile.email}</p></div>
      <button className="button button-small button-ghost volunteer-edit-button" onClick={() => { setEditing((current) => !current); setNotice(""); }}>
        {editing ? <X size={15} /> : <Pencil size={15} />}{editing ? "Tutup" : "Edit profil"}
      </button>
    </header>
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {error && <div className="notice" role="alert">{error}</div>}
    {editing && <form className="volunteer-profile-edit" onSubmit={saveProfile}>
      <label>Nama lengkap<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Bio<textarea rows="3" maxLength="500" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
      <label>URL foto profil<input type="url" maxLength="500" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://…" /></label>
      <button className="button button-small" disabled={saving}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
    </form>}

    <nav className="volunteer-profile-tabs" aria-label="Riwayat kontribusi">
      <button type="button" className={selectedTab === "actions" ? "active" : ""} onClick={() => setSelectedTab("actions")}><Calendar size={16} />Aksi selesai</button>
      <button type="button" className={selectedTab === "certificates" ? "active" : ""} onClick={() => setSelectedTab("certificates")}><Award size={16} />Sertifikat</button>
    </nav>

    {selectedTab === "actions" ? <><div className="volunteer-profile-section-heading"><div><span className="eyebrow">PERJALANANMU</span><h2>Aksi yang diikuti</h2></div><span>{actions.length} aksi</span></div>
    {actions.length ? <div className="volunteer-profile-actions">{actions.map(({ _id, activity, status }) => <article className="volunteer-profile-action" key={_id}>
      <div className="volunteer-action-icon"><Calendar size={19} /></div><div className="volunteer-action-info"><span>{activity?.category || "Aksi sosial"}</span><h3>{activity?.title || "Kegiatan tidak lagi tersedia"}</h3>
        <p><Clock size={14} />{formatDate(activity?.date)}<MapPin size={14} />{activity?.location || "Lokasi belum tersedia"}</p></div>
      <span className={`volunteer-action-status volunteer-action-${status}`}>{status === "attended" ? "Hadir" : "Dikonfirmasi"}</span>
    </article>)}</div> : <div className="empty-box"><Calendar size={24} /><h3>Belum ada aksi yang diikuti</h3><p>Aksi yang dikonfirmasi akan muncul di sini.</p><Link className="text-link" to="/dashboard/relawan">Jelajahi kegiatan →</Link></div>}</>
    : <div className="empty-box"><Award size={24} /><h3>Sertifikatmu akan muncul di sini</h3><p>Sertifikat tersedia setelah kehadiran pada kegiatan tercatat.</p></div>}
  </section>;
}
