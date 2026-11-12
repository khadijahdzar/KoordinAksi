import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api, { getErrorMessage } from "../api";
import { getActivityImage } from "./activityImages";
import { getMockActivityById } from "./activityMockData";

const facilities = ["Konsumsi", "E-sertifikat", "Atribut kegiatan", "Transportasi lokal"];
const donationPackages = [
  { id: "regular", label: "Reguler", amount: 50000, description: "Dukungan bibit dan kebutuhan konservasi" },
  { id: "supporter", label: "Supporter", amount: 100000, description: "Dukungan konservasi plus paket apresiasi" }
];

function formatActivityDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Jadwal menyusul";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsedDate);
}

function Notice({ message, success = false }) {
  return <div className={`notice${success ? " notice-success" : ""}`} role="status">{message}</div>;
}

export default function ActivityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [path, setPath] = useState("volunteer");
  const [packageId, setPackageId] = useState("regular");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const mockActivity = getMockActivityById(id);
    if (mockActivity) {
      setActivity(mockActivity);
      setError("");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setActivity(null);
    setLoading(true);
    api.get(`/activities/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setActivity(data.activity);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  async function joinActivity(event) {
    event.preventDefault();
    setMessage("");
    if (activity?._id.startsWith("demo-")) {
      setMessage("Kegiatan ini merupakan data demonstrasi; pendaftaran belum tersedia.");
      return;
    }
    if (path === "donation") {
      setMessage("Pembayaran belum tersedia. Silakan pilih Jalur Relawan Murni untuk mendaftar.");
      return;
    }
    if (user?.role !== "volunteer") {
      navigate("/login", { state: { from: location } });
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const registrationNote = [
        "Jalur keikutsertaan: Relawan Murni",
        note.trim()
      ].filter(Boolean).join("\n");
      await api.post("/registrations", { activityId: id, note: registrationNote });
      setMessage("Pendaftaran berhasil dikirim. Organisasi akan meninjau permohonanmu.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container activity-detail-state" role="status">Memuat detail kegiatan…</div>;
  if (error && !activity) return <div className="container activity-detail-state" role="alert">
    <Notice message={error} /><Link className="button" to="/jelajah">Kembali ke Jelajah</Link>
  </div>;
  if (!activity) return <div className="container activity-detail-state" role="alert">
    <p>Kegiatan tidak ditemukan.</p><Link className="button" to="/jelajah">Kembali ke Jelajah</Link>
  </div>;

  const isDemo = String(activity._id).startsWith("demo-");
  const isVerified = activity.organization
    ? Boolean(activity.organization.verified)
    : Boolean(activity.isVerified);
  const selectedPackage = donationPackages.find((item) => item.id === packageId) || donationPackages[0];
  const eventDate = formatActivityDate(activity.date);
  const endDate = activity.endDate ? formatActivityDate(activity.endDate) : "";

  return <section className="activity-detail-page">
    <div className="container activity-detail-container">
      <Link className="activity-detail-back" to="/jelajah"><ArrowLeft size={16} /> Kembali ke Jelajah</Link>
      {isDemo && <Notice message="Ini adalah data demonstrasi. Informasi dan pendaftaran belum dikonfirmasi oleh penyelenggara." />}

      <section className="activity-detail-banner">
        <img src={getActivityImage(activity)} alt={`Dokumentasi kegiatan ${activity.title}`} />
        <div className="activity-detail-banner-shade" />
        <div className="activity-detail-banner-content">
          <span className="activity-detail-category">{activity.category}</span>
          <h1>{activity.title}</h1>
          <div className="activity-detail-organizer">
            <span className="activity-detail-organizer-mark">{activity.organization?.name?.slice(0, 1) || "O"}</span>
            <span>{activity.organization?.name || "Organisasi penyelenggara"}</span>
            {isVerified && <span className="activity-detail-verified"><BadgeCheck size={14} /> Terverifikasi</span>}
          </div>
        </div>
      </section>

      <div className="activity-detail-columns">
        <div className="activity-detail-main-column">
          <section className="activity-detail-panel">
            <span className="eyebrow">Tentang kegiatan</span>
            <h2>Tentang Aksi</h2>
            <p className="activity-detail-description">{activity.description || "Deskripsi kegiatan akan diperbarui oleh penyelenggara."}</p>
            {activity._id === "demo-activity-green" && <p className="activity-detail-description">
              Bersama warga dan relawan, peserta akan membersihkan area sungai, menanam bibit, serta mempelajari cara merawat kawasan hijau. Aksi ini dirancang untuk memberi dampak berkelanjutan dan terbuka bagi relawan pemula.
            </p>}
          </section>

          <section className="activity-detail-panel">
            <span className="eyebrow">Informasi lapangan</span>
            <h2>Detail Teknis Pelaksanaan</h2>
            <div className="activity-detail-info-grid">
              <div><CalendarDays size={18} /><span><small>Jadwal</small><strong>{eventDate}{endDate ? ` – ${endDate}` : ""}</strong></span></div>
              <div><MapPin size={18} /><span><small>Lokasi</small><strong>{activity.location || "Lokasi menyusul"}</strong></span></div>
              <div><Clock3 size={18} /><span><small>Jam efektif</small><strong>{activity.startTime || "Sesuai jadwal kegiatan"}</strong></span></div>
              <div><UsersRound size={18} /><span><small>Target relawan</small><strong>{activity.capacity || "—"} peserta</strong></span></div>
            </div>
          </section>

          <section className="activity-detail-panel">
            <span className="eyebrow">Dukungan penyelenggara</span>
            <h2>Fasilitas & Dukungan Terjamin</h2>
            <ul className="activity-detail-facilities">
              {(activity.facilities?.length ? activity.facilities : facilities).map((facility) => <li key={facility}><Check size={16} />{facility}</li>)}
            </ul>
            {!activity.facilities?.length && !isDemo && <p className="activity-detail-facility-note">Rincian fasilitas dikonfirmasi oleh penyelenggara.</p>}
          </section>
          <Link className="activity-detail-bottom-back" to="/jelajah"><ArrowLeft size={15} /> Kembali ke Jelajah</Link>
        </div>

        <aside className="activity-join-card">
          <span className="eyebrow">Ambil bagian</span>
          <h2>Pilih Jalur Keikutsertaan</h2>
          <p className="activity-join-intro">Pilih cara berkontribusi yang paling sesuai untukmu.</p>
          {error && <Notice message={error} />}
          {message && <Notice message={message} success={!isDemo && path === "volunteer" && message.startsWith("Pendaftaran berhasil")} />}

          <form onSubmit={joinActivity}>
            <label className={`activity-path-option${path === "volunteer" ? " is-selected" : ""}`}>
              <input type="radio" name="participation-path" value="volunteer" checked={path === "volunteer"}
                onChange={() => { setPath("volunteer"); setMessage(""); }} />
              <span className="activity-path-copy"><strong>Jalur Relawan Murni</strong><small>Berpartisipasi langsung tanpa biaya</small></span>
              <strong className="activity-path-price">Gratis</strong>
            </label>
            <label className={`activity-path-option${path === "donation" ? " is-selected" : ""}`}>
              <input type="radio" name="participation-path" value="donation" checked={path === "donation"}
                onChange={() => { setPath("donation"); setMessage(""); }} />
              <span className="activity-path-copy"><strong>Jalur Mandiri & Donasi</strong><small>Dukung kebutuhan aksi konservasi</small></span>
            </label>
            {path === "donation" && <div className="activity-donation-packages">
              {donationPackages.map((option) => <label key={option.id} className={`activity-donation-package${packageId === option.id ? " is-selected" : ""}`}>
                <input type="radio" name="donation-package" value={option.id} checked={packageId === option.id}
                  onChange={() => setPackageId(option.id)} />
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
                <strong>Rp{option.amount.toLocaleString("id-ID")}</strong>
              </label>)}
            </div>}
            <div className="activity-join-assurance"><ShieldCheck size={16} /><span>Informasi kegiatan dan penyelenggara ditampilkan secara transparan.</span></div>
            {path === "volunteer" && user?.role === "volunteer" && !isDemo && <label className="activity-join-note">
              Pesan untuk penyelenggara (opsional)
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows="3" placeholder="Ceritakan motivasimu" />
            </label>}
            <button className="activity-join-submit" type="submit" disabled={submitting}>
              {submitting ? "Mengirim pendaftaran…" : path === "donation" ? "Lanjut ke Pembayaran" : isDemo ? "Ikut Beraksi Sekarang" : "Ikut Beraksi Sekarang"}
            </button>
            {path === "donation" && <small className="activity-payment-note">Pembayaran belum terhubung; belum ada transaksi yang akan diproses.</small>}
          </form>
        </aside>
      </div>
    </div>
  </section>;
}
