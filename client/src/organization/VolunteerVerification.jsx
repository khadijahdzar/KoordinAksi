import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, MapPin, Search, Users, XCircle } from "lucide-react";
import { getErrorMessage } from "../api";
import { getOrganizationVolunteers, logOrganizationAttendance } from "./orgApi";

const attendanceLabels = { Hadir: "Hadir", Alpha: "Absen", "Belum dicatat": "Belum dicatat" };

export default function VolunteerVerification() {
  const [volunteers, setVolunteers] = useState([]);
  const [hoursById, setHoursById] = useState({});
  const [search, setSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getOrganizationVolunteers();
      setVolunteers(data.volunteers);
      setHoursById(Object.fromEntries(data.volunteers.map((item) => [item._id, String(item.hoursLogged || 0)])));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVolunteers(); }, [loadVolunteers]);

  const filteredVolunteers = useMemo(() => volunteers.filter((item) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [item.volunteer?.name, item.volunteer?.email, item.activity?.title]
      .some((value) => value?.toLowerCase().includes(searchTerm));
    const matchesAttendance = attendanceFilter === "all"
      || (attendanceFilter === "unlogged" ? item.attendanceStatus === "Belum dicatat" : item.attendanceStatus === attendanceFilter);
    return matchesSearch && matchesAttendance;
  }), [volunteers, search, attendanceFilter]);

  async function logAttendance(item, attendanceStatus) {
    if (!item.volunteer?._id || !item.activity?._id || busyId) return;
    if (item.registrationStatus === "pending") {
      setError("Terima pendaftaran relawan terlebih dahulu dari halaman pendaftar kegiatan.");
      return;
    }
    setBusyId(item._id);
    setError("");
    setNotice("");
    try {
      const hoursLogged = attendanceStatus === "Hadir" ? Number(hoursById[item._id] || 0) : 0;
      await logOrganizationAttendance(item.activity._id, {
        volunteerId: item.volunteer._id,
        attendanceStatus,
        hoursLogged
      });
      setVolunteers((current) => current.map((entry) => entry._id === item._id
        ? {
          ...entry,
          attendanceStatus,
          hoursLogged,
          registrationStatus: attendanceStatus === "Hadir"
            ? "attended"
            : entry.registrationStatus === "attended" ? "approved" : entry.registrationStatus
        }
        : entry));
      setNotice(`Kehadiran ${item.volunteer.name} untuk ${item.activity.title} berhasil dicatat.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  return <section className="organization-dashboard organization-verification-page">
    <header className="organization-page-heading"><div><span className="eyebrow">OPERASIONAL LAPANGAN</span><h1>Verifikasi & log</h1><p>Catat kehadiran relawan dan jam kontribusi pada setiap kegiatan.</p></div><div className="organization-roster-total"><Users size={17} /><strong>{loading ? "—" : volunteers.length}</strong><span>pendaftaran</span></div></header>
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {error && <div className="organization-load-error" role="alert"><span>{error}</span><button type="button" className="button button-small button-ghost" onClick={loadVolunteers}>Coba lagi</button></div>}
    <div className="organization-roster-toolbar">
      <label className="organization-table-search"><Search size={15} /><span className="visually-hidden">Cari relawan atau kegiatan</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari relawan atau kegiatan" /></label>
      <label className="organization-filter-select"><span>Status kehadiran</span><select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}><option value="all">Semua status</option><option value="unlogged">Belum dicatat</option><option value="Hadir">Hadir</option><option value="Alpha">Absen</option></select></label>
    </div>
    {loading && !volunteers.length ? <div className="organization-table-skeleton" role="status"><span /><span /><span /><span /></div>
      : <div className="organization-table-wrap"><table className="organization-action-table organization-volunteer-table"><thead><tr><th>Relawan</th><th>Kegiatan</th><th>Pendaftaran</th><th>Kehadiran & jam</th><th>Catat</th></tr></thead>
        <tbody>{filteredVolunteers.map((item) => <tr key={item._id}>
          <td><strong>{item.volunteer?.name || "Relawan tidak tersedia"}</strong><small>{item.volunteer?.email || "Email tidak tersedia"}</small></td>
          <td><strong>{item.activity?.title || "Kegiatan tidak tersedia"}</strong><small><MapPin size={12} />{item.activity?.location || "Lokasi belum tersedia"}</small></td>
          <td><span className={`organization-activity-status status-${item.registrationStatus}`}>{item.registrationStatus === "approved" ? "Diterima" : item.registrationStatus === "attended" ? "Hadir" : "Menunggu"}</span></td>
          <td><span className={`organization-attendance-pill attendance-${item.attendanceStatus === "Hadir" ? "present" : item.attendanceStatus === "Alpha" ? "absent" : "unset"}`}>{attendanceLabels[item.attendanceStatus] || item.attendanceStatus}</span><label className="organization-hours-input"><Clock3 size={13} /><input type="number" min="0" max="24" step="0.5" disabled={item.registrationStatus === "pending"} value={hoursById[item._id] ?? "0"} onChange={(event) => setHoursById((current) => ({ ...current, [item._id]: event.target.value }))} aria-label={`Jam kontribusi ${item.volunteer?.name || "relawan"}`} /><span>jam</span></label></td>
          <td><div className="organization-attendance-actions"><button type="button" title="Tandai hadir" aria-label={`Tandai ${item.volunteer?.name || "relawan"} hadir`} disabled={Boolean(busyId) || item.registrationStatus === "pending"} onClick={() => logAttendance(item, "Hadir")}><CheckCircle2 size={16} />{busyId === item._id ? "Menyimpan" : "Hadir"}</button><button type="button" title="Tandai absen" aria-label={`Tandai ${item.volunteer?.name || "relawan"} absen`} disabled={Boolean(busyId) || item.registrationStatus === "pending"} onClick={() => logAttendance(item, "Alpha")}><XCircle size={16} />Absen</button></div></td>
        </tr>)}</tbody></table></div>}
    {!loading && !error && !filteredVolunteers.length && <div className="empty-box"><Users size={24} /><h3>{volunteers.length ? "Tidak ada hasil" : "Belum ada relawan terdaftar"}</h3><p>{volunteers.length ? "Ubah kata kunci atau filter kehadiran." : "Pendaftaran relawan dari seluruh kegiatanmu akan tampil di sini."}</p></div>}
  </section>;
}
