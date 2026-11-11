import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("koordinaksi_token");
  config.headers = config.headers || {};
  if (token) {
    const authorization = ["Bearer", token].join(" ");
    if (typeof config.headers.set === "function") config.headers.set("Authorization", authorization);
    else config.headers.Authorization = authorization;
  } else if (typeof config.headers.delete === "function") {
    config.headers.delete("Authorization");
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export function getErrorMessage(error) {
  const { response } = error;
  if (!response) return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";

  const validationErrors = response.data?.errors;
  if (response.status === 400 && Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors
      .map(({ field, message }) => `${field}: ${message}`)
      .join(" ");
  }

  if (response.status === 401) {
    return response.data?.message || "Sesi tidak valid. Silakan masuk kembali.";
  }
  if (response.status === 409) {
    return response.data?.message || "Permintaan bertentangan dengan data saat ini. Muat ulang lalu coba lagi.";
  }

  return response.data?.message || "Permintaan gagal. Periksa data dan coba lagi.";
}

export default api;
