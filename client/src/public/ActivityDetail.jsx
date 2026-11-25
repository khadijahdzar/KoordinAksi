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

const facilities = ["Konsumsi", "E-sertifikat", "Atribut kegiatan", "Transportasi lokal"];
const donationPackages = [
  { id: "regular", label: "Reguler", amount: 50000, description: "Dukungan bibit dan kebutuhan konservasi" },
  { id: "supporter", label: "Supporter", amount: 100000, description: "Dukungan konservasi plus paket apresiasi" }
];
let midtransSnapPromise;

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

function loadMidtransSnap(clientKey, isProduction) {
  if (window.snap) return Promise.resolve(window.snap);
  if (midtransSnapPromise) return midtransSnapPromise;
  const scriptId = "midtrans-snap-script";
  let script = document.getElementById(scriptId);
  const isNewScript = !script;
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://app${isProduction ? "" : ".sandbox"}.midtrans.com/snap/snap.js?client-key=${encodeURIComponent(clientKey)}`;
    script.async = true;
  }
  midtransSnapPromise = new Promise((resolve, reject) => {
    script.addEventListener("load", () => {
      if (window.snap) resolve(window.snap);
      else {
        midtransSnapPromise = null;
        script.remove();
        reject(new Error("Checkout Midtrans gagal dimuat."));
      }
    }, { once: true });
    script.addEventListener("error", () => {
      midtransSnapPromise = null;
      script.remove();
      reject(new Error("Checkout Midtrans gagal dimuat."));
    }, { once: true });
    if (isNewScript) document.body.appendChild(script);
  });
  return midtransSnapPromise;
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
  // null = belum dicek; true = gateway siap; false = key belum terbaca
  const [paymentGatewayReady, setPaymentGatewayReady] = useState(null);
  const [donationTotals, setDonationTotals] = useState({ totalAmount: 0, count: 0 });

  useEffect(() => {
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

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    api.get(`/payments/activity/${id}`, { signal: controller.signal })
      .then(({ data }) => setDonationTotals({ totalAmount: data.totalAmount || 0, count: data.count || 0 }))
      .catch(() => {});
    return () => controller.abort();
  }, [id]);

  // Cek status gateway saat halaman dibuka (dan bisa diulang)
  useEffect(() => {
    const controller = new AbortController();
    api.get("/payments/status", { signal: controller.signal })
      .then(({ data }) => setPaymentGatewayReady(Boolean(data.ready)))
      .catch(() => setPaymentGatewayReady(null));
    return () => controller.abort();
  }, []);

  async function refreshGatewayStatus() {
    try {
      const { data } = await api.get("/payments/status");
      setPaymentGatewayReady(Boolean(data.ready));
      if (data.ready) setMessage("");
      return data.ready;
    } catch {
      setPaymentGatewayReady(null);
      return null;
    }
  }

  async function joinActivity(event) {
    event.preventDefault();
    setMessage("");
    if (path === "donation") {
      if (user?.role !== "volunteer") {
        navigate("/login", { state: { from: location } });
        return;
      }

      // Cek ulang status sebelum menyerah
      if (paymentGatewayReady === false) {
        const ready = await refreshGatewayStatus();
        if (!ready) {
          setMessage("Pembayaran belum tersedia. Pastikan key Midtrans di server/.env sudah diisi, lalu restart server.");
          return;
        }
      }

      setSubmitting(true);
      setError("");
      try {
        const { data } = await api.post("/payments", { activityId: id, packageId });
        setPaymentGatewayReady(true);
        const snap = await loadMidtransSnap(data.clientKey, data.isProduction);
        snap.pay(data.snapToken, {
          onSuccess: () => {
            setMessage("Pembayaran selesai di Midtrans. Status akhir akan dikonfirmasi melalui notifikasi.");
            setSubmitting(false);
          },
          onPending: () => {
            setMessage("Pembayaran menunggu konfirmasi di Midtrans.");
            setSubmitting(false);
          },
          onError: () => {
            setError("Pembayaran gagal diproses oleh Midtrans. Silakan coba lagi.");
            setSubmitting(false);
          },
          onClose: () => {
            setMessage("Checkout ditutup. Status pembayaran dapat diperiksa kembali nanti.");
            setSubmitting(false);
          }
        });
      } catch (requestError) {
        const status = requestError.response?.status;
        const apiMessage = getErrorMessage(requestError);
        if (status === 503) {
          setPaymentGatewayReady(false);
          setMessage("Pembayaran belum tersedia. Pastikan key Midtrans di server/.env sudah diisi, lalu restart server.");
          setError("");
        } else if (status === 401 || status === 403) {
          setError("Sesi relawan diperlukan untuk donasi. Silakan masuk kembali.");
        } else if (status === 502) {
          setError(apiMessage || "Midtrans menolak transaksi. Periksa Server Key / Client Key sandbox.");
        } else if (!requestError.response) {
          setError("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
        } else {
          setError(apiMessage);
        }
        setSubmitting(false);
      }
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

  const isVerified = activity.organization
    ? Boolean(activity.organization.verified)
    : Boolean(activity.isVerified);
  const eventDate = formatActivityDate(activity.date);
  const endDate = activity.endDate ? formatActivityDate(activity.endDate) : "";

  return <section className="activity-detail-page">
    <div className="container activity-detail-container">
      <Link className="activity-detail-back" to="/jelajah"><ArrowLeft size={16} /> Kembali ke Jelajah</Link>

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
            {!activity.facilities?.length && <p className="activity-detail-facility-note">Rincian fasilitas dikonfirmasi oleh penyelenggara.</p>}
          </section>
          <Link className="activity-detail-bottom-back" to="/jelajah"><ArrowLeft size={15} /> Kembali ke Jelajah</Link>
        </div>

        <aside className="activity-join-card">
          <span className="eyebrow">Ambil bagian</span>
          <h2>Pilih Jalur Keikutsertaan</h2>
          <p className="activity-join-intro">Pilih cara berkontribusi yang paling sesuai untukmu.</p>
          {donationTotals.count > 0 && (
            <p className="activity-donation-raised">
              Sudah terkumpul <strong>Rp{donationTotals.totalAmount.toLocaleString("id-ID")}</strong>
              {" "}dari {donationTotals.count} donasi untuk kegiatan ini.
            </p>
          )}
          {error && <Notice message={error} />}
          {message && <Notice message={message} success={message.startsWith("Pendaftaran berhasil") || message.startsWith("Pembayaran selesai") || message.startsWith("Pembayaran menunggu")} />}

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
            {path === "volunteer" && user?.role === "volunteer" && <label className="activity-join-note">
              Pesan untuk penyelenggara (opsional)
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows="3" placeholder="Ceritakan motivasimu" />
            </label>}
            <button className="activity-join-submit" type="submit" disabled={submitting}>
              {submitting
                ? (path === "donation" ? "Menyiapkan pembayaran…" : "Mengirim pendaftaran…")
                : path === "donation"
                  ? "Lanjut ke Pembayaran"
                  : "Ikut Beraksi Sekarang"}
            </button>
            {path === "donation" && (
              <small className="activity-payment-note">
                {paymentGatewayReady === false
                  ? "Key Midtrans belum terbaca server. Restart backend setelah mengisi server/.env."
                  : paymentGatewayReady === true
                    ? "Pembayaran diproses dengan aman melalui Midtrans Snap."
                    : "Memeriksa status gateway pembayaran…"}
              </small>
            )}
          </form>
        </aside>
      </div>
    </div>
  </section>;
}
