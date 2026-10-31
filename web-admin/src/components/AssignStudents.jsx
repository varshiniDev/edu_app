import { useEffect, useMemo, useState } from "react"; import api from "../api";
import { Modal, Avatar, Field, useToast, errText } from "./ui.jsx";
/** Modal to enroll students into a batch with Online/Offline mode. Used by Batches and Enrollment pages. */
export default function AssignStudents({ batch, onClose, onDone }) {
  const toast = useToast(); const [students, setStudents] = useState([]); const [taken, setTaken] = useState(new Set());
  const [q, setQ] = useState(""); const [sel, setSel] = useState([]); const [mode, setMode] = useState("OFFLINE"); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  useEffect(() => {
    api.get("/students/", { params: { is_active: "true", page_size: 500 } }).then(r => setStudents(r.data.results));
    api.get(`/batches/${batch.id}/enrollments/`, { params: { active: "true" } }).then(r => setTaken(new Set(r.data.map(e => e.student))));
  }, [batch.id]);
  const list = useMemo(() => students.filter(s => !taken.has(s.user_id) && `${s.full_name} ${s.student_id}`.toLowerCase().includes(q.toLowerCase())), [students, taken, q]);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const submit = async () => { setBusy(true); setErr("");
    try { await api.post(`/batches/${batch.id}/enrollments/`, { students: sel, mode }); toast(`${sel.length} student(s) assigned`); onDone(); } catch (x) { setErr(errText(x)); } setBusy(false); };
  return <Modal title={`Assign students · ${batch.name}`} onClose={onClose}>
    <p className="text-sm text-slate-500 mb-3">Course: <b>{batch.course_name}</b> · {batch.enrolled_count}/{batch.capacity} seats used</p>
    <div className="grid sm:grid-cols-2 gap-3 mb-3"><Field label="Search students"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Name or student ID" autoComplete="off"/></Field>
      <Field label="Class mode for selected students"><select className="input" value={mode} onChange={e => setMode(e.target.value)}><option value="OFFLINE">Offline (in person)</option><option value="ONLINE">Online (gets meeting link)</option></select></Field></div>
    <div className="border rounded-xl max-h-64 overflow-y-auto divide-y">{list.length === 0 ? <p className="p-4 text-sm text-slate-500">No students available.</p> :
      list.map(s => <label key={s.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-slate-50"><input type="checkbox" checked={sel.includes(s.user_id)} onChange={() => toggle(s.user_id)}/>
        <Avatar src={s.photo} name={s.full_name} size={30}/><span className="text-sm">{s.full_name}</span><span className="text-xs text-slate-400 ml-auto">{s.student_id}</span></label>)}</div>
    {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
    <div className="flex justify-end gap-2 mt-4"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!sel.length || busy} onClick={submit}>{busy ? "Assigning…" : `Assign ${sel.length || ""} student(s)`}</button></div></Modal>;
}
