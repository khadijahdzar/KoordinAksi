import React, { useCallback, useEffect, useState } from "react";
import { Search, Trash2, Users } from "lucide-react";
import api, { getErrorMessage } from "../../api";
import AdminToast from "../../admin/AdminToast";

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
  const [selected, setSelected] = useState(null);
  const [workingId, setWorkingId] = useState("");
  const [toast, setToast] = useState(null);

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

  async function deleteUser() {
    if (!selected || workingId) return;
    setWorkingId(selected._id);
    setToast(null);
    try {
      await api.delete(`/admin/users/${selected._id}`);
      setSelected(null);
      setToast({ type: "success", message: "Akun pengguna berhasil dihapus." });
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (requestError) {
      setToast({ type: "error", message: getErrorMessage(requestError) });
    } finally {
      setWorkingId("");
    }
  }

  return <section className="admin-dashboard admin-data-page">
    <header className="admin-page-heading">
      <div><span className="eyebrow">Manajemen pengguna</span><h1>Pengguna KoordinAksi</h1>
        <p>Daftar akun relawan, organisasi, dan admin beserta perannya di platform.</p></div>
      <span className="admin-count admin-queue-count"><Users size={15} /> {pagination.total.toLocaleString("id-ID")} pengguna</span>
    </header>
    <AdminToast toast={toast} onDismiss={() => setToast(null)} />
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
          <option value="admin">Admin</option>
        </select>
      </div>
      {loading
        ? <div className="admin-table-state" role="status"><span className="admin-spinner" aria-hidden="true" /> Memuat pengguna…</div>
        : users.length
          ? <div className="admin-table-wrap"><table className="admin-data-table">
            <thead><tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Peran</th>
              <th scope="col">Organisasi</th><th scope="col">Terdaftar</th><th scope="col">Tindakan</th></tr></thead>
            <tbody>{users.map((account) => <tr key={account._id}>
              <td data-label="Nama"><strong>{account.name}</strong></td>
              <td data-label="Email">{account.email}</td>
              <td data-label="Peran"><span className={`admin-status-pill is-${account.role}`}>
                {account.role === "organization" ? "Organisasi" : account.role === "admin" ? "Admin" : "Relawan"}
              </span></td>
              <td data-label="Organisasi">{account.organization?.name || "—"}</td>
              <td data-label="Terdaftar">{formatDate(account.createdAt)}</td>
              <td data-label="Tindakan">{account.role === "admin"
                ? <span className="admin-protected-account">Akun admin dilindungi</span>
                : <button type="button" className="button button-small admin-takedown-button"
                  aria-label={`Hapus akun ${account.name}`} disabled={Boolean(workingId)}
                  onClick={() => setSelected(account)}><Trash2 size={14} /> Hapus akun</button>}</td>
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
    {selected && <div className="admin-confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !workingId) setSelected(null);
    }}>
      <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="user-delete-title">
        <span className="eyebrow">Konfirmasi penghapusan</span>
        <h2 id="user-delete-title">Hapus akun pengguna?</h2>
        <p><strong>{selected.name}</strong> akan dihapus jika tidak memiliki organisasi, pendaftaran, atau catatan kontribusi yang masih terhubung.</p>
        <div>
          <button type="button" className="button button-ghost" disabled={Boolean(workingId)} onClick={() => setSelected(null)}>Kembali</button>
          <button type="button" className="button admin-danger-button" disabled={Boolean(workingId)} onClick={deleteUser}>
            {workingId ? "Menghapus…" : "Hapus akun"}
          </button>
        </div>
      </section>
    </div>}
  </section>;
}
