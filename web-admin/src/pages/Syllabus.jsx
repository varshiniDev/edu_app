import { useEffect, useState, useCallback } from "react"; import { useParams } from "react-router-dom";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Paperclip, FileText, X } from "lucide-react"; import api from "../api";
import { PageHeader, Modal, ConfirmDialog, Field, useToast, errText, formData } from "../components/ui.jsx";
function TopicForm({ courseId, parent, topic, onClose, onDone }) {
  const toast = useToast(); const [v, setV] = useState({ title: topic?.title ?? "", description: topic?.description ?? "", estimated_minutes: topic?.estimated_minutes ?? 0 }); const [err, setErr] = useState("");
  const submit = async e => { e.preventDefault(); setErr(""); const b = { ...v, estimated_minutes: +v.estimated_minutes || 0 };
    try { topic ? await api.patch(`/topics/${topic.id}/`, b) : await api.post(`/courses/${courseId}/topics/`, { ...b, parent: parent?.id ?? null }); toast("Saved"); onDone(); } catch (x) { setErr(errText(x)); } };
  return <Modal title={topic ? "Edit topic" : parent ? `Add subtopic under "${parent.title}"` : "Add main topic"} size="sm" onClose={onClose}><form onSubmit={submit} autoComplete="off" className="space-y-4">
    <Field label="Topic title" required><input className="input" required value={v.title} onChange={e => setV({ ...v, title: e.target.value })}/></Field>
    <Field label="Description"><textarea className="input" rows={3} value={v.description} onChange={e => setV({ ...v, description: e.target.value })}/></Field>
    <Field label="Estimated duration (minutes)"><input className="input" type="number" min="0" value={v.estimated_minutes} onChange={e => setV({ ...v, estimated_minutes: e.target.value })}/></Field>
    {err && <p className="text-sm text-red-600">{err}</p>}<div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary">Save</button></div></form></Modal>;
}
function Materials({ topic, onClose, onChange }) {
  const toast = useToast(); const [list, setList] = useState(topic.materials); const [title, setTitle] = useState(""); const [file, setFile] = useState(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const reload = () => api.get(`/topics/${topic.id}/materials/`).then(r => { setList(r.data); onChange(); });
  const upload = async e => { e.preventDefault(); setErr(""); setBusy(true);
    try { await api.post(`/topics/${topic.id}/materials/`, formData({ title, file })); setTitle(""); setFile(null); e.target.reset(); toast("PDF uploaded"); reload(); } catch (x) { setErr(errText(x)); } setBusy(false); };
  const remove = async m => { await api.delete(`/materials/${m.id}/`); toast("Removed"); reload(); };
  return <Modal title={`Study material · ${topic.title}`} onClose={onClose}>
    <p className="text-xs text-slate-500 mb-3">PDFs uploaded here will be visible to staff and students of batches using this course.</p>
    <div className="space-y-2 mb-5">{list.length === 0 && <p className="text-sm text-slate-500">No material yet.</p>}
      {list.map(m => <div key={m.id} className="flex items-center gap-3 border rounded-xl p-2 px-3"><FileText size={18} className="text-red-500"/><a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline mr-auto">{m.title}</a>
        <button className="icon-btn text-red-600 hover:bg-red-50" title="Remove" onClick={() => remove(m)}><Trash2 size={16}/></button></div>)}</div>
    <form onSubmit={upload} className="grid sm:grid-cols-2 gap-3 items-end"><Field label="Title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 notes"/></Field>
      <Field label="PDF file (max 20 MB)" required><input className="input" type="file" accept="application/pdf" required onChange={e => setFile(e.target.files[0])}/></Field>
      {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}<div className="sm:col-span-2 flex justify-end"><button className="btn btn-primary" disabled={busy}>{busy ? "Uploading…" : "Upload PDF"}</button></div></form></Modal>;
}
function Node({ n, siblings, idx, act }) {
  const [open, setOpen] = useState(true);
  return <div className="ml-5 border-l border-slate-200 pl-3">
    <div className="flex items-center gap-2 py-1.5 group rounded-lg hover:bg-brand/5 px-1">
      <button onClick={() => setOpen(!open)} className="w-5 text-slate-400">{n.children.length ? (open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : null}</button>
      <span className="text-slate-400 text-sm w-10">{n.number}</span><span className="font-medium">{n.title}</span>{n.estimated_minutes > 0 && <span className="text-xs text-slate-400">{n.estimated_minutes} min</span>}
      <span className="flex gap-0.5 ml-auto items-center">
        <button className="icon-btn text-violet-600 hover:bg-violet-50 relative" title="Study material (PDF)" onClick={() => act.materials(n)}><Paperclip size={16}/>{n.materials.length > 0 && <span className="absolute -top-1 -right-1 text-[10px] bg-violet-600 text-white rounded-full w-4 h-4 grid place-items-center">{n.materials.length}</span>}</button>
        <button className="icon-btn text-sky-600 hover:bg-sky-50" title="Add subtopic" onClick={() => act.add(n)}><Plus size={16}/></button>
        <button className="icon-btn text-amber-600 hover:bg-amber-50" title="Edit" onClick={() => act.edit(n)}><Pencil size={16}/></button>
        <button className="icon-btn hover:bg-slate-100" title="Move up" disabled={idx === 0} onClick={() => act.swap(n, siblings[idx - 1])}><ArrowUp size={16}/></button>
        <button className="icon-btn hover:bg-slate-100" title="Move down" disabled={idx === siblings.length - 1} onClick={() => act.swap(n, siblings[idx + 1])}><ArrowDown size={16}/></button>
        <button className="icon-btn text-red-600 hover:bg-red-50" title="Delete" onClick={() => act.del(n)}><Trash2 size={16}/></button></span></div>
    {open && n.children.map((c, i) => <Node key={c.id} n={c} siblings={n.children} idx={i} act={act}/>)}</div>;
}
export default function Syllabus() {
  const { id } = useParams(); const toast = useToast(); const [tree, setTree] = useState(null); const [modal, setModal] = useState(null); const [del, setDel] = useState(null);
  const load = useCallback(() => api.get(`/courses/${id}/topics/`).then(r => setTree(r.data)), [id]); useEffect(() => { load(); }, [id]);
  const find = (items, tid) => { for (const n of items) { if (n.id === tid) return n; const f = find(n.children, tid); if (f) return f; } };
  const act = { add: n => setModal({ t: "form", parent: n }), edit: n => setModal({ t: "form", topic: n }), materials: n => setModal({ t: "mat", id: n.id }), del: setDel,
    swap: async (a, b) => { await api.patch(`/topics/${a.id}/`, { order: b.order }); await api.patch(`/topics/${b.id}/`, { order: a.order }); load(); } };
  const remove = async () => { await api.delete(`/topics/${del.id}/`); toast("Topic deleted"); setDel(null); load(); };
  if (!tree) return <p>Loading…</p>;
  return <div><PageHeader title="Syllabus" subtitle="Unlimited nesting · attach PDF material to any topic" onAdd={() => setModal({ t: "form" })} addLabel="Add main topic"/>
    <div className="card p-4">{tree.length === 0 ? <p className="text-slate-500 p-4">No topics yet. Click + to add the first one.</p> : tree.map((n, i) => <Node key={n.id} n={n} siblings={tree} idx={i} act={act}/>)}</div>
    {modal?.t === "form" && <TopicForm courseId={id} parent={modal.parent} topic={modal.topic} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }}/>}
    {modal?.t === "mat" && find(tree, modal.id) && <Materials key={modal.id} topic={find(tree, modal.id)} onClose={() => setModal(null)} onChange={load}/>}
    {del && <ConfirmDialog message={`Delete "${del.title}" and all its subtopics and PDFs?`} onConfirm={remove} onCancel={() => setDel(null)}/>}</div>;
}
