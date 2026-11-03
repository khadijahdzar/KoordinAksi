import React from "react";
import { Link } from "react-router-dom";

function formatActivityDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(date));
}

export default function ActivityCard({ activity, isRegistered, busy, onRegister }) {
  const capacity = Number(activity.capacity) || 0;
  const activeRegistrations = Number(activity.activeRegistrations) || 0;
  const full = activeRegistrations >= capacity;
  const progress = capacity > 0
    ? Math.min(100, Math.round(activeRegistrations / capacity * 100))
    : 0;

  return <article className="volunteer-activity-card">
    <div className="volunteer-card-topline">
      <span className="volunteer-category">{activity.category}</span>
      <span className="volunteer-activity-code">AKSI SOSIAL</span>
    </div>
    <h3><Link to={`/kegiatan/${activity._id}`}>{activity.title}</Link></h3>
    <div className="volunteer-organization">
      <span className="org-avatar">{activity.organization?.name?.charAt(0) || "O"}</span>
      <span>{activity.organization?.name || "Organisasi"}</span>
      {activity.organization?.verified && <span className="volunteer-verified" title="Organisasi terverifikasi" aria-label="Organisasi terverifikasi">✓ Terverifikasi</span>}
    </div>
    <div className="volunteer-activity-meta">
      <span><b aria-hidden="true">◷</b>{formatActivityDate(activity.date)}</span>
      <span><b aria-hidden="true">⌖</b>{activity.location}</span>
    </div>
    <div className="volunteer-capacity">
      <div><span>Kuota relawan</span><strong>{activeRegistrations}/{capacity} terisi</strong></div>
      <div className="volunteer-capacity-track" role="progressbar"
        aria-label="Kapasitas kegiatan" aria-valuemin="0" aria-valuemax={capacity}
        aria-valuenow={Math.min(activeRegistrations, capacity)}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
    <button className={`button volunteer-register-button${full ? " is-full" : ""}`}
      type="button" disabled={busy || full || isRegistered}
      onClick={() => onRegister(activity._id)}>
      {busy ? "Mendaftarkan..." : full ? "Penuh" : isRegistered ? "Terdaftar" : "Daftar Sekarang"}
    </button>
  </article>;
}
