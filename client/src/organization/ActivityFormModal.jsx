import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api";
import { createOrganizationAction } from "./orgApi";

function toLocalDateTime(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getInitialForm(activity, categories) {
  return {
    title: activity?.title || "",
    description: activity?.description || "",
    category: activity?.category || categories[0] || "",
    location: activity?.location || "",
    date: toLocalDateTime(activity?.date),
    capacity: String(activity?.capacity ?? 10),
    status: activity?.status || "published"
  };
}

export default function ActivityFormModal({ activity, categories, canPublish, onClose, onSaved }) {
  const [form, setForm] = useState(() => getInitialForm(activity, categories));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(activity);

  useEffect(() => {
    if (!form.category && categories.length) {
      setForm((current) => ({ ...current, category: categories[0] }));
    }
  }, [categories, form.category]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const capacity = Number(form.capacity);
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      setError("Kapasitas harus berupa bilangan bulat minimal 1.");
      return;
    }
    if (editing && capacity < Number(activity.activeRegistrations || 0)) {
      setError(`Kapasitas tidak boleh lebih kecil dari jumlah relawan terdaftar (${activity.activeRegistrations}).`);
      return;
    }
    if (!form.date || Number.isNaN(new Date(form.date).getTime())) {
      setError("Tanggal dan waktu kegiatan harus diisi dengan benar.");
      return;
    }
    if (form.status === "published" && !canPublish) {
      setError("Organisasi harus terverifikasi untuk menerbitkan kegiatan.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      date: new Date(form.date).toISOString(),
      capacity,
      status: form.status
    };
    try {
      if (editing) await api.patch(`/activities/${activity._id}`, payload);
      else await createOrganizationAction(payload);
      await onSaved();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return <div className="organization-modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !saving) onClose();
  }}>
    <section className="organization-form-modal" role="dialog" aria-modal="true"
      aria-labelledby="activity-form-title">
      <div className="organization-modal-heading">
        <div><span className="eyebrow">{editing ? "Perbarui informasi" : "Kegiatan baru"}</span>
          <h2 id="activity-form-title">{editing ? "Edit kegiatan" : "Buat kegiatan"}</h2></div>
        <button type="button" className="organization-modal-close" aria-label="Tutup form"
          disabled={saving} onClick={onClose}>×</button>
      </div>
      <form className="organization-activity-form" onSubmit={submit}>
        {error && <div className="notice" role="alert">{error}</div>}
        <label>Judul kegiatan
          <input name="title" value={form.title} onChange={updateField} required maxLength={160} />
        </label>
        <label>Deskripsi
          <textarea name="description" value={form.description} onChange={updateField}
            required maxLength={5000} rows="4" />
        </label>
        <div className="organization-form-grid">
          <label>Kategori
            <select name="category" value={form.category} onChange={updateField} required>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>Tanggal dan waktu
            <input name="date" type="datetime-local" value={form.date} onChange={updateField} required />
          </label>
          <label className="organization-form-wide">Lokasi
            <input name="location" value={form.location} onChange={updateField} required maxLength={200} />
          </label>
          <label>Kapasitas relawan
            <input name="capacity" type="number" inputMode="numeric"
              min={Math.max(1, Number(activity?.activeRegistrations || 0))} step="1"
              value={form.capacity} onChange={updateField} required />
            {editing && <small className="organization-capacity-hint">
              Minimal {Math.max(1, Number(activity.activeRegistrations || 0))} slot ({activity.activeRegistrations || 0} relawan terdaftar saat ini).
            </small>}
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={updateField}>
              <option value="draft">Draft</option>
              <option value="published" disabled={!canPublish}>Dipublikasikan</option>
            </select>
          </label>
        </div>
        {!canPublish && <p className="organization-form-hint">Kegiatan hanya dapat disimpan sebagai draft sampai organisasi terverifikasi.</p>}
        <div className="organization-modal-actions">
          <button type="button" className="button button-ghost" disabled={saving} onClick={onClose}>Batal</button>
          <button type="submit" className="button" disabled={saving || !categories.length}>
            {saving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Simpan kegiatan"}
          </button>
        </div>
      </form>
    </section>
  </div>;
}
