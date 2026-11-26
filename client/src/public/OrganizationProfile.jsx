import React, { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, Check, Heart, MapPin, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { getOrganizationActivitiesUrl } from "./organizationUtils";
import { useFollowOrganization } from "../hooks/useFollowOrganization";
import "../organization-profile-fix.css";

export default function OrganizationProfile() {
  const { id } = useParams();
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState("");
  const { isFollowed, toggleFollow, busyId } = useFollowOrganization();
  const followed = isFollowed(id);

  useEffect(() => {
    const controller = new AbortController();
    setOrganization(null);
    setError("");
    api.get(`/organizations/${id}`, { signal: controller.signal })
      .then(({ data }) => setOrganization(data.organization))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
      });
    return () => controller.abort();
  }, [id]);

  if (error) return <main className="container organization-profile-state" role="alert">
    <p>{error}</p><Link className="button" to="/organisasi">Kembali ke organisasi</Link>
  </main>;
  if (!organization) return <main className="container organization-profile-state" role="status">Memuat profil organisasi…</main>;

  const banner = organization.bannerUrl || organization.logoUrl || "/baktisosial.jpeg";
  const gallery = organization.gallery || [];

  return <main className="organization-profile-page">
    <div className="organization-profile-banner" style={{ backgroundImage: `linear-gradient(90deg,#102b1c88,#102b1c22),url("${banner}")` }} />
    <section className="container organization-profile-main">
      <Link className="organization-profile-back" to="/organisasi"><ArrowLeft size={15} /> Kembali ke organisasi</Link>
      <header className="organization-profile-header">
        <img src={organization.logoUrl || "/logokoordinaski.png"} alt={`Logo ${organization.name}`} />
        <div className="organization-profile-identity">
          <div className="organization-profile-title">
            <h1>{organization.name}</h1>
            {organization.verified && <span className="organization-profile-verified"><BadgeCheck size={16} /> Terverifikasi</span>}
          </div>
          <p>{organization.focusCategory || "Organisasi sosial"} <span aria-hidden="true">·</span> <MapPin size={14} /> {organization.address || "Indonesia"}</p>
        </div>
        <div className="organization-profile-actions">
          <button
            type="button"
            className={`organization-follow-button${followed ? " is-followed" : ""}`}
            aria-pressed={followed}
            disabled={busyId === String(id)}
            onClick={() => toggleFollow(id, { from: `/organisasi/${id}` })}
          >
            {followed ? <Check size={14} /> : <Heart size={14} />}
            {followed ? "Diikuti" : "Ikuti"}
          </button>
          <Link className="organization-active-actions-button" to={getOrganizationActivitiesUrl(organization)}>
            Lihat aksi <span className="organization-profile-action-count">({Number(organization.stats?.activeActionsCount || 0)})</span>
          </Link>
        </div>
      </header>

      <div className="organization-profile-layout">
        <div className="organization-profile-content">
          <section className="organization-profile-panel">
            <span className="eyebrow">Tentang organisasi</span>
            <h2>Misi dan kegiatan</h2>
            <p>{organization.description || "Informasi profil organisasi belum tersedia."}</p>
            <div className="organization-profile-facts">
              <span><UsersRound size={16} /><strong>{Number(organization.stats?.totalVolunteers || 0).toLocaleString("id-ID")}</strong> relawan bergabung</span>
              <span><CalendarDays size={16} /><strong>{Number(organization.stats?.activeActionsCount || 0).toLocaleString("id-ID")}</strong> aksi aktif</span>
            </div>
          </section>

          <section className="organization-profile-panel">
            <div className="organization-profile-section-heading"><div><span className="eyebrow">Dokumentasi</span><h2>Galeri aksi</h2></div></div>
            {gallery.length
              ? <div className="organization-profile-gallery">{gallery.map((image, index) =>
                <img key={`${image}-${index}`} src={image} alt={`Dokumentasi aksi ${organization.name}`} loading="lazy" />
              )}</div>
              : <p className="organization-profile-muted">Galeri aksi belum tersedia.</p>}
          </section>
        </div>

        <aside className="organization-profile-panel organization-profile-volunteers">
          <span className="eyebrow">Komunitas</span>
          <h2>Relawan bergabung</h2>
          <p className="organization-profile-muted">Terdapat {Number(organization.stats?.totalVolunteers || 0).toLocaleString("id-ID")} relawan terdaftar. Daftar nama tidak ditampilkan untuk menjaga privasi.</p>
        </aside>
      </div>
    </section>
  </main>;
}
