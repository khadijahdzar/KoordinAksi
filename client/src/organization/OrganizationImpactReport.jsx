import React, { useEffect, useState } from "react";
import { BarChart3, CalendarDays, Clock3, TrendingUp, Users } from "lucide-react";
import { getErrorMessage } from "../api";
import { getOrganizationStats } from "./orgApi";

export default function OrganizationImpactReport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOrganizationStats()
      .then(({ data }) => { if (active) setStats(data.stats); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const monthlyImpact = stats?.monthlyImpact || [];
  const peakHours = Math.max(1, ...monthlyImpact.map((item) => item.hours));
  const growth = stats?.impactGrowth || 0;

  return <section className="organization-dashboard organization-impact-page">
    <header className="organization-page-heading"><div><span className="eyebrow">RINGKASAN KONTRIBUSI</span><h1>Laporan dampak</h1><p>Pantau pertumbuhan kegiatan, partisipasi, dan jam kontribusi relawan.</p></div><div className="organization-report-period"><CalendarDays size={15} /> 6 bulan terakhir</div></header>
    {error && <div className="organization-load-error" role="alert"><span>{error}</span><button type="button" className="button button-small button-ghost" onClick={() => window.location.reload()}>Muat ulang</button></div>}
    <div className="organization-impact-metrics">
      <article><span><CalendarDays size={16} /> Kegiatan</span><strong>{loading ? "—" : stats?.totalActivities ?? 0}</strong><small>kegiatan yang dikelola</small></article>
      <article><span><Users size={16} /> Relawan</span><strong>{loading ? "—" : stats?.totalVolunteers ?? 0}</strong><small>relawan terdaftar</small></article>
      <article><span><Clock3 size={16} /> Jam kontribusi</span><strong>{loading ? "—" : stats?.totalHours ?? 0}</strong><small>jam kehadiran tercatat</small></article>
      <article><span><TrendingUp size={16} /> Pertumbuhan</span><strong>{loading ? "—" : `${growth > 0 ? "+" : ""}${growth}%`}</strong><small>dibanding bulan lalu</small></article>
    </div>
    <section className="organization-impact-chart" aria-labelledby="impact-chart-title">
      <header><div><span className="eyebrow">TREN PARTISIPASI</span><h2 id="impact-chart-title">Jam kontribusi relawan</h2></div><span className="organization-chart-legend"><i /> Jam tercatat</span></header>
      {loading ? <div className="organization-chart-skeleton" aria-label="Memuat grafik"><span /><span /><span /><span /><span /><span /></div>
        : monthlyImpact.length ? <div className="organization-bar-chart" role="img" aria-label="Grafik jam kontribusi selama enam bulan terakhir">{monthlyImpact.map((month, index) => <div className="organization-bar-column" key={`${month.month}-${index}`}><strong>{month.hours}</strong><div className="organization-bar-track"><span style={{ height: `${Math.max(4, month.hours / peakHours * 100)}%` }} /></div><small>{month.month}</small></div>)}</div>
          : <div className="organization-chart-empty"><BarChart3 size={25} /><span>Belum ada data kontribusi untuk ditampilkan.</span></div>}
    </section>
    <section className="organization-impact-summary"><div><span className="eyebrow">SKOR DAMPAK</span><strong>{loading ? "—" : stats?.impactScore ?? 0}</strong><p>Akumulasi jam kontribusi dan relawan yang tercatat pada kegiatan organisasi.</p></div><div className="organization-impact-summary-icon"><BarChart3 size={24} /></div></section>
  </section>;
}
