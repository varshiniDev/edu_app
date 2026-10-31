import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native"; import * as ImagePicker from "expo-image-picker"; import api from "../api"; import { Logo, useBranding } from "../branding"; import { S, Field, Btn, Avatar, FadeIn, errText, buildForm, MULTIPART } from "../ui";
const pick = async () => { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!p.granted) { Alert.alert("Permission needed"); return null; }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 }); return r.canceled ? null : r.assets[0]; };
const asFile = (field, a) => ({ field, uri: a.uri, name: a.fileName || `${field}.jpg`, type: a.mimeType || "image/jpeg" });
export default function SettingsScreen() {
  const b = useBranding(); const [name, setName] = useState(b.academy_name); const [me, setMe] = useState(null);
  useEffect(() => { api.get("/auth/me/").then(r => setMe(r.data)); }, []);
  const saveLogo = async () => { const a = await pick(); if (!a) return; try { const { data } = await api.patch("/branding/", buildForm({ academy_name: name }, [], asFile("logo", a)), MULTIPART); b.setBranding(data); Alert.alert("Saved", "Logo updated on web and mobile."); } catch (e) { Alert.alert("Error", errText(e)); } };
  const saveName = () => api.patch("/branding/", { academy_name: name }).then(r => b.setBranding(r.data)).catch(e => Alert.alert("Error", errText(e)));
  const savePhoto = async () => { const a = await pick(); if (!a) return; try { const { data } = await api.patch("/auth/me/", buildForm({}, [], asFile("photo", a)), MULTIPART); setMe(data); } catch (e) { Alert.alert("Error", errText(e)); } };
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 14 }}>
    <FadeIn><View style={S.card}><Text style={S.h}>Company branding</Text><View style={{ alignItems: "center", marginBottom: 12 }}><Logo size={84} /></View><Field label="Academy name" value={name} onChangeText={setName} /><Btn title="Choose & upload logo" onPress={saveLogo} /><View style={{ height: 8 }} /><Btn kind="ghost" title="Save name" onPress={saveName} /></View></FadeIn>
    <FadeIn delay={120}><View style={S.card}><Text style={S.h}>My profile</Text><View style={{ alignItems: "center", marginBottom: 12 }}><Avatar src={me?.photo} name={me?.name} size={90} /><Text style={{ marginTop: 8, fontWeight: "700" }}>{me?.name}</Text></View><Btn title="Change my photo" onPress={savePhoto} />
      <Text style={[S.muted, { marginTop: 10 }]}>Staff and student photos are uploaded by admins from their Add/Edit forms.</Text></View></FadeIn></ScrollView>;
}
