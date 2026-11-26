import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { Notice } from "../formHelpers";

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { role: requestedRole } = useParams();
  const { login, register, googleAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: requestedRole === "organization" ? "organization" : "volunteer", organizationName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [acceptedGoogleTerms, setAcceptedGoogleTerms] = useState(false);
  if (isRegister && requestedRole !== "volunteer" && requestedRole !== "organization") return <Navigate to="/register" replace />;
  function navigateAfterAuth(user) {
    const from = location.state?.from;
    const requestedPath = typeof from === "string" ? from : from?.pathname;
    const canReturnToRequestedPath = requestedPath?.startsWith("/") &&
      !requestedPath.startsWith("//") &&
      (!requestedPath.startsWith("/admin") || user.role === "admin");
    navigate(canReturnToRequestedPath ? requestedPath : getDashboardPath(user.role), { replace: true });
  }
  async function handleGoogleLogin(credential) {
    setError("");
    try {
      const user = await googleAuth(credential, { acceptedTerms: acceptedGoogleTerms });
      navigateAfterAuth(user);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = isRegister
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      navigateAfterAuth(user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return <section className="auth-layout"><div className="auth-aside"><span className="eyebrow">KoordinAksi</span><h1>{isRegister ? "Kebaikan dimulai dari sini." : "Senang melihatmu kembali."}</h1><p>{isRegister ? "Buat akun dan temukan cara sederhana untuk membuat perubahan." : "Lanjutkan perjalananmu dalam membuat dampak yang berarti."}</p><div className="auth-decoration">✳</div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">{isRegister ? "Buat akun baru" : "Selamat datang kembali"}</span><h2>{isRegister ? "Bergabung dengan kami" : "Masuk ke akunmu"}</h2><p>{isRegister ? "Isi informasi berikut untuk memulai." : "Masukkan email dan password untuk melanjutkan."}</p>
      {location.state?.message && !error && <Notice message={location.state.message} />}
      {error && <Notice message={error} />}
      {isRegister && <><label>Nama lengkap<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kamu" /></label><label>Daftar sebagai<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="volunteer">Relawan</option><option value="organization">Organisasi</option></select></label>{form.role === "organization" && <label>Nama organisasi<input required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} placeholder="Nama organisasi sosial" /></label>}</>}
      <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" /></label><button className="button full-width" disabled={busy}>{busy ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"} <span>→</span></button>
      {!isRegister && <>
        <div className="google-login-divider"><span>atau masuk dengan</span></div>
        <GoogleAuthButton onSuccess={handleGoogleLogin} onError={setError} />
        <label className="auth-google-terms"><input type="checkbox" checked={acceptedGoogleTerms} onChange={(event) => setAcceptedGoogleTerms(event.target.checked)} /> Saya menyetujui Ketentuan Layanan & Kebijakan Data Privasi jika membuat akun baru.</label>
      </>}
      <small className="auth-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar sekarang"}</Link></small>
    </form></div></section>;
}

export default AuthPage;
