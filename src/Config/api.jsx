// src/config/api.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: "https://shop.adroitalarm.com.au/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // Remove withCredentials if you don't need cookies
  // withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;