import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function getDashboardPath(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "organization") return "/dashboard/organisasi";
  if (role === "volunteer") return "/dashboard/relawan";
  return "/login";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const refreshRequestId = useRef(0);

  const refreshSession = useCallback(async () => {
    const requestId = ++refreshRequestId.current;
    const token = localStorage.getItem("koordinaksi_token");
    setLoading(true);
    if (!token) {
      setUser(null);
      setSessionError("");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      if (requestId !== refreshRequestId.current || localStorage.getItem("koordinaksi_token") !== token) return;
      setUser(data.user);
      setSessionError("");
    } catch (error) {
      if (requestId !== refreshRequestId.current || localStorage.getItem("koordinaksi_token") !== token) return;
      if (error.response?.status === 401) {
        localStorage.removeItem("koordinaksi_token");
        setUser(null);
        setSessionError("");
      } else {
        setSessionError("Sesi belum dapat dipulihkan karena koneksi atau server bermasalah. Token tetap tersimpan; silakan coba lagi.");
      }
    } finally {
      if (requestId === refreshRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === "koordinaksi_token" || event.key === null) refreshSession();
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshSession]);

  const value = useMemo(() => ({
    user,
    loading,
    sessionError,
    refreshSession,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      refreshRequestId.current += 1;
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      setLoading(false);
      setSessionError("");
      return data.user;
    },
    async register(details) {
      const { data } = await api.post("/auth/register", details);
      refreshRequestId.current += 1;
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      setLoading(false);
      setSessionError("");
      return data.user;
    },
    async googleAuth(credential, registrationDetails = {}) {
      const { data } = await api.post("/auth/google", { credential, ...registrationDetails });
      refreshRequestId.current += 1;
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      setLoading(false);
      setSessionError("");
      return data.user;
    },
    logout() {
      refreshRequestId.current += 1;
      localStorage.removeItem("koordinaksi_token");
      setUser(null);
      setLoading(false);
      setSessionError("");
    }
  }), [user, loading, sessionError, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return context;
}
