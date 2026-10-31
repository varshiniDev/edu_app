import { createContext, useContext, useEffect, useState } from "react"; import api from "./api";
const Ctx = createContext({ me: null, setMe: () => {} }); export const useMe = () => useContext(Ctx);
export function MeProvider({ children }) {
  const [me, setMe] = useState(null);
  useEffect(() => { api.get("/auth/me/").then(r => setMe(r.data)).catch(() => {}); }, []);
  return <Ctx.Provider value={{ me, setMe }}>{children}</Ctx.Provider>;
}
