import axios from 'axios';

// Production: Vercel dashboard → Settings → Environment Variables da
// VITE_API_URL = https://smartschool-9qyh.onrender.com/api  deb o'rnat
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://smartschool-9qyh.onrender.com/api'; // Render.com production fallback

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cross-origin cookie/auth uchun
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ss_token');
    config.headers.Authorization = token ? `Bearer ${token}` : '';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
