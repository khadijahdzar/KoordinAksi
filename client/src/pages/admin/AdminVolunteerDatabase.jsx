import React, { useCallback, useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import api, { getErrorMessage } from "../../api";

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "Belum ada aktivitas";
}

export default function AdminVolunteerDatabase() {
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");
  const [activityStatus, setActivityStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVolunteers = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/volunteers-database", {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          activityStatus: activityStatus || undefined,
          sortBy,
          sortOrder
        },
        signal
      });
      setVolunteers(data.volunteers);
      setPagination(data.pagination);
    } catch (requestError) {
      if (!signal?.aborted) setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activityStatus, page, search, sortBy, sortOrder]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadVolunteers(controller.signal), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadVolunteers]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return <section className="admin-dashboard admin-data-page">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Direktori relawan</span><h1>Konsol database relawan</h1>
        <p>Data akun, kontribusi terverifikasi, dan aktivitas relawan di KoordinAksi.</p></div>
      <span className="admin-count admin-queue-count"><Users size={15} /> {pagination.total.toLocaleString("id-ID")} relawan</span>
    </header>
    {error && <div className="admin-error" role="alert"><span>{error}</span>
      <button type="button" className="button button-small button-ghost" onClick={() => loadVolunteers()}>Coba lagi</button></div>}
    <section className="admin-panel">
      <div className="admin-data-filters admin-volunteer-filters">
        <label className="admin-search-field"><Search size={16} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => changeFilter(setSearch, event.target.value)}
            placeholder="Cari nama, email, atau kota" aria-label="Cari relawan" /></label>
        <select value={activityStatus} onChange={(event) => changeFilter(setActivityStatus, event.target.value)} aria-label="Filter status aktivitas relawan">
          <option value="">Semua aktivitas</option><option value="active">Memiliki kegiatan aktif</option><option value="inactive">Belum ada kegiatan aktif</option>
        </select>
        <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} aria-label="Urutkan relawan berdasarkan">
          <option value="createdAt">Tanggal bergabung</option><option value="name">Nama</option>
          <option value="totalHours">Jam dampak</option><option value="lastActivity">Aktivitas terakhir</option>
        </select>
        <button type="button" className="admin-sort-order" aria-label={sortOrder === "asc" ? "Urutan menaik" : "Urutan menurun"}
          onClick={() => { setSortOrder((value) => value === "asc" ? "desc" : "asc"); setPage(1); }}>
          {sortOrder === "asc" ? "A–Z / ↑" : "Z–A / ↓"}
        </button>
      </div>
      {loading
        ? <div className="admin-table-state" role="status"><span className="admin-spinner" aria-hidden="true" /> Memuat database relawan…</div>
        : volunteers.length
          ? <div className="admin-table-wrap"><table className="admin-data-table">
            <thead><tr><th scope="col">Relawan</th><th scope="col">Kontak &amp; kota</th><th scope="col">Jam dampak</th>
              <th scope="col">Kegiatan aktif</th><th scope="col">Aktivitas terakhir</th></tr></thead>
            <tbody>{volunteers.map((volunteer) => <tr key={volunteer._id}>
              <td data-label="Relawan"><strong>{volunteer.name}</strong><small>Bergabung {formatDate(volunteer.createdAt)}</small></td>
              <td data-label="Kontak & kota"><strong>{volunteer.email}</strong><small>{volunteer.city || "Kota belum diisi"}{volunteer.phone ? ` · ${volunteer.phone}` : ""}</small></td>
              <td data-label="Jam dampak"><strong>{Number(volunteer.totalHours || 0).toLocaleString("id-ID")} jam</strong></td>
              <td data-label="Kegiatan aktif"><span className={`admin-status-pill is-${volunteer.activityStatus}`}>
                {volunteer.activityStatus === "active" ? `${volunteer.activeRegistrationCount} kegiatan` : "Tidak aktif"}
              </span></td>
              <td data-label="Aktivitas terakhir">{formatDate(volunteer.lastActivity)}</td>
            </tr>)}</tbody>
          </table></div>
          : <div className="admin-table-state"><strong>Relawan tidak ditemukan</strong><span>Ubah kata kunci atau filter aktivitas.</span></div>}
      <div className="admin-pagination">
        <span>{pagination.total.toLocaleString("id-ID")} hasil · Halaman {page} dari {Math.max(1, pagination.pages)}</span>
        <div><button type="button" className="button button-small button-ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
          <button type="button" className="button button-small button-ghost" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Berikutnya</button></div>
      </div>
    </section>
  </section>;
}
