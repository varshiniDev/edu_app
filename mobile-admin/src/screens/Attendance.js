import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native"; import api from "../api"; import { T } from "../theme"; import { S, Btn, Select, Empty, FadeIn, errText } from "../ui";
const ST = [["PRESENT", "P", "#16a34a"], ["ABSENT", "A", "#dc2626"], ["LATE", "L", "#d97706"], ["LEAVE", "Lv", "#0284c7"]];
const iso = d => d.toISOString().slice(0, 10); const shift = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
export default function AttendanceScreen() {
  const [batches, setBatches] = useState([]); const [batch, setBatch] = useState(""); const [date, setDate] = useState(iso(new Date())); const [sheet, setSheet] = useState(null); const [pct, setPct] = useState(null);
  useEffect(() => { api.get("/batches/", { params: { status: "ACTIVE", page_size: 500 } }).then(r => setBatches(r.data.results)); }, []);
  const load = useCallback(() => { if (!batch) return setSheet(null);
    api.get("/attendance/sheet/", { params: { batch, date } }).then(r => setSheet(r.data)).catch(e => Alert.alert("Error", errText(e))); api.get("/attendance/summary/", { params: { batch } }).then(r => setPct(r.data.overall_percentage)); }, [batch, date]);
  useEffect(() => { load(); }, [batch, date]);
  const mark = (i, status) => setSheet({ ...sheet, rows: sheet.rows.map((r, j) => j === i ? { ...r, status } : r) });
  const save = async () => { const records = sheet.rows.filter(r => r.status).map(r => ({ student: r.student, status: r.status, note: r.note })); if (!records.length) return Alert.alert("Mark at least one student");
    try { const { data } = await api.post("/attendance/sheet/", { batch: +batch, date, records }); Alert.alert("Saved", `${data.saved} change(s) saved`); load(); } catch (e) { Alert.alert("Error", errText(e)); } };
  return <ScrollView style={S.screen} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}><Select label="Batch" value={batch} options={batches.map(b => ({ value: b.id, label: `${b.name} · ${b.staff_name || "no staff"}` }))} onChange={setBatch} />
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><TouchableOpacity onPress={() => setDate(shift(date, -1))}><Text style={{ fontSize: 28, paddingHorizontal: 18, color: T.brand }}>‹</Text></TouchableOpacity>
      <Text style={{ fontWeight: "700", fontSize: 16 }}>{date}</Text><TouchableOpacity disabled={date >= iso(new Date())} onPress={() => setDate(shift(date, 1))}><Text style={{ fontSize: 28, paddingHorizontal: 18, color: date >= iso(new Date()) ? "#cbd5e1" : T.brand }}>›</Text></TouchableOpacity></View>
    {!batch ? <Empty>Select a batch to mark or review attendance.</Empty> : !sheet ? <Empty>Loading…</Empty> : <FadeIn><Text style={[S.muted, { marginBottom: 8 }]}>{sheet.marked}/{sheet.total} marked{pct != null ? ` · overall ${pct}%` : ""}</Text>
      {sheet.rows.length === 0 ? <Empty>No students were enrolled on this date.</Empty> : sheet.rows.map((r, i) => <View key={r.student} style={[S.card, { padding: 12 }]}><Text style={{ fontWeight: "700" }}>{r.name}</Text><Text style={S.muted}>{r.student_code}</Text>
        <View style={{ flexDirection: "row", marginTop: 8 }}>{ST.map(([k, l, c]) => <TouchableOpacity key={k} onPress={() => mark(i, k)} style={{ flex: 1, marginRight: 6, paddingVertical: 9, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: r.status === k ? c : "#cbd5e1", backgroundColor: r.status === k ? c : "#fff" }}>
          <Text style={{ fontWeight: "700", color: r.status === k ? "#fff" : T.text }}>{l}</Text></TouchableOpacity>)}</View></View>)}
      {sheet.rows.length > 0 && <Btn title="Save attendance" onPress={save} />}</FadeIn>}</ScrollView>;
}
