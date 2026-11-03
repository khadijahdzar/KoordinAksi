import React, { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "./api";
import AdminToast from "./admin/AdminToast";

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));
}

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [reviewingId, setReviewingId] = useState("");
  const dismissToast = useCallback(() => setToast(null), []);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/organizations/pending");
      setOrganizations(data.organizations);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  async function approveOrganization(organization) {
    if (reviewingId) return;
    setReviewingId(organization._id);
    setError("");
    setToast(null);
    try {
      await api.patch(`/organizations/${organization._id}/verify`, { verified: true });
      setOrganizations((current) => current.filter((item) => item._id !== organization._id));
      setToast({ type: "success", message: `${organization.name} berhasil diverifikasi.` });
    } catch (requestError) {
      setToast({ type: "error", message: getErrorMessage(requestError) });
    } finally {
      setReviewingId("");
    }
  }

  return <section className="admin-dashboard admin-organization-page">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Manajemen organisasi</span><h1>Antrean verifikasi</h1>
        <p>Tinjau informasi organisasi sebelum mereka dapat menerbitkan kegiatan.</p></div>
      <span className="admin-count admin-queue-count">{loading ? "…" : `${organizations.length} menunggu`}</span>
    </header>
    <AdminToast toast={toast} onDismiss={dismissToast} />
    {error && <div className="admin-error" role="alert">
      <span>{error}</span><button type="button" className="button button-small button-ghost" onClick={loadOrganizations}>Coba lagi</button>
    </div>}
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><span className="eyebrow">Tinjauan admin</span><h2>Organisasi menunggu persetujuan</h2></div>
        <span className="admin-count">{loading ? "—" : organizations.length}</span>
      </div>
      {loading
        ? <div className="admin-table-state" role="status">Memuat data organisasi…</div>
        : organizations.length
          ? <div className="admin-table-wrap">
            <table className="admin-organization-table">
              <thead><tr>
                <th scope="col">Organisasi</th><th scope="col">Pemilik</th>
                <th scope="col">Tanggal daftar</th><th scope="col">Informasi</th>
                <th scope="col"><span className="visually-hidden">Tindakan</span></th>
              </tr></thead>
              <tbody>{organizations.map((organization) => <tr key={organization._id}>
                <td data-label="Organisasi"><strong>{organization.name}</strong>
                  <small>{organization.email || "Email tidak tersedia"}</small></td>
                <td data-label="Pemilik"><strong>{organization.owner?.name || "Pemilik tidak tersedia"}</strong>
                  <small>{organization.owner?.email || "Email tidak tersedia"}</small></td>
                <td data-label="Tanggal daftar">{formatDate(organization.createdAt)}</td>
                <td data-label="Informasi">
                  {organization.description
                    ? <span className="admin-organization-description" title={organization.description}>{organization.description}</span>
                    : <span className="admin-organization-no-description">Deskripsi belum tersedia</span>}
                  {organization.address && <small className="admin-organization-address">{organization.address}</small>}
                </td>
                <td data-label="Tindakan"><button type="button" className="button button-small"
                  disabled={Boolean(reviewingId)} onClick={() => approveOrganization(organization)}>
                  {reviewingId === organization._id
                    ? <><span className="admin-spinner" aria-hidden="true" /> Memverifikasi…</>
                    : "Verifikasi / Setujui"}
                </button></td>
              </tr>)}</tbody>
            </table>
          </div>
          : !error && <div className="admin-table-state">
            <strong>Antrean verifikasi kosong</strong>
            <span>Organisasi baru yang menunggu persetujuan akan tampil di sini.</span>
          </div>}
      <p className="admin-document-note">Informasi yang tersedia berasal dari profil organisasi dan akun pemilik. Dokumen pendukung belum disediakan oleh API saat ini.</p>
    </section>
  </section>;
}
