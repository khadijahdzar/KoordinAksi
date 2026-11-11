import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Calendar, CheckCircle, Clock, MapPin, Pencil, User, X } from "lucide-react";
import { getErrorMessage } from "../api";
import { getVolunteerActions, getVolunteerProfile, updateVolunteerProfile } from "../services/volunteerApi";

const tabs = [
  { label: "Aksi Saya", path: "/dashboard/relawan/profile", icon: Calendar },
  { label: "Kabar Aksi", path: "/dashboard/relawan/feed", icon: CheckCircle }
];

function formatDate(value) {
  if (!value) return "Tanggal belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}

export default function VolunteerProfile() {
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

  const initials = profile.name?.trim().charAt(0).toUpperCase() || "R";
  const actionCount = profile.stats?.totalActions || 0;
  const volunteerLevel = actionCount >= 10 ? "Penggerak" : actionCount >= 3 ? "Aktif" : "Pemula";

  return <section className="volunteer-dashboard volunteer-profile">
    <div className="volunteer-profile-cover"><span className="eyebrow">RUANG RELAWAN</span><div className="volunteer-cover-mark" aria-hidden="true">✳</div></div>
    <header className="volunteer-profile-header">
      <div className="volunteer-profile-avatar" aria-label={`Foto ${profile.name}`}>
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{initials}</span>}
      </div>
      <div className="volunteer-profile-identity"><span className="eyebrow">Profil relawan</span><h1>{profile.name}</h1>
        <p><User size={15} /> {profile.username ? `@${profile.username}` : profile.email}</p>
      </div>
      <button className="button button-small button-ghost volunteer-edit-button" onClick={() => { setEditing((current) => !current); setNotice(""); }}>
        {editing ? <X size={15} /> : <Pencil size={15} />}{editing ? "Tutup" : "Edit profil"}
      </button>
    </header>
    {profile.bio && <p className="volunteer-profile-bio">{profile.bio}</p>}
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {error && <div className="notice" role="alert">{error}</div>}
    {editing && <form className="volunteer-profile-edit" onSubmit={saveProfile}>
      <label>Nama lengkap<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Bio<textarea rows="3" maxLength="500" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
      <label>URL foto profil<input type="url" maxLength="500" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://…" /></label>
      <button className="button button-small" disabled={saving}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
    </form>}

    <div className="volunteer-profile-stats">
      <div><span><Calendar size={16} /> Total aksi</span><strong>{profile.stats?.totalActions || 0}</strong></div>
      <div><span><Clock size={16} /> Jam kontribusi</span><strong>{profile.stats?.totalHours || 0}<small> jam</small></strong></div>
      <div><span><Award size={16} /> Level relawan</span><strong>{volunteerLevel}<small> · {profile.stats?.badgesCount || 0} lencana</small></strong></div>
    </div>

    <nav className="volunteer-profile-tabs" aria-label="Bagian profil relawan">
      {tabs.map(({ label, path, icon: Icon }, index) => <Link className={selectedTab === "actions" && index === 0 ? "active" : ""} key={label} to={path}><Icon size={16} />{label}</Link>)}
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
