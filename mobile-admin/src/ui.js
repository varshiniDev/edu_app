// ===== Shared mobile UI kit (every screen uses these) =====
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Animated, TouchableOpacity, TextInput, Modal, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons"; import { LinearGradient } from "expo-linear-gradient"; import { T } from "./theme";
export const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg }, card: { backgroundColor: T.card, borderRadius: T.radius, padding: 14, marginBottom: 12, elevation: 2, shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 4 }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 11, backgroundColor: "#fff", color: T.text },
  h: { fontSize: 20, fontWeight: "700", color: T.text, marginBottom: 12 }, muted: { color: T.muted, fontSize: 12 }, act: { padding: 7, marginLeft: 4 },
});
export const errText = e => { const d = e?.response?.data; if (!d) return "Network error: check the server address."; if (typeof d === "string") return "Server error"; if (d.detail) return d.detail; if (d.errors) return d.errors.join("\n");
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join("\n"); };
/** FormData for photo/PDF upload. skip = keys omitted when empty. file = {field, uri, name, type} */
export function buildForm(obj, skip = [], file) { const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => { if (v === undefined || v === null || (v === "" && skip.includes(k))) return; fd.append(k, typeof v === "boolean" ? String(v) : v); });
  if (file) fd.append(file.field, { uri: file.uri, name: file.name, type: file.type }); return fd; }
export const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };
export function FadeIn({ delay = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start(); }, []);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }, style]}>{children}</Animated.View>;
}
export function Avatar({ src, name = "?", size = 44 }) {
  if (src) return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  const ini = name.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  return <LinearGradient colors={T.grad} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "700" }}>{ini}</Text></LinearGradient>;
}
const TONE = { green: ["#dcfce7", "#15803d"], slate: ["#e2e8f0", "#475569"], blue: ["#dbeafe", "#1d4ed8"], orange: ["#ffedd5", "#c2410c"], violet: ["#ede9fe", "#6d28d9"], red: ["#fee2e2", "#b91c1c"] };
export const Badge = ({ tone = "slate", children }) => <View style={{ backgroundColor: TONE[tone][0], paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, alignSelf: "flex-start" }}><Text style={{ color: TONE[tone][1], fontSize: 11, fontWeight: "700" }}>{children}</Text></View>;
export function Btn({ title, onPress, kind = "primary", busy, disabled, style }) {
  const dis = busy || disabled;
  if (kind === "primary") return <TouchableOpacity disabled={dis} onPress={onPress} style={[{ opacity: dis ? 0.5 : 1 }, style]}><LinearGradient colors={T.grad} style={{ padding: 13, borderRadius: 12, alignItems: "center" }}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>{title}</Text>}</LinearGradient></TouchableOpacity>;
  return <TouchableOpacity disabled={dis} onPress={onPress} style={[{ padding: 13, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff" }, style]}><Text style={{ fontWeight: "700", color: kind === "danger" ? T.danger : T.text }}>{title}</Text></TouchableOpacity>;
}
export const Fab = ({ onPress }) => <TouchableOpacity onPress={onPress} style={{ position: "absolute", right: 18, bottom: 22 }} accessibilityLabel="Add new"><LinearGradient colors={T.gradAccent} style={{ width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", elevation: 6 }}><Icon name="plus" size={30} color="#fff" /></LinearGradient></TouchableOpacity>;
export const Field = ({ label, error, ...p }) => <View style={{ marginBottom: 12 }}>{label && <Text style={S.label}>{label}</Text>}
  <TextInput style={S.input} placeholderTextColor="#94a3b8" autoComplete="off" importantForAutofill="no" textContentType="none" autoCorrect={false} {...p} />{error ? <Text style={{ color: T.danger, fontSize: 12, marginTop: 3 }}>{[].concat(error).join(" ")}</Text> : null}</View>;
export function Sheet({ visible, title, onClose, children }) {
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View style={S.screen}>
    <LinearGradient colors={T.grad} style={{ paddingTop: 46, paddingBottom: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, color: "#fff", fontSize: 18, fontWeight: "700" }}>{title}</Text>
      <TouchableOpacity onPress={onClose}><Icon name="close" size={26} color="#fff" /></TouchableOpacity></LinearGradient>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">{children}</ScrollView></View></Modal>;
}
export function Select({ label, value, options, onChange, placeholder = "Select…", disabled }) {
  const [open, setOpen] = useState(false); const cur = options.find(o => String(o.value) === String(value));
  return <View style={{ marginBottom: 12, opacity: disabled ? 0.5 : 1 }}>{label && <Text style={S.label}>{label}</Text>}
    <TouchableOpacity disabled={disabled} style={[S.input, { flexDirection: "row", justifyContent: "space-between" }]} onPress={() => setOpen(true)}><Text style={{ color: cur ? T.text : "#94a3b8" }}>{cur ? cur.label : placeholder}</Text><Icon name="chevron-down" size={20} color={T.muted} /></TouchableOpacity>
    <Sheet visible={open} title={label || "Select"} onClose={() => setOpen(false)}>{options.length === 0 && <Text style={S.muted}>No options available.</Text>}
      {options.map(o => <TouchableOpacity key={String(o.value)} style={[S.card, { padding: 14 }]} onPress={() => { onChange(o.value); setOpen(false); }}><Text style={{ fontWeight: String(o.value) === String(value) ? "700" : "400" }}>{o.label}</Text></TouchableOpacity>)}</Sheet></View>;
}
export const Chips = ({ label, options, value, onChange, multi }) => <View style={{ marginBottom: 12 }}>{label && <Text style={S.label}>{label}</Text>}
  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{options.map(o => { const on = multi ? value.includes(o.value) : value === o.value;
    return <TouchableOpacity key={o.value} onPress={() => onChange(o.value)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 6, marginBottom: 6, borderColor: on ? T.brand : "#cbd5e1", backgroundColor: on ? T.brand : "#fff" }}>
      <Text style={{ color: on ? "#fff" : T.text, fontSize: 12, fontWeight: "600" }}>{o.label}</Text></TouchableOpacity>; })}</View></View>;
export function ActionBar({ onView, onEdit, onDelete, extra = [] }) {
  const B = (name, color, fn) => <TouchableOpacity key={name} onPress={fn} style={S.act}><Icon name={name} size={22} color={color} /></TouchableOpacity>;
  return <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 6 }}>
    {onView && B("eye-outline", T.info, onView)}{onEdit && B("pencil-outline", T.warn, onEdit)}{extra.map(x => B(x.icon, T.brand2, x.onClick))}{onDelete && B("trash-can-outline", T.danger, onDelete)}</View>;
}
export const confirmDelete = (msg, fn) => require("react-native").Alert.alert("Please confirm", msg, [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: fn }]);
export const Detail = ({ label, children }) => <View style={{ marginBottom: 10 }}><Text style={S.label}>{label}</Text><Text style={{ color: T.text }}>{children || "—"}</Text></View>;
export const Empty = ({ children }) => <Text style={{ textAlign: "center", color: T.muted, marginTop: 40 }}>{children}</Text>;
