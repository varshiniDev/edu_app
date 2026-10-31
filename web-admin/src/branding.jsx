import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios"; import { API } from "./api";
const Ctx = createContext({});
export const useBranding = () => useContext(Ctx);
export function BrandingProvider({ children }) {
  const [b, setB] = useState({ academy_name: "Academy ERP", logo_url: null });
  const refresh = useCallback(() => axios.get(`${API}/branding/`).then(r => setB(r.data)).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    document.title = b.academy_name;
    if (b.logo_url) { let l = document.querySelector("link[rel=icon]"); if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); } l.href = b.logo_url; }
  }, [b]);
  return <Ctx.Provider value={{ ...b, setBranding: setB, refresh }}>{children}</Ctx.Provider>;
}
export function Logo({ size = 36 }) {
  const { logo_url, academy_name } = useBranding();
  return logo_url
    ? <img src={logo_url} alt={academy_name} style={{ height: size, width: size }} className="rounded-lg object-contain bg-white"/>
    : <div style={{ height: size, width: size }} className="rounded-lg bg-brand-orange text-white grid place-items-center font-bold">{academy_name[0]}</div>;
}
