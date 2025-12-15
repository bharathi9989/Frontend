// src/api/axios.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${BASE}/api`, // matches your backend base '/api'
  withCredentials: false,
});

// Attach token from localStorage for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default api;
