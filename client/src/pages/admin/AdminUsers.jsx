import React, { useCallback, useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import api, { getErrorMessage } from "../../api";

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "—";
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users", {
        params: { page, limit: 20, search: search.trim() || undefined, role: role || undefined },
        signal
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (requestError) {
      if (!signal?.aborted) setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, role, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadUsers(controller.signal), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadUsers]);

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return <section className="admin-dashboard admin-data-page">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Manajemen pengguna</span><h1>Pengguna KoordinAksi</h1>
        <p>Daftar akun relawan dan organisasi beserta perannya di platform.</p></div>
      <span className="admin-count admin-queue-count"><Users size={15} /> {pagination.total.toLocaleString("id-ID")} pengguna</span>
    </header>
    {error && <div className="admin-error" role="alert"><span>{error}</span>
      <button type="button" className="button button-small button-ghost" onClick={() => loadUsers()}>Coba lagi</button></div>}
    <section className="admin-panel">
      <div className="admin-data-filters admin-user-filters">
        <label className="admin-search-field"><Search size={16} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)}
            placeholder="Cari nama atau email" aria-label="Cari pengguna" /></label>
        <select value={role} onChange={(event) => updateFilter(setRole, event.target.value)} aria-label="Filter peran pengguna">
          <option value="">Semua peran</option>
          <option value="volunteer">Relawan</option>
          <option value="organization">Organisasi</option>
        </select>
      </div>
      {loading
        ? <div className="admin-table-state" role="status"><span className="admin-spinner" aria-hidden="true" /> Memuat pengguna…</div>
        : users.length
          ? <div className="admin-table-wrap"><table className="admin-data-table">
            <thead><tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Peran</th>
              <th scope="col">Organisasi</th><th scope="col">Terdaftar</th></tr></thead>
            <tbody>{users.map((account) => <tr key={account._id}>
              <td data-label="Nama"><strong>{account.name}</strong></td>
              <td data-label="Email">{account.email}</td>
              <td data-label="Peran"><span className={`admin-status-pill is-${account.role}`}>
                {account.role === "organization" ? "Organisasi" : "Relawan"}
              </span></td>
              <td data-label="Organisasi">{account.organization?.name || "—"}</td>
              <td data-label="Terdaftar">{formatDate(account.createdAt)}</td>
            </tr>)}</tbody>
          </table></div>
          : <div className="admin-table-state"><strong>Pengguna tidak ditemukan</strong><span>Ubah kata kunci atau filter peran.</span></div>}
      <div className="admin-pagination">
        <span>{pagination.total.toLocaleString("id-ID")} hasil · Halaman {page} dari {Math.max(1, pagination.pages)}</span>
        <div><button type="button" className="button button-small button-ghost" disabled={page <= 1 || loading}
          onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
          <button type="button" className="button button-small button-ghost" disabled={page >= pagination.pages || loading}
            onClick={() => setPage((value) => value + 1)}>Berikutnya</button></div>
      </div>
    </section>
  </section>;
}
