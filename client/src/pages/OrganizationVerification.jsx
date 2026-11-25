import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { Notice, InlineFieldError, focusFirstInvalidField } from "../formHelpers";
import {
  organizationFocusCategories,
  organizationDocumentTypes,
  organizationRegistrationDraftKey
} from "../appConstants";

function OrganizationVerification() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    focusCategory: organizationFocusCategories[0],
    description: "",
    website: "",
    phone: "",
    city: "",
    skDocument: null,
    taxDocument: null
  });

  useEffect(() => {
    document.title = "Daftar Organisasi - KoordinAksi";
    try {
      const draft = localStorage.getItem(organizationRegistrationDraftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        setForm((prev) => ({ ...prev, ...parsed, password: "", skDocument: null, taxDocument: null }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const { password, skDocument, taxDocument, ...draft } = form;
    try {
      localStorage.setItem(organizationRegistrationDraftKey, JSON.stringify(draft));
    } catch {}
  }, [form]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1() {
    const errors = {};
    if (!form.organizationName.trim()) errors.organizationName = "Nama organisasi wajib.";
    if (!form.name.trim()) errors.name = "Nama penanggung jawab wajib.";
    if (!form.email.trim()) errors.email = "Email wajib.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Format email tidak valid.";
    if (!form.password || form.password.length < 8) errors.password = "Password minimal 8 karakter.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField();
      return false;
    }
    return true;
  }

  function nextStep() {
    if (validateStep1()) setStep(2);
  }

  async function submit(event) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError("Centang persetujuan ketentuan layanan terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "organization",
        organizationName: form.organizationName,
        focusCategory: form.focusCategory,
        description: form.description,
        website: form.website,
        phone: form.phone,
        city: form.city
      });
      try { localStorage.removeItem(organizationRegistrationDraftKey); } catch {}
      navigate(getDashboardPath(user.role || "organization"), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(credential) {
    if (!acceptedTerms) {
      setError("Centang persetujuan ketentuan layanan terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await googleAuth(credential, {
        role: "organization",
        organizationName: form.organizationName,
        acceptedTerms: true
      });
      try { localStorage.removeItem(organizationRegistrationDraftKey); } catch {}
      navigate(getDashboardPath(user.role || "organization"), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container page-space registration-page">
      <span className="eyebrow">Pendaftaran organisasi</span>
      <h1>Daftarkan lembaga sosialmu</h1>
      <p className="lead">Lengkapi data organisasi agar dapat mempublikasikan aksi dan mengelola relawan.</p>
      {error && <Notice message={error} />}
      <form className="registration-form" onSubmit={submit}>
        {step === 1 && (
          <div className="registration-step">
            <h2>Akun & identitas</h2>
            <label aria-invalid={fieldErrors.organizationName ? "true" : undefined}>
              Nama organisasi
              <input required value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="Nama lembaga" />
              {fieldErrors.organizationName && <InlineFieldError>{fieldErrors.organizationName}</InlineFieldError>}
            </label>
            <label aria-invalid={fieldErrors.name ? "true" : undefined}>
              Nama penanggung jawab
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nama lengkap" />
              {fieldErrors.name && <InlineFieldError>{fieldErrors.name}</InlineFieldError>}
            </label>
            <label aria-invalid={fieldErrors.email ? "true" : undefined}>
              Email
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@organisasi.org" />
              {fieldErrors.email && <InlineFieldError>{fieldErrors.email}</InlineFieldError>}
            </label>
            <label aria-invalid={fieldErrors.password ? "true" : undefined}>
              Password
              <input required minLength={8} type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Minimal 8 karakter" />
              {fieldErrors.password && <InlineFieldError>{fieldErrors.password}</InlineFieldError>}
            </label>
            <button type="button" className="button" onClick={nextStep}>Lanjut <span>→</span></button>
          </div>
        )}
        {step === 2 && (
          <div className="registration-step">
            <h2>Profil organisasi</h2>
            <label>
              Fokus kegiatan
              <select value={form.focusCategory} onChange={(e) => update("focusCategory", e.target.value)}>
                {organizationFocusCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label>
              Deskripsi singkat
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Apa yang dilakukan organisasimu?" />
            </label>
            <label>
              Website
              <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
            </label>
            <label>
              Telepon
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08…" />
            </label>
            <label>
              Kota
              <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Kota basis" />
            </label>
            <div className="document-hints">
              <p className="eyebrow">Dokumen verifikasi (opsional di tahap awal)</p>
              <ul>
                {organizationDocumentTypes.map((doc) => (
                  <li key={doc.key}><strong>{doc.icon} {doc.title}</strong> — {doc.detail}</li>
                ))}
              </ul>
            </div>
            <label className="auth-google-terms">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              Saya menyetujui Ketentuan Layanan & Kebijakan Privasi
            </label>
            <div className="registration-actions">
              <button type="button" className="button button-ghost" onClick={() => setStep(1)}>Kembali</button>
              <button className="button" disabled={busy}>{busy ? "Menyimpan…" : "Simpan akun organisasi"} <span>→</span></button>
            </div>
            <div className="google-login-divider"><span>atau daftar dengan</span></div>
            <GoogleAuthButton onSuccess={handleGoogle} onError={setError} />
          </div>
        )}
      </form>
      <p className="auth-switch">Sudah punya akun? <Link to="/login">Masuk</Link></p>
    </section>
  );
}

export default OrganizationVerification;
