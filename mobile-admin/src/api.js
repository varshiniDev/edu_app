import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API } from "./config";
export const tokens = {
  get: (k) => SecureStore.getItemAsync(k),
  set: (k, v) => SecureStore.setItemAsync(k, v),
  clear: async () => {
    await SecureStore.deleteItemAsync("access");
    await SecureStore.deleteItemAsync("refresh");
  },
};
const api = axios.create({ baseURL: API, timeout: 15000 }); // fail after 15 s instead of loading forever
api.interceptors.request.use(async (c) => {
  const t = await tokens.get("access");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const o = e.config;
    const rt = await tokens.get("refresh");
    if (e.response?.status === 401 && !o._retry && rt) {
      o._retry = true;
      try {
        const { data } = await axios.post(
          `${API}/auth/refresh/`,
          { refresh: rt },
          { timeout: 15000 },
        );
        await tokens.set("access", data.access);
        o.headers.Authorization = `Bearer ${data.access}`;
        return api(o);
      } catch {}
    }
    return Promise.reject(e);
  },
);
export default api;
