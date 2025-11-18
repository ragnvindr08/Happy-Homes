import axios from "axios";
import { getToken } from "./auth";

// Use Ngrok URL for external devices; fallback to localhost for local testing
const BASE_URL = "https://28f5a643d1a6.ngrok-free.app"; // your Ngrok URL

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
  },
});

// Automatically attach token if exists
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
