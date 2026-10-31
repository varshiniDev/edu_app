import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, Linking } from "react-native"; import { MaterialCommunityIcons as Icon } from "@expo/vector-icons"; import { useIsFocused } from "@react-navigation/native";
import api from "../api"; import { T } from "../theme"; import { S, Field, Btn, Fab, Sheet, Select, Chips, ActionBar, Avatar, Badge, Detail, Empty, FadeIn, confirmDelete, errText } from "../ui";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => ({ value: d, label: d }));
function BatchForm({ row, courses, staff, onClose, onDone }) {
  const edit = !!row; const [v, setV] = useState({ name: row?.name ?? "", course: row?.course ?? "", staff: row?.staff ?? "", start_date: row?.start_date ?? "", end_date: row?.end_date ?? "", capacity: String(row?.capacity ?? 30),
    class_days: row?.class_days ? row.class_days.split(",") : [], start_time: row?.start_time?.slice(0, 5) ?? "", end_time: row?.end_time?.slice(0, 5) ?? "", meet_link: row?.meet_link ?? "", status: row?.status ?? "ACTIVE" });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const set = k => t => setV({ ...v, [k]: t });
  const submit = async () => { setBusy(true); setErrors({});
    const b = { ...v, course: +v.course, staff: v.staff ? +v.staff : null, end_date: v.end_date || null, start_time: v.start_time || null, end_time: v.end_time || null, capacity: +v.capacity || 1, class_days: v.class_days.join(",") };
    try { edit ? await api.patch(`/batches/${row.id}/`, b) : await api.post("/batches/", b); onDone(); } catch (e) { setErrors(e.response?.data || { detail: errText(e) }); } setBusy(false); };
  return <Sheet visible title={edit ? "Edit batch" : "Add batch"} onClose={onClose}>
    <Field label="Batch name *" value={v.name} onChangeText={set("name")} error={errors.name} /><Select label="Course *" disabled={edit} value={v.course} options={courses.map(c => ({ value: c.id, label: c.name }))} onChange={set("course")} />
    <Select label="Assigned staff" value={v.staff} options={[{ value: "", label: "Not assigned" }, ...staff.map(s => ({ value: s.user_id, label: s.full_name }))]} onChange={set("staff")} />
    <Field label="Start date * (YYYY-MM-DD)" value={v.start_date} onChangeText={set("start_date")} error={errors.start_date} /><Field label="End date (YYYY-MM-DD)" value={v.end_date || ""} onChangeText={set("end_date")} error={errors.end_date} />
    <Field label="Capacity (seats)" keyboardType="number-pad" value={v.capacity} onChangeText={set("capacity")} error={errors.capacity} />
    <Chips label="Class days" multi options={DAYS} value={v.class_days} onChange={d => setV({ ...v, class_days: v.class_days.includes(d) ? v.class_days.filter(x => x !== d) : [...v.class_days, d] })} />
    <Field label="Class start time (HH:MM)" placeholder="10:00" value={v.start_time} onChangeText={set("start_time")} error={errors.start_time} /><Field label="Class end time (HH:MM)" placeholder="11:30" value={v.end_time} onChangeText={set("end_time")} error={errors.end_time} />
    <Field label="Google Meet link (replace any time)" autoCapitalize="none" keyboardType="url" placeholder="https://meet.google.com/abc-defg-hij" value={v.meet_link} onChangeText={set("meet_link")} error={errors.meet_link} />
    <Chips label="Status" options={["ACTIVE", "COMPLETED", "ARCHIVED"].map(x => ({ value: x, label: x }))} value={v.status} onChange={set("status")} />
    {errors.detail ? <Text style={{ color: T.danger }}>{errors.detail}</Text> : null}<Btn title={edit ? "Update" : "Create"} busy={busy} onPress={submit} /></Sheet>;
}
export function AssignStudents({ batch, onClose, onDone }) {
  const [students, setStudents] = useState([]); const [taken, setTaken] = useState([]); const [q, setQ] = useState(""); const [sel, setSel] = useState([]); const [mode, setMode] = useState("OFFLINE"); const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/students/", { params: { is_active: "true", page_size: 500 } }).then(r => setStudents(r.data.results)); api.get(`/batches/${batch.id}/enrollments/`, { params: { active: "true" } }).then(r => setTaken(r.data.map(e => e.student))); }, []);
  const list = students.filter(s => !taken.includes(s.user_id) && `${s.full_name} ${s.student_id}`.toLowerCase().includes(q.toLowerCase()));
  const go = async () => { setBusy(true); try { await api.post(`/batches/${batch.id}/enrollments/`, { students: sel, mode }); onDone(); } catch (e) { Alert.alert("Error", errText(e)); } setBusy(false); };
  return <Sheet visible title={`Assign students · ${batch.name}`} onClose={onClose}><Text style={[S.muted, { marginBottom: 8 }]}>Course: {batch.course_name} · {batch.enrolled_count}/{batch.capacity} seats used</Text>
    <Chips label="Class mode for selected students" options={[{ value: "OFFLINE", label: "Offline" }, { value: "ONLINE", label: "Online" }]} value={mode} onChange={setMode} /><Field label="Search students" value={q} onChangeText={setQ} />
    {list.length === 0 && <Empty>No students available.</Empty>}{list.map(s => { const on = sel.includes(s.user_id); return <TouchableOpacity key={s.id} style={[S.card, { flexDirection: "row", alignItems: "center", padding: 10 }]} onPress={() => setSel(on ? sel.filter(x => x !== s.user_id) : [...sel, s.user_id])}>
      <Icon name={on ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={on ? T.brand : T.muted} /><View style={{ marginLeft: 10 }}><Avatar src={s.photo} name={s.full_name} size={32} /></View><Text style={{ marginLeft: 10, flex: 1 }}>{s.full_name}</Text><Text style={S.muted}>{s.student_id}</Text></TouchableOpacity>; })}
    <Btn title={`Assign ${sel.length} student(s)`} disabled={!sel.length} busy={busy} onPress={go} /></Sheet>;
}
function Recordings({ batch, onClose }) {
  const [rows, setRows] = useState(null); const [edit, setEdit] = useState(null); const [url, setUrl] = useState(""); const [title, setTitle] = useState("");
  const load = () => api.get(`/batches/${batch.id}/recordings/`).then(r => setRows(r.data)); useEffect(() => { load(); }, []);
  const save = async () => { try { await api.post(`/batches/${batch.id}/recordings/`, { date: edit.date, url, title }); setEdit(null); load(); } catch (e) { Alert.alert("Error", errText(e)); } };
  const remove = r => confirmDelete(`Remove recording for ${r.date}?`, async () => { await api.delete(`/batches/${batch.id}/recordings/`, { params: { date: r.date } }); load(); });
  return <Sheet visible title={`Daily recordings · ${batch.name}`} onClose={onClose}><Text style={[S.muted, { marginBottom: 10 }]}>One row per class day since {batch.start_date}. Paste the Google Drive/Meet recording link for each day.</Text>
    {!rows ? <Empty>Loading…</Empty> : rows.length === 0 ? <Empty>No class days yet.</Empty> : rows.map(r => <View key={r.date} style={[S.card, { padding: 12 }]}><View style={{ flexDirection: "row", alignItems: "center" }}><View style={{ flex: 1 }}><Text style={{ fontWeight: "700" }}>{r.date} · {r.weekday}</Text>
      {r.url ? <TouchableOpacity onPress={() => Linking.openURL(r.url)}><Text style={{ color: T.brand }}>▶ Open recording</Text></TouchableOpacity> : <Badge tone="orange">Not added</Badge>}</View>
      <ActionBar onEdit={() => { setUrl(r.url); setTitle(r.title); setEdit(r); }} onDelete={r.url ? () => remove(r) : null} /></View></View>)}
    {edit && <Sheet visible title={`Recording · ${edit.date}`} onClose={() => setEdit(null)}><Field label="Recording link *" autoCapitalize="none" keyboardType="url" value={url} onChangeText={setUrl} /><Field label="Title (optional)" value={title} onChangeText={setTitle} /><Btn title="Save" onPress={save} /></Sheet>}</Sheet>;
}
export default function BatchesScreen() {
  const focused = useIsFocused(); const [rows, setRows] = useState(null); const [courses, setCourses] = useState([]); const [staff, setStaff] = useState([]); const [q, setQ] = useState(""); const [modal, setModal] = useState(null);
  const load = useCallback(() => api.get("/batches/", { params: { page_size: 500 } }).then(r => setRows(r.data.results)).catch(e => Alert.alert("Error", errText(e))), []);
  useEffect(() => { if (focused) { load(); api.get("/courses/", { params: { page_size: 500 } }).then(r => setCourses(r.data.results.filter(c => c.status === "ACTIVE"))); api.get("/staff/", { params: { is_active: "true", page_size: 500 } }).then(r => setStaff(r.data.results)); } }, [focused]);
  const done = () => { setModal(null); load(); }; const remove = b => confirmDelete(`Delete batch "${b.name}"?`, async () => { try { await api.delete(`/batches/${b.id}/`); load(); } catch (e) { Alert.alert("Cannot delete", errText(e)); } });
  const list = (rows || []).filter(b => `${b.name} ${b.course_name} ${b.staff_name}`.toLowerCase().includes(q.toLowerCase())); const cur = modal?.row && rows?.find(b => b.id === modal.row.id) || modal?.row;
  return <View style={S.screen}><View style={{ padding: 12, paddingBottom: 0 }}><Field placeholder="Search batch / course / staff" value={q} onChangeText={setQ} /></View>
    {!rows ? <Empty>Loading…</Empty> : <FlatList data={list} keyExtractor={b => String(b.id)} contentContainerStyle={{ padding: 12, paddingBottom: 100 }} ListEmptyComponent={<Empty>No batches. Tap + to add.</Empty>}
      renderItem={({ item: b, index }) => <FadeIn delay={Math.min(index, 6) * 50}><View style={S.card}><View style={{ flexDirection: "row" }}><View style={{ flex: 1 }}><Text style={{ fontWeight: "700", fontSize: 16 }}>{b.name}</Text><Text style={S.muted}>{b.course_name}</Text>
        <Text style={S.muted}>Staff: {b.staff_name || "Unassigned"}</Text><Text style={S.muted}>{b.class_days || "—"} {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}</Text><Text style={S.muted}>{b.enrolled_count}/{b.capacity} students · {b.online_count} online · {b.offline_count} offline</Text></View>
        <View><Badge tone={b.status === "ACTIVE" ? "green" : "slate"}>{b.status}</Badge>{b.meet_link ? <View style={{ marginTop: 6 }}><Badge tone="blue">Meet link set</Badge></View> : null}</View></View>
        <ActionBar onView={() => setModal({ t: "view", row: b })} onEdit={() => setModal({ t: "form", row: b })} onDelete={() => remove(b)} extra={[{ icon: "account-plus-outline", onClick: () => setModal({ t: "assign", row: b }) }, { icon: "video-outline", onClick: () => setModal({ t: "rec", row: b }) }]} /></View></FadeIn>} />}
    <Fab onPress={() => setModal({ t: "form" })} />{modal?.t === "form" && <BatchForm row={modal.row} courses={courses} staff={staff} onClose={() => setModal(null)} onDone={done} />}
    {modal?.t === "assign" && <AssignStudents batch={cur} onClose={() => setModal(null)} onDone={done} />}{modal?.t === "rec" && <Recordings batch={cur} onClose={() => setModal(null)} />}
    {modal?.t === "view" && <Sheet visible title={cur.name} onClose={() => setModal(null)}><Detail label="Course">{cur.course_name}</Detail><Detail label="Staff">{cur.staff_name}</Detail><Detail label="Dates">{cur.start_date} → {cur.end_date || "open"}</Detail><Detail label="Schedule">{cur.class_days} {cur.start_time?.slice(0, 5)}–{cur.end_time?.slice(0, 5)}</Detail>
      <Detail label="Students">{cur.enrolled_count}/{cur.capacity} ({cur.online_count} online, {cur.offline_count} offline)</Detail>
      <Detail label="Google Meet link">{cur.meet_link}</Detail>{cur.meet_link ? <Btn kind="ghost" title="Open link" onPress={() => Linking.openURL(cur.meet_link)} /> : null}<View style={{ height: 10 }} /><Btn title="Edit / replace link" onPress={() => setModal({ t: "form", row: cur })} /></Sheet>}</View>;
}
