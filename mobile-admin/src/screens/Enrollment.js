import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Alert } from "react-native"; import api from "../api";
import { S, Fab, Select, ActionBar, Avatar, Badge, Empty, FadeIn, confirmDelete, errText } from "../ui"; import { AssignStudents } from "./Batches";
export default function EnrollmentScreen() {
  const [courses, setCourses] = useState([]); const [batches, setBatches] = useState([]); const [course, setCourse] = useState(""); const [batchId, setBatchId] = useState(""); const [rows, setRows] = useState([]); const [assign, setAssign] = useState(false);
  const loadBatches = useCallback(() => api.get("/batches/", { params: { status: "ACTIVE", page_size: 500 } }).then(r => setBatches(r.data.results)), []);
  useEffect(() => { api.get("/courses/", { params: { page_size: 500 } }).then(r => setCourses(r.data.results.filter(c => c.status === "ACTIVE"))); loadBatches(); }, []);
  const batch = batches.find(b => String(b.id) === String(batchId));
  const load = useCallback(() => batchId ? api.get(`/batches/${batchId}/enrollments/`, { params: { active: "true" } }).then(r => setRows(r.data)) : setRows([]), [batchId]); useEffect(() => { load(); }, [batchId]);
  const refresh = () => { setAssign(false); load(); loadBatches(); };
  const toggleMode = async r => { try { await api.post(`/batches/${batchId}/mode/`, { student: r.student, mode: r.mode === "ONLINE" ? "OFFLINE" : "ONLINE" }); load(); } catch (e) { Alert.alert("Error", errText(e)); } };
  const remove = r => confirmDelete(`Remove ${r.student_name} from this batch? History is kept.`, async () => { try { await api.post(`/batches/${batchId}/leave/`, { student: r.student }); refresh(); } catch (e) { Alert.alert("Error", errText(e)); } });
  return <View style={S.screen}><View style={{ padding: 12, paddingBottom: 0 }}><Select label="1. Course" value={course} options={courses.map(c => ({ value: c.id, label: c.name }))} onChange={x => { setCourse(x); setBatchId(""); }} />
    <Select label="2. Batch" disabled={!course} value={batchId} options={batches.filter(b => String(b.course) === String(course)).map(b => ({ value: b.id, label: `${b.name} (${b.enrolled_count}/${b.capacity})` }))} onChange={setBatchId} /></View>
    {!batch ? <Empty>Select a course and batch to see enrolled students.</Empty> : <FlatList data={rows} keyExtractor={r => String(r.id)} contentContainerStyle={{ padding: 12, paddingBottom: 100 }} ListEmptyComponent={<Empty>No students enrolled. Tap + to assign.</Empty>}
      renderItem={({ item: r, index }) => <FadeIn delay={Math.min(index, 6) * 50}><View style={S.card}><View style={{ flexDirection: "row", alignItems: "center" }}><Avatar src={r.student_photo} name={r.student_name} size={40} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontWeight: "700" }}>{r.student_name}</Text><Text style={S.muted}>{r.student_code} · since {r.enrolled_on}</Text></View>
        <Badge tone={r.mode === "ONLINE" ? "blue" : "orange"}>{r.mode}</Badge></View><ActionBar onView={() => Alert.alert(r.student_name, `ID: ${r.student_code}\nMode: ${r.mode}\nEnrolled: ${r.enrolled_on}\n${r.note || ""}`)} onEdit={() => toggleMode(r)} onDelete={() => remove(r)} /></View></FadeIn>} />}
    {batch && <Fab onPress={() => setAssign(true)} />}{assign && <AssignStudents batch={batch} onClose={() => setAssign(false)} onDone={refresh} />}</View>;
}
