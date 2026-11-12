import React, { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, MapPin, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api";
import { getMockOrganizationById, getOrganizationActivitiesUrl } from "./organizationMockData";

export default function OrganizationProfile() {
  const { id } = useParams();
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const mockOrganization = getMockOrganizationById(id);
    if (mockOrganization) {
      setOrganization(mockOrganization);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    setOrganization(null);
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

  const isSimulated = Boolean(organization.simulated);
  const banner = organization.bannerUrl || organization.logoUrl || "/baktisosial.jpeg";
  const gallery = organization.gallery || [];
  const volunteers = organization.volunteers || [];

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
            {isSimulated && <span className="organization-profile-simulated">Profil simulasi</span>}
          </div>
          <p>{organization.focusCategory || "Organisasi sosial"} <span aria-hidden="true">·</span> <MapPin size={14} /> {organization.address || "Indonesia"}</p>
        </div>
        <Link className="button organization-profile-action" to={getOrganizationActivitiesUrl(organization)}>Lihat kegiatan</Link>
      </header>
      {isSimulated && <p className="organization-profile-demo-note" role="note">Profil dan angka berikut merupakan data simulasi, bukan informasi organisasi terverifikasi.</p>}

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
          {isSimulated
            ? <ul>{volunteers.map((volunteer) => <li key={volunteer}><span>{volunteer.slice(0, 1)}</span>{volunteer}</li>)}</ul>
            : <p className="organization-profile-muted">Terdapat {Number(organization.stats?.totalVolunteers || 0).toLocaleString("id-ID")} relawan terdaftar. Daftar nama tidak ditampilkan untuk menjaga privasi.</p>}
        </aside>
      </div>
    </section>
  </main>;
}
