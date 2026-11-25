import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { Notice, InlineFieldError, focusFirstInvalidField } from "../formHelpers";
import { volunteerInterests } from "../appConstants";

function VolunteerRegistration() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    interests: [],
    email: "",
    password: "",
    role: "volunteer",
    acceptedTerms: false
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pendaftaran Relawan - KoordinAksi";
    return () => { document.title = previousTitle; };
  }, []);

  function toggleInterest(interest) {
    setFieldErrors((current) => ({ ...current, interests: "" }));
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest]
    }));
  }

  function validateVolunteerForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = "Masukkan nama lengkap.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) errors.phone = "Masukkan nomor WhatsApp yang aktif.";
    else if (!/^[+\d\s().-]+$/.test(form.phone.trim())) errors.phone = "Gunakan hanya angka, spasi, tanda +, tanda kurung, atau tanda hubung.";
    else if (phoneDigits.length < 8 || phoneDigits.length > 15) errors.phone = "Masukkan nomor dengan 8–15 digit, termasuk kode negara bila ada.";
    if (!form.city.trim()) errors.city = "Masukkan kota atau kabupaten domisili.";
    if (!form.email.trim()) errors.email = "Masukkan alamat email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Periksa kembali format alamat email.";
    if (!form.password) errors.password = "Buat password untuk akunmu.";
    else if (form.password.length < 8) errors.password = "Password harus terdiri dari minimal 8 karakter.";
    if (!form.interests.length) errors.interests = "Pilih minimal satu minat atau keahlian relawan.";
    if (!form.acceptedTerms) errors.acceptedTerms = "Persetujuan diperlukan untuk membuat akun.";
    return errors;
  }

  function updateVolunteerField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleGoogleRegister(credential) {
    const errors = validateVolunteerForm();
    delete errors.name;
    delete errors.email;
    delete errors.password;
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("Lengkapi data dan persetujuan terlebih dahulu untuk mendaftar dengan Google.");
      focusFirstInvalidField();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const user = await googleAuth(credential, {
        role: "volunteer",
        name: form.name.trim() || undefined,
        phone: form.phone.trim(),
        city: form.city.trim(),
        interests: form.interests,
        acceptedTerms: true
      });
      navigate(getDashboardPath(user.role));
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length) {
        setFieldErrors((current) => ({
          ...current,
          ...Object.fromEntries(validationErrors.map(({ field, message }) => [field, message]))
        }));
        setError("");
        focusFirstInvalidField();
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const errors = validateVolunteerForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("");
      focusFirstInvalidField();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await register(form);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length) {
        setFieldErrors((current) => ({
          ...current,
          ...Object.fromEntries(validationErrors.map(({ field, message }) => [field, message]))
        }));
        setError("");
        focusFirstInvalidField();
      } else if (err.response?.status === 409) {
        setFieldErrors((current) => ({ ...current, email: getErrorMessage(err) }));
        setError("");
        focusFirstInvalidField();
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return <section className="volunteer-signup-page registration-split-page">
    <aside className="registration-split-visual">
      <div className="registration-split-copy">
        <span className="registration-split-kicker">KoordinAksi · Relawan</span>
        <h2>Mulai dari satu langkah kecil.</h2>
        <p>Temukan aksi yang bermakna dan tumbuh bersama komunitas yang peduli.</p>
      </div>
    </aside>
    <section className="volunteer-signup-card" aria-labelledby="volunteer-signup-title">
      <Link className="volunteer-signup-brand" to="/"><img src="/logokoordinaski.png" alt="Logo KoordinAksi" /><span>Koordin<span>Aksi</span></span></Link>
      <header className="volunteer-signup-heading">
        <span className="eyebrow">Satu langkah menuju aksi nyata</span>
        <h1 id="volunteer-signup-title">Daftar sebagai Volunteer</h1>
        <p>Lengkapi data singkatmu untuk mulai terhubung dengan berbagai aksi kebaikan.</p>
      </header>

      <form className="volunteer-signup-form" noValidate onSubmit={submit}>
        {error && <Notice message={error} />}
        <div className="volunteer-signup-fields volunteer-signup-two-col">
          <label>Nama Lengkap<input aria-describedby={fieldErrors.name ? "volunteer-name-error" : undefined} aria-invalid={Boolean(fieldErrors.name)} autoComplete="name" required maxLength="100" value={form.name} onChange={(event) => updateVolunteerField("name", event.target.value)} placeholder="Masukkan nama lengkap" />{fieldErrors.name && <InlineFieldError id="volunteer-name-error">{fieldErrors.name}</InlineFieldError>}</label>
          <label>Nomor WhatsApp Aktif<input aria-describedby={fieldErrors.phone ? "volunteer-phone-error" : undefined} aria-invalid={Boolean(fieldErrors.phone)} autoComplete="tel" required minLength="8" maxLength="30" type="tel" value={form.phone} onChange={(event) => updateVolunteerField("phone", event.target.value)} placeholder="Contoh: 0812 3456 7890" />{fieldErrors.phone && <InlineFieldError id="volunteer-phone-error">{fieldErrors.phone}</InlineFieldError>}</label>
        </div>
        <div className="volunteer-signup-fields">
          <label>Domisili (Kota / Kabupaten)<input aria-describedby={fieldErrors.city ? "volunteer-city-error" : undefined} aria-invalid={Boolean(fieldErrors.city)} autoComplete="address-level2" required maxLength="100" value={form.city} onChange={(event) => updateVolunteerField("city", event.target.value)} placeholder="Contoh: Bandung" />{fieldErrors.city && <InlineFieldError id="volunteer-city-error">{fieldErrors.city}</InlineFieldError>}</label>
        </div>
        <div className="volunteer-signup-fields volunteer-signup-two-col">
          <label>Email<input aria-describedby={fieldErrors.email ? "volunteer-email-error" : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" required type="email" maxLength="254" value={form.email} onChange={(event) => updateVolunteerField("email", event.target.value)} placeholder="nama@email.com" />{fieldErrors.email && <InlineFieldError id="volunteer-email-error">{fieldErrors.email}</InlineFieldError>}</label>
          <label>Password<input aria-describedby={fieldErrors.password ? "volunteer-password-error" : undefined} aria-invalid={Boolean(fieldErrors.password)} autoComplete="new-password" required minLength="8" maxLength="128" type="password" value={form.password} onChange={(event) => updateVolunteerField("password", event.target.value)} placeholder="Minimal 8 karakter" />{fieldErrors.password && <InlineFieldError id="volunteer-password-error">{fieldErrors.password}</InlineFieldError>}</label>
        </div>

        <fieldset aria-describedby={fieldErrors.interests ? "volunteer-interests-error" : undefined} aria-invalid={Boolean(fieldErrors.interests)} className="volunteer-interest-fieldset">
          <legend>Minat & Keahlian Relawan <span>Pilih satu atau lebih</span></legend>
          <div className="volunteer-interest-tags">
            {volunteerInterests.map((interest) => <button
              aria-pressed={form.interests.includes(interest)}
              className={`volunteer-interest-tag${form.interests.includes(interest) ? " is-selected" : ""}`}
              key={interest}
              onClick={() => toggleInterest(interest)}
              type="button"
            ><span aria-hidden="true">{form.interests.includes(interest) ? "✓" : "+"}</span>{interest}</button>)}
          </div>
          {fieldErrors.interests && <InlineFieldError id="volunteer-interests-error">{fieldErrors.interests}</InlineFieldError>}
        </fieldset>

        <label className="volunteer-signup-consent">
          <input aria-describedby={fieldErrors.acceptedTerms ? "volunteer-consent-error" : undefined} aria-invalid={Boolean(fieldErrors.acceptedTerms)} required type="checkbox" checked={form.acceptedTerms} onChange={(event) => updateVolunteerField("acceptedTerms", event.target.checked)} />
          <span>Saya menyetujui <strong>Ketentuan Layanan & Kebijakan Data Privasi (PDP)</strong></span>
        </label>
        {fieldErrors.acceptedTerms && <InlineFieldError id="volunteer-consent-error">{fieldErrors.acceptedTerms}</InlineFieldError>}
        <button className="button full-width volunteer-signup-submit" disabled={busy}>{busy ? "Memproses..." : "Daftar"} {!busy && <span aria-hidden="true">→</span>}</button>
      </form>

      <div className="volunteer-signup-divider"><span>atau daftar dengan Google</span></div>
      <GoogleAuthButton onSuccess={handleGoogleRegister} onError={setError} />
      <p className="volunteer-signup-login">Sudah memiliki akun? <Link to="/login">Masuk Sekarang</Link></p>
    </section>
  </section>;
}

export default VolunteerRegistration;
