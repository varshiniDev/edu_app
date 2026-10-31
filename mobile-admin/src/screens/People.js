import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Alert } from "react-native"; import { useIsFocused } from "@react-navigation/native"; import * as ImagePicker from "expo-image-picker";
import api from "../api"; import { S, Field, Btn, Fab, Sheet, Select, Chips, ActionBar, Avatar, Badge, Detail, Empty, FadeIn, confirmDelete, errText, buildForm, MULTIPART } from "../ui"; import { T } from "../theme";
const CFG = { staff: { one: "Staff member", idKey: "staff_id", idLabel: "Staff ID", dateKey: "joining_date", dateLabel: "Joining date (YYYY-MM-DD)", extra: "designation", extraLabel: "Designation" },
  students: { one: "Student", idKey: "student_id", idLabel: "Student ID", dateKey: "enrollment_date", dateLabel: "Enrollment date (YYYY-MM-DD)" } };
function Form({ c, kind, row, onClose, onDone }) {
  const edit = !!row; const [v, setV] = useState({ [c.idKey]: row?.[c.idKey] ?? "", full_name: row?.full_name ?? "", email: row?.email ?? "", phone: row?.phone ?? "", designation: row?.designation ?? "", [c.dateKey]: row?.[c.dateKey] ?? "", is_active: row?.is_active ?? true, password: "" });
  const [photo, setPhoto] = useState(null); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const set = k => t => setV({ ...v, [k]: t });
  const pick = async () => { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return Alert.alert("Permission needed");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [1, 1] }); if (!r.canceled) setPhoto(r.assets[0]); };
  const submit = async () => { setBusy(true); setErrors({}); const body = { ...v }; if (!c.extra) delete body.designation;
    const fd = buildForm(body, ["password", c.dateKey], photo && { field: "photo", uri: photo.uri, name: photo.fileName || "photo.jpg", type: photo.mimeType || "image/jpeg" });
    try { edit ? await api.patch(`/${kind}/${row.id}/`, fd, MULTIPART) : await api.post(`/${kind}/`, fd, MULTIPART); onDone(); } catch (e) { setErrors(e.response?.data || { detail: errText(e) }); } setBusy(false); };
  return <Sheet visible title={edit ? `Edit ${c.one}` : `Add ${c.one}`} onClose={onClose}>
    <View style={{ alignItems: "center", marginBottom: 14 }}><Avatar src={photo?.uri || row?.photo} name={v.full_name} size={86} /><Btn kind="ghost" title="Choose profile photo" onPress={pick} style={{ marginTop: 10 }} /></View>
    <Field label={c.idLabel + " *"} editable={!edit} value={v[c.idKey]} onChangeText={set(c.idKey)} error={errors[c.idKey]} /><Field label="Full name *" value={v.full_name} onChangeText={set("full_name")} error={errors.full_name} />
    <Field label="Email address *" keyboardType="email-address" autoCapitalize="none" value={v.email} onChangeText={set("email")} error={errors.email} /><Field label="Phone number" keyboardType="phone-pad" value={v.phone} onChangeText={set("phone")} />
    {c.extra && <Field label={c.extraLabel} value={v.designation} onChangeText={set("designation")} />}<Field label={c.dateLabel} placeholder="2026-01-31" value={v[c.dateKey] || ""} onChangeText={set(c.dateKey)} error={errors[c.dateKey]} />
    <Field label={edit ? "New password (leave blank to keep)" : "Password * (min 8)"} secureTextEntry autoComplete="new-password" value={v.password} onChangeText={set("password")} error={errors.password} />
    <Chips label="Account status" options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} value={v.is_active} onChange={x => setV({ ...v, is_active: x })} />
    {errors.detail ? <Text style={{ color: T.danger, marginBottom: 8 }}>{errors.detail}</Text> : null}<Btn title={edit ? "Update" : "Create"} busy={busy} onPress={submit} /></Sheet>;
}
function AssignToBatch({ s, onClose, onDone }) {
  const [courses, setCourses] = useState([]); const [batches, setBatches] = useState([]); const [course, setCourse] = useState(""); const [batch, setBatch] = useState(""); const [mode, setMode] = useState("OFFLINE");
  useEffect(() => { api.get("/courses/", { params: { page_size: 200 } }).then(r => setCourses(r.data.results.filter(x => x.status === "ACTIVE"))); api.get("/batches/", { params: { status: "ACTIVE", page_size: 500 } }).then(r => setBatches(r.data.results)); }, []);
  const go = async () => { try { await api.post(`/batches/${batch}/enrollments/`, { students: [s.user_id], mode }); Alert.alert("Done", "Student assigned"); onDone(); } catch (e) { Alert.alert("Error", errText(e)); } };
  return <Sheet visible title={`Assign ${s.full_name}`} onClose={onClose}><Select label="Course" value={course} options={courses.map(x => ({ value: x.id, label: x.name }))} onChange={x => { setCourse(x); setBatch(""); }} />
    <Select label="Batch" disabled={!course} value={batch} options={batches.filter(b => String(b.course) === String(course)).map(b => ({ value: b.id, label: `${b.name} (${b.enrolled_count}/${b.capacity})` }))} onChange={setBatch} />
    <Chips label="Class mode" options={[{ value: "OFFLINE", label: "Offline" }, { value: "ONLINE", label: "Online" }]} value={mode} onChange={setMode} /><Btn title="Assign" disabled={!batch} onPress={go} /></Sheet>;
}
export default function PeopleScreen({ kind }) {
  const c = CFG[kind]; const focused = useIsFocused(); const [rows, setRows] = useState(null); const [q, setQ] = useState(""); const [modal, setModal] = useState(null);
  const load = useCallback(() => api.get(`/${kind}/`, { params: { page_size: 500 } }).then(r => setRows(r.data.results)).catch(e => Alert.alert("Error", errText(e))), [kind]);
  useEffect(() => { if (focused) load(); }, [focused]); const done = () => { setModal(null); load(); };
  const remove = r => confirmDelete(`Delete ${r.full_name}?`, async () => { try { await api.delete(`/${kind}/${r.id}/`); load(); } catch (e) { Alert.alert("Cannot delete", errText(e)); } });
  const list = (rows || []).filter(r => `${r.full_name} ${r[c.idKey]} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
  return <View style={S.screen}><View style={{ padding: 12, paddingBottom: 0 }}><Field placeholder="Search name / ID / email" value={q} onChangeText={setQ} /></View>
    {!rows ? <Empty>Loading…</Empty> : <FlatList data={list} keyExtractor={r => String(r.id)} contentContainerStyle={{ padding: 12, paddingBottom: 100 }} ListEmptyComponent={<Empty>No records. Tap + to add.</Empty>}
      renderItem={({ item: r, index }) => <FadeIn delay={Math.min(index, 6) * 50}><View style={S.card}><View style={{ flexDirection: "row", alignItems: "center" }}><Avatar src={r.photo} name={r.full_name} /><View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: "700" }}>{r.full_name}</Text><Text style={S.muted}>{r[c.idKey]} · {r.email}</Text>{r.batches.length ? <Text style={S.muted}>Batches: {r.batches.join(", ")}</Text> : null}</View><Badge tone={r.is_active ? "green" : "slate"}>{r.is_active ? "Active" : "Inactive"}</Badge></View>
        <ActionBar onView={() => setModal({ t: "view", row: r })} onEdit={() => setModal({ t: "form", row: r })} onDelete={() => remove(r)} extra={kind === "students" ? [{ icon: "layers-plus", onClick: () => setModal({ t: "assign", row: r }) }] : []} /></View></FadeIn>} />}
    <Fab onPress={() => setModal({ t: "form" })} />
    {modal?.t === "form" && <Form c={c} kind={kind} row={modal.row} onClose={() => setModal(null)} onDone={done} />}{modal?.t === "assign" && <AssignToBatch s={modal.row} onClose={() => setModal(null)} onDone={done} />}
    {modal?.t === "view" && <Sheet visible title={`${c.one} profile`} onClose={() => setModal(null)}><View style={{ alignItems: "center", marginBottom: 14 }}><Avatar src={modal.row.photo} name={modal.row.full_name} size={90} /><Text style={[S.h, { marginTop: 8 }]}>{modal.row.full_name}</Text></View>
      <Detail label={c.idLabel}>{modal.row[c.idKey]}</Detail><Detail label="Email">{modal.row.email}</Detail><Detail label="Phone">{modal.row.phone}</Detail>{c.extra && <Detail label="Designation">{modal.row.designation}</Detail>}<Detail label="Date">{modal.row[c.dateKey]}</Detail><Detail label="Batches">{modal.row.batches.join(", ")}</Detail></Sheet>}</View>;
}
