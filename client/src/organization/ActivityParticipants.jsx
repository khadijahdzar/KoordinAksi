import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api";

const statusLabels = {
  pending: "Menunggu",
  approved: "Diterima",
  rejected: "Ditolak",
  attended: "Hadir",
  cancelled: "Dibatalkan"
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status] || status}</span>;
}

export default function ActivityParticipants() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState("");

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: activityData }, { data: registrationData }] = await Promise.all([
        api.get("/activities/mine"),
        api.get(`/registrations/activity/${id}`)
      ]);
      const ownedActivity = activityData.activities.find((item) => item._id === id);
      if (!ownedActivity) throw new Error("Kegiatan tidak ditemukan dalam daftar organisasi.");
      setActivity(ownedActivity);
      setRegistrations(registrationData.registrations);
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.response ? getErrorMessage(requestError) : requestError.message || getErrorMessage(requestError));
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  async function updateStatus(registration, status) {
    setBusyRegistrationId(registration._id);
    setError("");
    setNotice("");
    try {
      await api.patch(`/registrations/${registration._id}/status`, { status });
      if (await loadParticipants()) {
        setNotice(`Status pendaftaran berhasil diubah menjadi "${statusLabels[status]}".`);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyRegistrationId("");
    }
  }

  return <section className="organization-dashboard organization-participants">
    <Link className="back-link" to="/dashboard/organisasi">← Kembali ke kegiatan</Link>
    <div className="organization-page-heading">
      <div><span className="eyebrow">Koordinasi relawan</span>
        <h1>{activity?.title || "Daftar pendaftar"}</h1>
        {activity && <p>{activity.activeRegistrations}/{activity.capacity} relawan terdaftar · {activity.location}</p>}
      </div>
    </div>
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {error && <div className="organization-load-error" role="alert">
      <span>{error}</span><button className="button button-small button-ghost" onClick={loadParticipants}>Coba lagi</button>
    </div>}
    <div className="organization-list-heading"><h2>Pendaftar</h2>
      <span>{loading ? "Memuat..." : `${registrations.length} pendaftar`}</span></div>
    {loading && !registrations.length
      ? <div className="organization-empty-state" role="status">Memuat daftar relawan…</div>
      : <div className="organization-participant-list">
        {registrations.map((registration) => <article className="organization-participant-row" key={registration._id}>
          <span className="org-avatar">{registration.volunteer?.name?.charAt(0)?.toUpperCase() || "R"}</span>
          <div className="organization-participant-info">
            <strong>{registration.volunteer?.name || "Relawan"}</strong>
            <span>{registration.volunteer?.email || "Email tidak tersedia"}</span>
            {registration.note && <p>{registration.note}</p>}
          </div>
          <StatusBadge status={registration.status} />
          <div className="organization-participant-actions">
            {registration.status === "pending" && <>
              <button type="button" className="organization-approve-button"
                disabled={Boolean(busyRegistrationId)} onClick={() => updateStatus(registration, "approved")}>
                {busyRegistrationId === registration._id ? "Menyimpan..." : "Terima"}
              </button>
              <button type="button" className="organization-reject-button"
                disabled={Boolean(busyRegistrationId)} onClick={() => updateStatus(registration, "rejected")}>Tolak</button>
            </>}
            {registration.status === "approved" && <button type="button" className="organization-approve-button"
              disabled={Boolean(busyRegistrationId)} onClick={() => updateStatus(registration, "attended")}>
              {busyRegistrationId === registration._id ? "Menyimpan..." : "Tandai hadir"}
            </button>}
          </div>
        </article>)}
      </div>}
    {!loading && !error && !registrations.length && <div className="empty-box">
      <span>♡</span><h3>Belum ada pendaftar</h3><p>Pendaftar kegiatan akan muncul di halaman ini.</p>
    </div>}
  </section>;
}
