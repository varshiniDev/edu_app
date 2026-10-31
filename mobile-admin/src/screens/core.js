import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api, { tokens } from "../api";
import { Logo, useBranding } from "../branding";
import { T } from "../theme";
import { S, Field, Btn, FadeIn } from "../ui";
import { API } from "../config";
export function LoginScreen({ onLogin }) {
  const { academy_name } = useBranding();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login/", { username: u, password: p });
      await tokens.set("access", data.access);
      await tokens.set("refresh", data.refresh);
      const me = await api.get("/auth/me/");
      onLogin(me.data);
    } catch (e) {
      await tokens.clear();
      Alert.alert("Login failed", !e.response
        ? "Cannot reach the server. Check the IP in src/config.js and that the backend is running."
        : e.response.status === 401
          ? "Wrong ID/email or password, or the account is inactive."
          : `Server error (${e.response.status}).`);
    }
    setBusy(false);
  };
  return (
    <LinearGradient colors={T.grad} style={{ flex: 1, justifyContent: "center", padding: 22 }}>
      <FadeIn>
        <View style={[S.card, { padding: 22 }]}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Logo size={72} />
            <Text style={[S.h, { marginTop: 10, marginBottom: 0 }]}>{academy_name}</Text>
            <Text style={S.muted}>Sign in to your account</Text>
            <Text style={[S.muted, { marginTop: 6 }]}>Server: {API}</Text>
          </View>
          <Field label="Staff ID, Student ID or email" autoCapitalize="none" value={u} onChangeText={setU} />
          <Field label="Password" secureTextEntry autoComplete="off" value={p} onChangeText={setP} />
          <Btn title="Sign in" busy={busy} onPress={go} />
        </View>
      </FadeIn>
    </LinearGradient>
  );
}