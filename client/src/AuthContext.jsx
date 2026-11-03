import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("koordinaksi_token");
    if (!token) {
      setUser(null);
      setSessionError("");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setSessionError("");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("koordinaksi_token");
        setUser(null);
        setSessionError("");
      } else {
        setSessionError("Sesi belum dapat dipulihkan karena koneksi atau server bermasalah. Token tetap tersimpan; silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(() => ({
    user,
    loading,
    sessionError,
    refreshSession,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      setSessionError("");
      return data.user;
    },
    async register(details) {
      const { data } = await api.post("/auth/register", details);
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      setSessionError("");
      return data.user;
    },
    logout() {
      localStorage.removeItem("koordinaksi_token");
      setUser(null);
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
