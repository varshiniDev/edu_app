import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Alert, ScrollView, TouchableOpacity, Linking } from "react-native"; import { MaterialCommunityIcons as Icon } from "@expo/vector-icons"; import { useIsFocused } from "@react-navigation/native"; import * as DocumentPicker from "expo-document-picker";
import api from "../api"; import { T } from "../theme"; import { S, Field, Btn, Fab, Sheet, Chips, ActionBar, Badge, Detail, Empty, FadeIn, confirmDelete, errText, buildForm, MULTIPART } from "../ui";
function CourseForm({ row, onClose, onDone }) {
  const edit = !!row; const [v, setV] = useState({ name: row?.name ?? "", code: row?.code ?? "", duration_weeks: String(row?.duration_weeks ?? 0), description: row?.description ?? "", status: row?.status ?? "ACTIVE" }); const [errors, setErrors] = useState({}); const set = k => t => setV({ ...v, [k]: t });
  const submit = async () => { try { const b = { ...v, duration_weeks: +v.duration_weeks || 0 }; edit ? await api.patch(`/courses/${row.id}/`, b) : await api.post("/courses/", b); onDone(); } catch (e) { setErrors(e.response?.data || { detail: errText(e) }); } };
  return <Sheet visible title={edit ? "Edit course" : "Add course"} onClose={onClose}><Field label="Course name *" value={v.name} onChangeText={set("name")} error={errors.name} /><Field label="Course code *" value={v.code} onChangeText={set("code")} error={errors.code} />
    <Field label="Duration (weeks)" keyboardType="number-pad" value={v.duration_weeks} onChangeText={set("duration_weeks")} /><Field label="Description" multiline value={v.description} onChangeText={set("description")} />
    <Chips label="Status" options={["ACTIVE", "ARCHIVED"].map(x => ({ value: x, label: x }))} value={v.status} onChange={set("status")} /><Btn title={edit ? "Update" : "Create"} onPress={submit} /></Sheet>;
}
export default function CoursesScreen({ navigation }) {
  const focused = useIsFocused(); const [rows, setRows] = useState(null); const [modal, setModal] = useState(null);
  const load = useCallback(() => api.get("/courses/", { params: { page_size: 500 } }).then(r => setRows(r.data.results)), []); useEffect(() => { if (focused) load(); }, [focused]);
  const remove = c => confirmDelete(`Delete course "${c.name}"?`, async () => { try { await api.delete(`/courses/${c.id}/`); load(); } catch (e) { Alert.alert("Cannot delete", errText(e)); } });
  return <View style={S.screen}>{!rows ? <Empty>Loading…</Empty> : <FlatList data={rows} keyExtractor={c => String(c.id)} contentContainerStyle={{ padding: 12, paddingBottom: 100 }} ListEmptyComponent={<Empty>No courses. Tap + to add.</Empty>}
    renderItem={({ item: c, index }) => <FadeIn delay={Math.min(index, 6) * 50}><View style={S.card}><View style={{ flexDirection: "row" }}><View style={{ flex: 1 }}><Text style={{ fontWeight: "700", fontSize: 16 }}>{c.name}</Text><Text style={S.muted}>{c.code} · {c.duration_weeks} weeks · {c.topic_count} topics</Text></View><Badge tone={c.status === "ACTIVE" ? "green" : "slate"}>{c.status}</Badge></View>
      <ActionBar onView={() => setModal({ t: "view", row: c })} onEdit={() => setModal({ t: "form", row: c })} onDelete={() => remove(c)} extra={[{ icon: "file-tree", onClick: () => navigation.navigate("Syllabus", { id: c.id, name: c.name }) }]} /></View></FadeIn>} />}
    <Fab onPress={() => setModal({ t: "form" })} />{modal?.t === "form" && <CourseForm row={modal.row} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    {modal?.t === "view" && <Sheet visible title={modal.row.name} onClose={() => setModal(null)}><Detail label="Code">{modal.row.code}</Detail><Detail label="Duration">{modal.row.duration_weeks} weeks</Detail><Detail label="Topics">{String(modal.row.topic_count)}</Detail><Detail label="Description">{modal.row.description}</Detail></Sheet>}</View>;
}
function Materials({ topic, onClose, onChange }) {
  const [list, setList] = useState(topic.materials); const reload = () => api.get(`/topics/${topic.id}/materials/`).then(r => { setList(r.data); onChange(); });
  const upload = async () => { const r = await DocumentPicker.getDocumentAsync({ type: "application/pdf" }); if (r.canceled) return; const f = r.assets[0];
    try { await api.post(`/topics/${topic.id}/materials/`, buildForm({ title: f.name.replace(/\.pdf$/i, "") }, [], { field: "file", uri: f.uri, name: f.name, type: "application/pdf" }), MULTIPART); reload(); } catch (e) { Alert.alert("Upload failed", errText(e)); } };
  return <Sheet visible title={`Material · ${topic.title}`} onClose={onClose}><Text style={[S.muted, { marginBottom: 10 }]}>PDFs are visible to staff and students of batches on this course.</Text>{list.length === 0 && <Empty>No material yet.</Empty>}
    {list.map(m => <View key={m.id} style={[S.card, { flexDirection: "row", alignItems: "center", padding: 12 }]}><Icon name="file-pdf-box" size={26} color={T.danger} /><TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => Linking.openURL(m.url)}><Text style={{ color: T.brand }}>{m.title}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => confirmDelete("Remove this PDF?", async () => { await api.delete(`/materials/${m.id}/`); reload(); })}><Icon name="trash-can-outline" size={22} color={T.danger} /></TouchableOpacity></View>)}<Btn title="Upload PDF" onPress={upload} /></Sheet>;
}
function Node({ n, depth, act }) {
  const [open, setOpen] = useState(true);
  return <View style={{ marginLeft: depth ? 12 : 0 }}><View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}><TouchableOpacity style={{ flex: 1 }} onPress={() => setOpen(!open)}><Text>{n.children.length ? (open ? "▾ " : "▸ ") : "• "}{n.number} {n.title}</Text></TouchableOpacity>
    <TouchableOpacity style={S.act} onPress={() => act.materials(n)}><Icon name="paperclip" size={20} color={T.brand2} />{n.materials.length ? <Text style={{ position: "absolute", top: 0, right: 0, fontSize: 10, color: T.brand2, fontWeight: "700" }}>{n.materials.length}</Text> : null}</TouchableOpacity>
    <TouchableOpacity style={S.act} onPress={() => act.add(n)}><Icon name="plus-circle-outline" size={20} color={T.info} /></TouchableOpacity><TouchableOpacity style={S.act} onPress={() => act.edit(n)}><Icon name="pencil-outline" size={20} color={T.warn} /></TouchableOpacity>
    <TouchableOpacity style={S.act} onPress={() => act.del(n)}><Icon name="trash-can-outline" size={20} color={T.danger} /></TouchableOpacity></View>{open && n.children.map(c => <Node key={c.id} n={c} depth={depth + 1} act={act} />)}</View>;
}
export function SyllabusScreen({ route }) {
  const { id } = route.params; const [tree, setTree] = useState(null); const [modal, setModal] = useState(null); const [title, setTitle] = useState("");
  const load = useCallback(() => api.get(`/courses/${id}/topics/`).then(r => setTree(r.data)), [id]); useEffect(() => { load(); }, [load]);
  const find = (items, tid) => { for (const n of items) { if (n.id === tid) return n; const f = find(n.children, tid); if (f) return f; } };
  const act = { add: n => { setTitle(""); setModal({ t: "form", parent: n }); }, edit: n => { setTitle(n.title); setModal({ t: "form", topic: n }); }, materials: n => setModal({ t: "mat", id: n.id }),
    del: n => confirmDelete(`Delete "${n.title}" and its subtopics?`, () => api.delete(`/topics/${n.id}/`).then(load).catch(e => Alert.alert("Error", errText(e)))) };
  const save = async () => { if (!title.trim()) return; try { modal.topic ? await api.patch(`/topics/${modal.topic.id}/`, { title }) : await api.post(`/courses/${id}/topics/`, { title, parent: modal.parent?.id ?? null }); setModal(null); load(); } catch (e) { Alert.alert("Error", errText(e)); } };
  if (!tree) return <Empty>Loading…</Empty>;
  return <View style={S.screen}><ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>{tree.length === 0 && <Empty>No topics yet. Tap + to add.</Empty>}{tree.map(n => <Node key={n.id} n={n} depth={0} act={act} />)}</ScrollView><Fab onPress={() => { setTitle(""); setModal({ t: "form" }); }} />
    {modal?.t === "form" && <Sheet visible title={modal.topic ? "Edit topic" : modal.parent ? `Subtopic of "${modal.parent.title}"` : "Add main topic"} onClose={() => setModal(null)}><Field label="Topic title *" value={title} onChangeText={setTitle} /><Btn title="Save" onPress={save} /></Sheet>}
    {modal?.t === "mat" && find(tree, modal.id) && <Materials key={modal.id} topic={find(tree, modal.id)} onClose={() => setModal(null)} onChange={load} />}</View>;
}
