import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Image, View, Text } from "react-native";
import axios from "axios";
import { API } from "./config";
const Ctx = createContext({});
export const useBranding = () => useContext(Ctx);
export function BrandingProvider({ children }) {
  const [b, setB] = useState({ academy_name: "Academy ERP", logo_url: null });
  const refresh = useCallback(
    () =>
      axios
        .get(`${API}/branding/`)
        .then((r) => setB(r.data))
        .catch(() => {}),
    [],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <Ctx.Provider value={{ ...b, setBranding: setB, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
export function Logo({ size = 40 }) {
  const { logo_url, academy_name } = useBranding();
  return logo_url ? (
    <Image
      source={{ uri: logo_url }}
      style={{ width: size, height: size, borderRadius: 8 }}
      resizeMode="contain"
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: "#f97316",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>
        {academy_name[0]}
      </Text>
    </View>
  );
}
