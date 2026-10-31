// Staff & Student portal screens. Same login as admin; the API only returns the user's own batches.
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking, Alert } from "react-native"; import { useIsFocused } from "@react-navigation/native"; import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import api, { tokens } from "../api"; import { T } from "../theme"; import { S, Field, Btn, Chips, Avatar, Badge, Detail, Empty, FadeIn, errText } from "../ui";
const hm = iso => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const iso = d => d.toLocaleDateString("en-CA"); const shift = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const STATE = { live: ["green", "Live now"], starting: ["blue", "Starting soon"], upcoming: ["slate", "Later today"], ended: ["slate", "Ended"] };
function useRefresh(load, every) {
  const focused = useIsFocused(); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!focused) return; load(); if (!every) return; const t = setInterval(load, every); return () => clearInterval(t); }, [focused]);
  return <RefreshControl refreshing={busy} onRefresh={async () => { setBusy(true); await load(); setBusy(false); }} />;
}
export function PortalHome({ me }) {
  const [live, setLive] = useState(null); const [plan, setPlan] = useState([]);
  const load = useCallback(async () => { try { const [a, b] = await Promise.all([api.get("/portal/live-classes/"), api.get("/portal/schedule/")]); setLive(a.data); setPlan(b.data); } catch (e) { setLive(l => l || []); } }, []);
  const rc = useRefresh(load, 30000);
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 14, paddingBottom: 40 }} refreshControl={rc}>
    <FadeIn><Text style={S.h}>Hello, {me?.name?.split(" ")[0]} 👋</Text></FadeIn>
    <Text style={S.label}>TODAY'S CLASSES</Text>{!live ? <Empty>Loading…</Empty> : live.length === 0 ? <Empty>No classes scheduled today.</Empty> : live.map((c, i) => <FadeIn key={c.batch} delay={i * 80}><View style={S.card}>
      <View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ flex: 1 }}><Text style={{ fontWeight: "700", fontSize: 16 }}>{c.name}</Text><Text style={S.muted}>{c.course} · {hm(c.starts_at)} – {hm(c.ends_at)}</Text></View><Badge tone={STATE[c.state][0]}>{STATE[c.state][1]}</Badge></View>
      {c.meet_link ? <Btn title="Join class (Google Meet)" onPress={() => Linking.openURL(c.meet_link)} style={{ marginTop: 12 }} /> : c.note ? <Text style={[S.muted, { marginTop: 10 }]}>{c.note}</Text> : c.is_open && c.mode !== "OFFLINE" ? <Text style={[S.muted, { marginTop: 10 }]}>The meeting link has not been added yet.</Text> : c.state !== "ended" ? <Text style={[S.muted, { marginTop: 10 }]}>The join link appears 10 minutes before class.</Text> : null}</View></FadeIn>)}
    <Text style={[S.label, { marginTop: 14 }]}>THIS WEEK</Text>{plan.length === 0 ? <Empty>Nothing scheduled.</Empty> : plan.map((p, i) => <View key={i} style={[S.card, { padding: 12, flexDirection: "row" }]}><Text style={{ width: 92, fontWeight: "700" }}>{p.date.slice(5)} {p.weekday}</Text><Text style={{ flex: 1 }}>{p.name}</Text><Text style={S.muted}>{p.start_time?.slice(0, 5)}</Text></View>)}</ScrollView>;
}
export function PortalBatches({ navigation }) {
  const [rows, setRows] = useState(null); const load = useCallback(() => api.get("/portal/batches/").then(r => setRows(r.data)).catch(() => setRows([])), []); const rc = useRefresh(load);
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 14 }} refreshControl={rc}>{!rows ? <Empty>Loading…</Empty> : rows.length === 0 ? <Empty>You have no batches yet.</Empty> : rows.map((b, i) => <FadeIn key={b.id} delay={i * 70}>
    <TouchableOpacity style={S.card} onPress={() => navigation.navigate("PBatch", { batch: b })}><View style={{ flexDirection: "row" }}><View style={{ flex: 1 }}><Text style={{ fontWeight: "700", fontSize: 16 }}>{b.name}</Text><Text style={S.muted}>{b.course}</Text>
      <Text style={S.muted}>{b.class_days || "—"} {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}</Text>{b.staff ? <Text style={S.muted}>Trainer: {b.staff}</Text> : null}{b.students != null ? <Text style={S.muted}>{b.students} students</Text> : null}</View>
      <View>{b.mode ? <Badge tone={b.mode === "ONLINE" ? "blue" : "orange"}>{b.mode}</Badge> : null}{b.status === "COMPLETED" ? <View style={{ marginTop: 6 }}><Badge>Completed</Badge></View> : null}</View></View></TouchableOpacity></FadeIn>)}</ScrollView>;
}
const ST = [["PRESENT", "P", "#16a34a"], ["ABSENT", "A", "#dc2626"], ["LATE", "L", "#d97706"], ["LEAVE", "Lv", "#0284c7"]]; const SCOL = { PRESENT: "green", ABSENT: "red", LATE: "orange", LEAVE: "blue" };
function StaffAttendance({ batch }) {
  const [date, setDate] = useState(iso(new Date())); const [sheet, setSheet] = useState(null);
  const load = useCallback(() => api.get("/portal/attendance/sheet/", { params: { batch: batch.id, date } }).then(r => setSheet(r.data)).catch(e => { setSheet({ rows: [], marked: 0, total: 0 }); Alert.alert("Error", errText(e)); }), [date]); useEffect(() => { setSheet(null); load(); }, [date]);
  const mark = (i, status) => setSheet({ ...sheet, rows: sheet.rows.map((r, j) => j === i ? { ...r, status } : r) });
  const save = async () => { const records = sheet.rows.filter(r => r.status).map(r => ({ student: r.student, status: r.status, note: r.note })); if (!records.length) return Alert.alert("Mark at least one student");
    try { const { data } = await api.post("/portal/attendance/sheet/", { batch: batch.id, date, records }); Alert.alert("Saved", `${data.saved} change(s) saved`); load(); } catch (e) { Alert.alert("Not saved", errText(e)); } };
  const today = iso(new Date());
  return <View><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><TouchableOpacity onPress={() => setDate(shift(date, -1))}><Text style={{ fontSize: 28, paddingHorizontal: 18, color: T.brand }}>‹</Text></TouchableOpacity>
    <Text style={{ fontWeight: "700", fontSize: 16 }}>{date}</Text><TouchableOpacity disabled={date >= today} onPress={() => setDate(shift(date, 1))}><Text style={{ fontSize: 28, paddingHorizontal: 18, color: date >= today ? "#cbd5e1" : T.brand }}>›</Text></TouchableOpacity></View>
    {!sheet ? <Empty>Loading…</Empty> : <><Text style={[S.muted, { marginBottom: 8 }]}>{sheet.marked}/{sheet.total} marked</Text>{sheet.rows.length === 0 ? <Empty>No students on this date.</Empty> : sheet.rows.map((r, i) => <View key={r.student} style={[S.card, { padding: 12 }]}>
      <Text style={{ fontWeight: "700" }}>{r.name}</Text><Text style={S.muted}>{r.student_code}</Text><View style={{ flexDirection: "row", marginTop: 8 }}>{ST.map(([k, l, c]) => <TouchableOpacity key={k} onPress={() => mark(i, k)} style={{ flex: 1, marginRight: 6, paddingVertical: 9, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: r.status === k ? c : "#cbd5e1", backgroundColor: r.status === k ? c : "#fff" }}>
        <Text style={{ fontWeight: "700", color: r.status === k ? "#fff" : T.text }}>{l}</Text></TouchableOpacity>)}</View></View>)}{sheet.rows.length > 0 && <Btn title="Save attendance" onPress={save} />}</>}</View>;
}
function StudentAttendance({ batch }) {
  const [d, setD] = useState(null); useEffect(() => { api.get("/portal/my-attendance/", { params: { batch: batch.id } }).then(r => setD(r.data)).catch(() => setD({ summary: {}, records: [] })); }, []);
  if (!d) return <Empty>Loading…</Empty>; const s = d.summary;
  return <View><View style={[S.card, { alignItems: "center" }]}><Text style={{ fontSize: 40, fontWeight: "800", color: T.brand }}>{s.percentage == null ? "—" : s.percentage + "%"}</Text><Text style={S.muted}>Attendance · {s.PRESENT || 0} present · {s.LATE || 0} late · {s.ABSENT || 0} absent · {s.LEAVE || 0} leave</Text></View>
    {d.records.length === 0 ? <Empty>No attendance recorded yet.</Empty> : d.records.map(r => <View key={r.date} style={[S.card, { padding: 12, flexDirection: "row", alignItems: "center" }]}><Text style={{ flex: 1 }}>{r.date}</Text><Badge tone={SCOL[r.status]}>{r.status}</Badge></View>)}</View>;
}
function Recordings({ batch }) {
  const [rows, setRows] = useState(null); useEffect(() => { api.get("/portal/recordings/", { params: { batch: batch.id } }).then(r => setRows(r.data)).catch(() => setRows([])); }, []);
  return !rows ? <Empty>Loading…</Empty> : rows.length === 0 ? <Empty>No recordings yet.</Empty> : <View>{rows.map(r => <TouchableOpacity key={r.date} style={[S.card, { padding: 12, flexDirection: "row", alignItems: "center" }]} onPress={() => Linking.openURL(r.url)}>
    <Icon name="play-circle" size={28} color={T.brand} /><View style={{ marginLeft: 12, flex: 1 }}><Text style={{ fontWeight: "700" }}>{r.date} · {r.weekday}</Text>{r.title ? <Text style={S.muted}>{r.title}</Text> : null}</View></TouchableOpacity>)}</View>;
}
const flat = (nodes, depth = 0) => nodes.flatMap(n => [{ ...n, depth }, ...flat(n.children, depth + 1)]);
function Materials({ batch }) {
  const [rows, setRows] = useState(null); useEffect(() => { api.get("/portal/materials/", { params: { batch: batch.id } }).then(r => setRows(flat(r.data))).catch(() => setRows([])); }, []);
  if (!rows) return <Empty>Loading…</Empty>; const any = rows.some(n => n.materials.length);
  return !any ? <Empty>No study material uploaded yet.</Empty> : <View>{rows.filter(n => n.materials.length).map(n => <View key={n.id} style={[S.card, { padding: 12 }]}><Text style={{ fontWeight: "700" }}>{n.number} {n.title}</Text>
    {n.materials.map(m => <TouchableOpacity key={m.id} style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }} onPress={() => Linking.openURL(m.url)}><Icon name="file-pdf-box" size={24} color={T.danger} /><Text style={{ color: T.brand, marginLeft: 8, flex: 1 }}>{m.title}</Text></TouchableOpacity>)}</View>)}</View>;
}
export function PortalBatch({ route, me }) {
  const { batch } = route.params; const staff = me?.role === "STAFF"; const [tab, setTab] = useState("att");
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled"><Text style={S.h}>{batch.name}</Text>
    <Chips options={[{ value: "att", label: staff ? "Attendance" : "My attendance" }, { value: "rec", label: "Recordings" }, { value: "mat", label: "Material" }]} value={tab} onChange={setTab} />
    {tab === "att" && (staff ? <StaffAttendance batch={batch} /> : <StudentAttendance batch={batch} />)}{tab === "rec" && <Recordings batch={batch} />}{tab === "mat" && <Materials batch={batch} />}</ScrollView>;
}
export function PortalProfile({ me, onLogout }) {
  const [v, setV] = useState({ old_password: "", new_password: "", confirm: "" }); const [errors, setErrors] = useState({}); const staff = me?.role === "STAFF";
  const submit = async () => { setErrors({}); if (v.new_password !== v.confirm) return setErrors({ confirm: "Passwords do not match." });
    try { await api.post("/portal/change-password/", { old_password: v.old_password, new_password: v.new_password }); Alert.alert("Done", "Password changed"); setV({ old_password: "", new_password: "", confirm: "" }); } catch (e) { setErrors(e.response?.data || { detail: errText(e) }); } };
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled"><FadeIn><View style={S.card}><View style={{ alignItems: "center", marginBottom: 12 }}><Avatar src={me?.photo} name={me?.name} size={90} /><Text style={[S.h, { marginTop: 8, marginBottom: 2 }]}>{me?.name}</Text><Badge tone="violet">{staff ? "Staff" : "Student"}</Badge></View>
    <Detail label={staff ? "Staff ID" : "Student ID"}>{me?.code}</Detail><Detail label="Email">{me?.email}</Detail><Detail label="Phone">{me?.phone}</Detail>{staff ? <Detail label="Designation">{me?.designation}</Detail> : null}<Detail label={staff ? "Joined" : "Enrolled on"}>{me?.joined}</Detail>
    <Text style={S.muted}>Your photo and details are managed by the academy admin.</Text></View></FadeIn>
    <FadeIn delay={100}><View style={S.card}><Text style={S.h}>Change password</Text><Field label="Current password" secureTextEntry autoComplete="current-password" value={v.old_password} onChangeText={t => setV({ ...v, old_password: t })} error={errors.old_password} />
      <Field label="New password" secureTextEntry autoComplete="new-password" value={v.new_password} onChangeText={t => setV({ ...v, new_password: t })} error={errors.new_password} /><Field label="Confirm new password" secureTextEntry autoComplete="new-password" value={v.confirm} onChangeText={t => setV({ ...v, confirm: t })} error={errors.confirm} />
      <Btn title="Update password" onPress={submit} /></View></FadeIn><Btn kind="danger" title="Logout" onPress={async () => { await tokens.clear(); onLogout(); }} /></ScrollView>;
}
