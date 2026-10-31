import axios from "axios";
export const API = import.meta.env.VITE_API_URL || "https://edu-app-g56k.onrender.com/api";
const api = axios.create({ baseURL: API });
api.interceptors.request.use(c => { const t = localStorage.getItem("access"); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use(r => r, async e => {
  const orig = e.config;
  if (e.response?.status === 401 && !orig._retry && localStorage.getItem("refresh")) {
    orig._retry = true;
    try {
      const { data } = await axios.post(`${API}/auth/refresh/`, { refresh: localStorage.getItem("refresh") });
      localStorage.setItem("access", data.access); orig.headers.Authorization = `Bearer ${data.access}`;
      return api(orig);
    } catch { localStorage.clear(); window.location = "/login"; }
  }
  return Promise.reject(e);
});
export default api;
