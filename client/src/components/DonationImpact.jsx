import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Sparkles } from "lucide-react";
import api, { getErrorMessage } from "../api";

function formatRp(amount) {
  return `Rp${Number(amount || 0).toLocaleString("id-ID")}`;
}

function formatTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export default function DonationImpact() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      api.get("/payments/impact")
        .then(({ data: payload }) => {
          if (!active) return;
          setData(payload);
          setError("");
        })
        .catch((err) => {
          if (!active) return;
          setError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading && !data) {
    return <section className="donation-impact section container" data-reveal>
      <p className="donation-impact-loading">Memuat dampak donasi…</p>
    </section>;
  }

  if (error && !data) return null;

  const totalAmount = data?.totalAmount || 0;
  const totalDonations = data?.totalDonations || 0;
  const goal = data?.goal || 5000000;
  const progress = data?.progressPercent ?? Math.min(100, Math.round((totalAmount / goal) * 100));
  const campaigns = data?.campaigns || [];
  const recent = data?.recentDonors || [];
  const maxCampaign = Math.max(...campaigns.map((c) => c.amount), 1);

  return <section className="donation-impact section container" data-reveal>
    <div className="section-heading">
      <div>
        <span className="eyebrow">Transparansi donasi</span>
        <h2>Donasi tersalurkan,<br />dampak terlihat.</h2>
        <p className="donation-impact-lead">
          Setiap dukungan mandiri tercatat real-time: ke kegiatan mana dana disalurkan, dan siapa yang baru saja berkontribusi.
        </p>
      </div>
      <Link to="/jelajah" className="text-link">Dukung sebuah aksi <span>→</span></Link>
    </div>

    <div className="donation-impact-grid">
      <article className="donation-impact-summary">
        <div className="donation-impact-summary-top">
          <span className="donation-impact-icon"><HeartHandshake size={22} /></span>
          <div>
            <small>Total tersalurkan</small>
            <strong>{formatRp(totalAmount)}</strong>
          </div>
        </div>
        <div className="donation-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="donation-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="donation-progress-meta">
          <span>{progress}% dari target tampilan {formatRp(goal)}</span>
          <span>{totalDonations} donasi</span>
        </div>
        {campaigns.length === 0 && (
          <p className="donation-impact-empty">
            Belum ada donasi berstatus lunas. Setelah gateway Midtrans aktif dan ada pembayaran sukses, progress bar dan daftar donor akan terisi otomatis.
          </p>
        )}
        <ul className="donation-campaign-list">
          {campaigns.map((campaign) => (
            <li key={String(campaign.activityId)}>
              <div className="donation-campaign-head">
                <div>
                  <strong>{campaign.title}</strong>
                  <small>{campaign.organizationName} · {campaign.category}</small>
                </div>
                <span>{formatRp(campaign.amount)}</span>
              </div>
              <div className="donation-campaign-bar">
                <i style={{ width: `${Math.max(8, Math.round((campaign.amount / maxCampaign) * 100))}%` }} />
              </div>
              <small className="donation-campaign-count">{campaign.count} donatur</small>
              {campaign.activityId && (
                <Link className="donation-campaign-link" to={`/kegiatan/${campaign.activityId}`}>
                  Lihat kegiatan →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </article>

      <article className="donation-impact-feed">
        <div className="donation-impact-feed-head">
          <Sparkles size={18} />
          <h3>Donatur terbaru</h3>
        </div>
        {recent.length === 0 ? (
          <p className="donation-impact-empty">Menunggu donasi pertama. Jadilah yang membuka daftar ini.</p>
        ) : (
          <ul className="donation-donor-list">
            {recent.map((donor) => (
              <li key={String(donor.id)}>
                <span className="donation-donor-avatar">{(donor.donorName || "?").slice(0, 1)}</span>
                <div>
                  <strong>{donor.donorName}</strong>
                  <small>
                    {donor.packageLabel} · {donor.activityTitle}
                    {donor.organizationName ? ` · ${donor.organizationName}` : ""}
                  </small>
                </div>
                <div className="donation-donor-meta">
                  <b>{formatRp(donor.amount)}</b>
                  <time dateTime={donor.paidAt}>{formatTime(donor.paidAt)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  </section>;
}
