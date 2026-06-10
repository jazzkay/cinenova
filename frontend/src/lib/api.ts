import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cinenova_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("cinenova_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const TMDB_IMAGE = "https://image.tmdb.org/t/p";
export const img = (path: string | null | undefined, size = "w500") =>
  path ? `${TMDB_IMAGE}/${size}${path}` : "/placeholder-movie.jpg";
