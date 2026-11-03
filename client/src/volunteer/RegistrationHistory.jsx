import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import api, { getErrorMessage } from "../api";

const statusDetails = {
  pending: { label: "Menunggu", className: "pending" },
  approved: { label: "Dikonfirmasi", className: "approved" },
  rejected: { label: "Ditolak", className: "rejected" },
  attended: { label: "Hadir", className: "attended" },
  cancelled: { label: "Dibatalkan", className: "cancelled" }
};

function StatusBadge({ status }) {
  const details = statusDetails[status] || { label: status, className: "unknown" };
  return <span className={`volunteer-status volunteer-status-${details.className}`}>{details.label}</span>;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export default function RegistrationHistory() {
  const { registrations, loadingRegistrations, registrationError, loadRegistrations } = useOutletContext();
  const [selected, setSelected] = useState(null);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function cancelRegistration() {
    if (!selected || cancellingId) return;
    setCancellingId(selected._id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/registrations/${selected._id}/cancel`);
      setSuccess("Pendaftaran berhasil dibatalkan.");
      setSelected(null);
      await loadRegistrations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setCancellingId("");
    }
  }

  return <section className="volunteer-dashboard volunteer-history">
    <div className="volunteer-page-heading">
      <div><span className="eyebrow">Perjalanan relawan</span><h1>Pendaftaran saya.</h1>
        <p>Lihat status dan detail kegiatan yang pernah kamu ikuti.</p></div>
      <Link className="button button-small" to="/dashboard/relawan">Jelajahi kegiatan <span>→</span></Link>
    </div>
    {success && <div className="notice notice-success" role="status">{success}</div>}
    {error && <div className="notice" role="alert">{error}</div>}
    {registrationError && !registrations.length && <div className="volunteer-feed-error" role="alert">
      <span>{registrationError}</span>
      <button className="button button-small button-ghost" onClick={loadRegistrations}>Coba lagi</button>
    </div>}
    {loadingRegistrations && !registrations.length
      ? <div className="volunteer-feed-loading" aria-live="polite">Memuat pendaftaran…</div>
      : <div className="volunteer-registration-list">
        {registrations.map((registration) => {
          const activity = registration.activity;
          const canCancel = ["pending", "approved"].includes(registration.status);
          return <article className="volunteer-registration-card" key={registration._id}>
            <div className="volunteer-registration-date">
              {activity?.date ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(activity.date)) : "—"}
            </div>
            <div className="volunteer-registration-info">
              <span className="volunteer-category">{activity?.category || "Kegiatan"}</span>
              <h2>{activity?.title || "Kegiatan tidak lagi tersedia"}</h2>
              <p>{activity?.organization?.name || "Organisasi"}{activity?.location ? ` · ${activity.location}` : ""}</p>
              {activity?.date && <time dateTime={new Date(activity.date).toISOString()}>{formatDate(activity.date)}</time>}
            </div>
            <div className="volunteer-registration-actions">
              <StatusBadge status={registration.status} />
              {canCancel && <button className="button button-small button-ghost"
                disabled={Boolean(cancellingId)} onClick={() => setSelected(registration)}>Batalkan</button>}
              {activity?._id && <Link className="volunteer-detail-link" to={`/kegiatan/${activity._id}`}>Detail →</Link>}
            </div>
          </article>;
        })}
      </div>}
    {!loadingRegistrations && !registrationError && !registrations.length && <div className="empty-box">
      <span>♡</span><h3>Belum ada pendaftaran</h3><p>Temukan kegiatan pertamamu dan mulai ikut berkontribusi.</p>
      <Link className="text-link" to="/dashboard/relawan">Jelajahi kegiatan →</Link>
    </div>}

    {selected && <div className="volunteer-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !cancellingId) setSelected(null);
    }}>
      <section className="volunteer-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
        <span className="eyebrow">Konfirmasi pembatalan</span>
        <h2 id="cancel-title">Batalkan pendaftaran?</h2>
        <p>Pendaftaran untuk <strong>{selected.activity?.title || "kegiatan ini"}</strong> akan dibatalkan. Slot yang kamu lepaskan akan dikembalikan ke kuota publik agar dapat didaftarkan relawan lain.</p>
        <div>
          <button className="button button-ghost" disabled={Boolean(cancellingId)} onClick={() => setSelected(null)}>Kembali</button>
          <button className="button volunteer-cancel-confirm" disabled={Boolean(cancellingId)} onClick={cancelRegistration}>
            {cancellingId ? "Membatalkan..." : "Ya, batalkan"}
          </button>
        </div>
      </section>
    </div>}
  </section>;
}
