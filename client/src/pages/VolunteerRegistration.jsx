import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { Notice, InlineFieldError, focusFirstInvalidField } from "../formHelpers";
import { volunteerInterests } from "../appConstants";

function VolunteerRegistration() {
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
    phone: "",
    city: "",
    interests: [],
    bio: ""
  });

  useEffect(() => {
    document.title = "Daftar Relawan - KoordinAksi";
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleInterest(interest) {
    setForm((prev) => {
      const has = prev.interests.includes(interest);
      return {
        ...prev,
        interests: has ? prev.interests.filter((i) => i !== interest) : [...prev.interests, interest]
      };
    });
  }

  function validateStep1() {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi.";
    if (!form.email.trim()) errors.email = "Masukkan alamat email.";
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
        ...form,
        role: "volunteer"
      });
      navigate(getDashboardPath(user.role || "volunteer"), { replace: true });
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
      const user = await googleAuth(credential, { role: "volunteer", acceptedTerms: true });
      navigate(getDashboardPath(user.role || "volunteer"), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container page-space registration-page">
      <span className="eyebrow">Pendaftaran relawan</span>
      <h1>Salurkan kepedulianmu</h1>
      <p className="lead">Lengkapi profil singkat agar kami bisa mencocokkanmu dengan aksi yang relevan.</p>
      {error && <Notice message={error} />}
      <form className="registration-form" onSubmit={submit}>
        {step === 1 && (
          <div className="registration-step">
            <h2>Data akun</h2>
            <label aria-invalid={fieldErrors.name ? "true" : undefined}>
              Nama lengkap
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nama lengkap" />
              {fieldErrors.name && <InlineFieldError>{fieldErrors.name}</InlineFieldError>}
            </label>
            <label aria-invalid={fieldErrors.email ? "true" : undefined}>
              Email
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="nama@email.com" />
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
            <h2>Profil relawan</h2>
            <label>
              Nomor telepon
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08…" />
            </label>
            <label>
              Kota
              <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Kota domisili" />
            </label>
            <fieldset>
              <legend>Minat aksi</legend>
              <div className="interest-chips">
                {volunteerInterests.map((interest) => (
                  <button
                    type="button"
                    key={interest}
                    className={form.interests.includes(interest) ? "chip is-active" : "chip"}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              Bio singkat
              <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} placeholder="Ceritakan sedikit tentangmu" />
            </label>
            <label className="auth-google-terms">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              Saya menyetujui Ketentuan Layanan & Kebijakan Privasi
            </label>
            <div className="registration-actions">
              <button type="button" className="button button-ghost" onClick={() => setStep(1)}>Kembali</button>
              <button className="button" disabled={busy}>{busy ? "Menyimpan…" : "Buat akun relawan"} <span>→</span></button>
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

export default VolunteerRegistration;
