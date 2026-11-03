import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("koordinaksi_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("koordinaksi_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      return data.user;
    },
    async register(details) {
      const { data } = await api.post("/auth/register", details);
      localStorage.setItem("koordinaksi_token", data.token);
      setUser(data.user);
      return data.user;
    },
    logout() {
      localStorage.removeItem("koordinaksi_token");
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return context;
}
