import { useEffect, useState, useCallback } from "react"; import { useNavigate } from "react-router-dom"; import { ListTree } from "lucide-react"; import api from "../api";
import { PageHeader, DataTable, Modal, ConfirmDialog, Field, Badge, Detail, useToast, errText } from "../components/ui.jsx";
function CourseForm({ row, onClose, onDone }) {
  const toast = useToast(); const edit = !!row; const [v, setV] = useState({ name: row?.name ?? "", code: row?.code ?? "", duration_weeks: row?.duration_weeks ?? 0, description: row?.description ?? "", status: row?.status ?? "ACTIVE" });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const set = k => e => setV({ ...v, [k]: e.target.value });
  const submit = async e => { e.preventDefault(); setBusy(true); setErrors({});
    try { const b = { ...v, duration_weeks: +v.duration_weeks || 0 }; edit ? await api.patch(`/courses/${row.id}/`, b) : await api.post("/courses/", b); toast(edit ? "Course updated" : "Course created"); onDone(); }
    catch (x) { setErrors(x.response?.data || { detail: errText(x) }); } setBusy(false); };
  return <Modal title={edit ? "Edit course" : "Add course"} onClose={onClose}><form onSubmit={submit} autoComplete="off" className="grid sm:grid-cols-2 gap-4">
    <Field label="Course name" required error={errors.name}><input className="input" required value={v.name} onChange={set("name")}/></Field>
    <Field label="Course code" required error={errors.code}><input className="input" required value={v.code} onChange={set("code")}/></Field>
    <Field label="Duration (weeks)" error={errors.duration_weeks}><input className="input" type="number" min="0" value={v.duration_weeks} onChange={set("duration_weeks")}/></Field>
    <Field label="Status"><select className="input" value={v.status} onChange={set("status")}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></Field>
    <Field label="Description" className="sm:col-span-2"><textarea className="input" rows={3} value={v.description} onChange={set("description")}/></Field>
    {errors.detail && <p className="text-sm text-red-600 sm:col-span-2">{errors.detail}</p>}
    <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{edit ? "Update" : "Create"}</button></div></form></Modal>;
}
export default function Courses() {
  const nav = useNavigate(); const toast = useToast(); const [rows, setRows] = useState(null); const [modal, setModal] = useState(null); const [del, setDel] = useState(null); const [delErr, setDelErr] = useState("");
  const load = useCallback(() => api.get("/courses/", { params: { page_size: 500 } }).then(r => setRows(r.data.results)), []);
  useEffect(() => { load(); }, []); const done = () => { setModal(null); load(); };
  const remove = async () => { try { await api.delete(`/courses/${del.id}/`); toast("Course deleted"); setDel(null); load(); } catch (e) { setDelErr(errText(e)); } };
  const columns = [{ key: "name", label: "Course", render: r => <span className="font-medium">{r.name}</span> }, { key: "code", label: "Code" }, { key: "duration_weeks", label: "Weeks" }, { key: "topic_count", label: "Topics" },
    { key: "status", label: "Status", render: r => <Badge tone={r.status === "ACTIVE" ? "green" : "slate"}>{r.status}</Badge> }];
  return <div><PageHeader title="Courses" subtitle="Courses and their syllabus" onAdd={() => setModal({ mode: "form" })} addLabel="Add course"/>
    <DataTable columns={columns} rows={rows} loading={!rows} empty="No courses yet. Click + to add one." onView={r => setModal({ mode: "view", row: r })} onEdit={r => setModal({ mode: "form", row: r })}
      onDelete={r => { setDelErr(""); setDel(r); }} extra={[{ icon: ListTree, label: "Syllabus", onClick: r => nav(`/courses/${r.id}/syllabus`) }]}/>
    {modal?.mode === "form" && <CourseForm row={modal.row} onClose={() => setModal(null)} onDone={done}/>}
    {modal?.mode === "view" && <Modal title={modal.row.name} onClose={() => setModal(null)}><div className="grid sm:grid-cols-2 gap-4"><Detail label="Code">{modal.row.code}</Detail><Detail label="Status">{modal.row.status}</Detail>
      <Detail label="Duration">{modal.row.duration_weeks} weeks</Detail><Detail label="Topics">{modal.row.topic_count}</Detail><div className="sm:col-span-2"><Detail label="Description">{modal.row.description}</Detail></div></div></Modal>}
    {del && <ConfirmDialog message={`Delete course "${del.name}" and its syllabus?`} error={delErr} onConfirm={remove} onCancel={() => setDel(null)}/>}</div>;
}
