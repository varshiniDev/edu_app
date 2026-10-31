import { useEffect, useState, useCallback } from "react"; import { UserPlus, Video, ExternalLink } from "lucide-react"; import api from "../api";
import AssignStudents from "../components/AssignStudents.jsx";
import { PageHeader, DataTable, Modal, ConfirmDialog, Field, Badge, Detail, useToast, errText } from "../components/ui.jsx";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]; const STATUS_TONE = { ACTIVE: "green", COMPLETED: "blue", ARCHIVED: "slate" };
function BatchForm({ row, courses, staff, onClose, onDone }) {
  const toast = useToast(); const edit = !!row;
  const [v, setV] = useState({ name: row?.name ?? "", course: row?.course ?? "", staff: row?.staff ?? "", start_date: row?.start_date ?? "", end_date: row?.end_date ?? "", capacity: row?.capacity ?? 30,
    class_days: row?.class_days ?? "", start_time: row?.start_time?.slice(0, 5) ?? "", end_time: row?.end_time?.slice(0, 5) ?? "", meet_link: row?.meet_link ?? "", status: row?.status ?? "ACTIVE" });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const set = k => e => setV({ ...v, [k]: e.target.value }); const days = v.class_days ? v.class_days.split(",") : [];
  const submit = async e => { e.preventDefault(); setBusy(true); setErrors({});
    const b = { ...v, course: +v.course, staff: v.staff ? +v.staff : null, end_date: v.end_date || null, start_time: v.start_time || null, end_time: v.end_time || null, capacity: +v.capacity };
    try { edit ? await api.patch(`/batches/${row.id}/`, b) : await api.post("/batches/", b); toast(edit ? "Batch updated" : "Batch created"); onDone(); } catch (x) { setErrors(x.response?.data || { detail: errText(x) }); } setBusy(false); };
  return <Modal title={edit ? "Edit batch" : "Add batch"} size="lg" onClose={onClose}><form onSubmit={submit} autoComplete="off" className="grid sm:grid-cols-3 gap-4">
    <Field label="Batch name" required error={errors.name}><input className="input" required value={v.name} onChange={set("name")}/></Field>
    <Field label="Course" required error={errors.course}><select className="input" required disabled={edit} value={v.course} onChange={set("course")}><option value="">Select course…</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Assigned staff" error={errors.staff}><select className="input" value={v.staff || ""} onChange={set("staff")}><option value="">Not assigned</option>{staff.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select></Field>
    <Field label="Start date" required error={errors.start_date}><input className="input" type="date" required value={v.start_date} onChange={set("start_date")}/></Field>
    <Field label="End date" error={errors.end_date}><input className="input" type="date" value={v.end_date || ""} onChange={set("end_date")}/></Field>
    <Field label="Capacity (seats)" error={errors.capacity}><input className="input" type="number" min="1" value={v.capacity} onChange={set("capacity")}/></Field>
    <Field label="Class start time" error={errors.start_time}><input className="input" type="time" value={v.start_time} onChange={set("start_time")}/></Field>
    <Field label="Class end time" error={errors.end_time}><input className="input" type="time" value={v.end_time} onChange={set("end_time")}/></Field>
    <Field label="Status"><select className="input" value={v.status} onChange={set("status")}><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></Field>
    <div className="sm:col-span-3"><span className="label">Class days</span><div className="flex gap-1.5 flex-wrap">{DAYS.map(d => <button type="button" key={d} onClick={() => setV({ ...v, class_days: DAYS.filter(x => days.includes(x) !== (x === d)).join(",") })}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${days.includes(d) ? "grad-brand text-white border-transparent" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{d}</button>)}</div></div>
    <Field label="Google Meet link (online classes)" className="sm:col-span-3" error={errors.meet_link} hint="Shown to the staff and ONLINE students only during class time. Paste a new link any time to replace it.">
      <input className="input" type="url" placeholder="https://meet.google.com/abc-defg-hij" value={v.meet_link} onChange={set("meet_link")}/></Field>
    {errors.detail && <p className="text-sm text-red-600 sm:col-span-3">{errors.detail}</p>}
    <div className="sm:col-span-3 flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : edit ? "Update" : "Create"}</button></div></form></Modal>;
}
function Recordings({ batch, onClose }) {
  const toast = useToast(); const [rows, setRows] = useState(null); const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [v, setV] = useState({ url: "", title: "" }); const [err, setErr] = useState("");
  const load = useCallback(() => api.get(`/batches/${batch.id}/recordings/`).then(r => setRows(r.data)), [batch.id]); useEffect(() => { load(); }, []);
  const open = r => { setV({ url: r.url, title: r.title }); setErr(""); setEdit(r); };
  const save = async e => { e.preventDefault(); try { await api.post(`/batches/${batch.id}/recordings/`, { date: edit.date, ...v }); toast("Recording saved"); setEdit(null); load(); } catch (x) { setErr(errText(x)); } };
  const remove = async () => { await api.delete(`/batches/${batch.id}/recordings/`, { params: { date: del.date } }); toast("Recording removed"); setDel(null); load(); };
  const columns = [{ key: "date", label: "Date" }, { key: "weekday", label: "Day" }, { key: "title", label: "Title" },
    { key: "url", label: "Recording", render: r => r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-brand inline-flex items-center gap-1 hover:underline"><Video size={14}/>Open<ExternalLink size={12}/></a> : <Badge tone="orange">Not added</Badge> }];
  return <Modal title={`Daily recordings · ${batch.name}`} size="lg" onClose={onClose}>
    <p className="text-xs text-slate-500 mb-3">One row per class day from the batch start date ({batch.start_date}). Paste the Google Drive/Meet recording link for each day. Staff and students of this batch can watch these.</p>
    <DataTable columns={columns} rows={rows} loading={!rows} pageSize={7} searchKeys={["date", "weekday", "title"]} onEdit={open} onDelete={r => r.url && setDel(r)} empty="No class days yet."/>
    {edit && <Modal title={`Recording · ${edit.date}`} size="sm" onClose={() => setEdit(null)}><form onSubmit={save} className="space-y-4">
      <Field label="Recording link" required><input className="input" type="url" required placeholder="https://drive.google.com/…" value={v.url} onChange={e => setV({ ...v, url: e.target.value })}/></Field>
      <Field label="Title (optional)"><input className="input" value={v.title} onChange={e => setV({ ...v, title: e.target.value })}/></Field>
      {err && <p className="text-sm text-red-600">{err}</p>}<div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary">Save</button></div></form></Modal>}
    {del && <ConfirmDialog message={`Remove the recording for ${del.date}?`} onConfirm={remove} onCancel={() => setDel(null)}/>}</Modal>;
}
export default function Batches() {
  const toast = useToast(); const [rows, setRows] = useState(null); const [courses, setCourses] = useState([]); const [staff, setStaff] = useState([]); const [fs, setFs] = useState("");
  const [modal, setModal] = useState(null); const [del, setDel] = useState(null); const [delErr, setDelErr] = useState("");
  const load = useCallback(() => api.get("/batches/", { params: { staff: fs, page_size: 500 } }).then(r => setRows(r.data.results)), [fs]); useEffect(() => { setRows(null); load(); }, [fs]);
  useEffect(() => { api.get("/courses/", { params: { page_size: 500 } }).then(r => setCourses(r.data.results.filter(c => c.status === "ACTIVE"))); api.get("/staff/", { params: { is_active: "true", page_size: 500 } }).then(r => setStaff(r.data.results)); }, []);
  const done = () => { setModal(null); load(); };
  const remove = async () => { try { await api.delete(`/batches/${del.id}/`); toast("Batch deleted"); setDel(null); load(); } catch (e) { setDelErr(errText(e)); } };
  const cur = modal?.row && rows?.find(b => b.id === modal.row.id) || modal?.row;
  const columns = [{ key: "name", label: "Batch", render: r => <span className="font-medium">{r.name}</span> }, { key: "course_name", label: "Course" },
    { key: "staff_name", label: "Staff", render: r => r.staff_name || <Badge tone="orange">Unassigned</Badge> },
    { key: "class_days", label: "Schedule", render: r => <div>{r.class_days || "—"}<div className="text-xs text-slate-400">{r.start_time?.slice(0, 5)}{r.end_time && ` – ${r.end_time.slice(0, 5)}`}</div></div> },
    { key: "enrolled_count", label: "Students", render: r => <div>{r.enrolled_count}/{r.capacity}<div className="text-xs text-slate-400">{r.online_count} online · {r.offline_count} offline</div></div> },
    { key: "meet_link", label: "Meet link", render: r => r.meet_link ? <Badge tone="green">Set</Badge> : <Badge tone="slate">None</Badge> },
    { key: "status", label: "Status", render: r => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> }];
  return <div><PageHeader title="Batches" subtitle="Schedules, staff allocation, meeting links and recordings" onAdd={() => setModal({ t: "form" })} addLabel="Add batch"/>
    <DataTable columns={columns} rows={rows} loading={!rows} searchKeys={["name", "course_name", "staff_name"]} empty="No batches yet. Click + to create one."
      filters={<select className="input w-44" value={fs} onChange={e => setFs(e.target.value)}><option value="">All staff</option>{staff.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select>}
      onView={r => setModal({ t: "view", row: r })} onEdit={r => setModal({ t: "form", row: r })} onDelete={r => { setDelErr(""); setDel(r); }}
      extra={[{ icon: UserPlus, label: "Assign students", onClick: r => setModal({ t: "assign", row: r }) }, { icon: Video, label: "Daily recordings", onClick: r => setModal({ t: "rec", row: r }) }]}/>
    {modal?.t === "form" && <BatchForm row={modal.row} courses={courses} staff={staff} onClose={() => setModal(null)} onDone={done}/>}
    {modal?.t === "assign" && <AssignStudents batch={cur} onClose={() => setModal(null)} onDone={done}/>}
    {modal?.t === "rec" && <Recordings batch={cur} onClose={() => setModal(null)}/>}
    {modal?.t === "view" && <Modal title={cur.name} onClose={() => setModal(null)}><div className="grid sm:grid-cols-2 gap-4">
      <Detail label="Course">{cur.course_name}</Detail><Detail label="Staff">{cur.staff_name}</Detail><Detail label="Dates">{cur.start_date} → {cur.end_date || "open"}</Detail><Detail label="Schedule">{cur.class_days} {cur.start_time?.slice(0, 5)}–{cur.end_time?.slice(0, 5)}</Detail>
      <Detail label="Students">{cur.enrolled_count}/{cur.capacity} ({cur.online_count} online, {cur.offline_count} offline)</Detail><Detail label="Status">{cur.status}</Detail>
      <div className="sm:col-span-2"><Detail label="Google Meet link">{cur.meet_link ? <a className="text-brand hover:underline inline-flex items-center gap-1" href={cur.meet_link} target="_blank" rel="noreferrer">{cur.meet_link}<ExternalLink size={13}/></a> : "Not set"}</Detail></div></div>
      <div className="flex justify-end mt-5"><button className="btn btn-primary" onClick={() => setModal({ t: "form", row: cur })}>Edit / replace link</button></div></Modal>}
    {del && <ConfirmDialog message={`Delete batch "${del.name}"?`} error={delErr} onConfirm={remove} onCancel={() => setDel(null)}/>}</div>;
}
