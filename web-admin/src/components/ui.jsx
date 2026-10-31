// ===== Shared UI kit. Every page uses these, so look & behaviour is changed in ONE place. =====
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Eye, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight, Camera, CheckCircle2, AlertCircle } from "lucide-react";

export const errText = e => {
  const d = e?.response?.data; if (!d) return "Something went wrong.";
  if (typeof d === "string") return d; if (d.detail) return d.detail; if (d.errors) return d.errors.join(" | ");
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" | ");
};
/** Build FormData (needed for photo/PDF upload). Empty strings are sent except keys listed in skipEmpty. */
export function formData(obj, skipEmpty = []) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return; if (v === "" && skipEmpty.includes(k)) return;
    fd.append(k, typeof v === "boolean" ? String(v) : v);
  }); return fd;
}
const initials = n => (n || "?").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
export function Avatar({ src, name, size = 36 }) {
  const st = { width: size, height: size };
  return src ? <img src={src} alt={name} style={st} className="rounded-full object-cover shrink-0 ring-2 ring-white shadow"/>
    : <div style={{ ...st, fontSize: size / 2.6 }} className="rounded-full grad-brand text-white grid place-items-center font-semibold shrink-0">{initials(name)}</div>;
}
const TONES = { green: "bg-green-100 text-green-700", slate: "bg-slate-200 text-slate-600", blue: "bg-blue-100 text-blue-700", orange: "bg-orange-100 text-orange-700", red: "bg-red-100 text-red-700", violet: "bg-violet-100 text-violet-700" };
export const Badge = ({ tone = "slate", children }) => <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TONES[tone]}`}>{children}</span>;

export function PageHeader({ title, subtitle, onAdd, addLabel = "Add new" }) {
  return <div className="flex items-center gap-3 mb-5"><div className="mr-auto"><h1 className="text-2xl font-bold">{title}</h1>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div>
    {onAdd && <button onClick={onAdd} title={addLabel} aria-label={addLabel} className="fab"><Plus size={22}/></button>}</div>;
}
export function Field({ label, required, error, hint, children, className = "" }) {
  return <label className={`block ${className}`}><span className="label">{label}{required && <span className="text-red-500"> *</span>}</span>{children}
    {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}{error && <span className="block text-xs text-red-600 mt-1">{[].concat(error).join(" ")}</span>}</label>;
}
export function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => { const h = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const w = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" }[size];
  return <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-slate-900/50 backdrop-blur-sm overlay-enter" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal-enter card w-full ${w} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center px-5 py-4 border-b"><h2 className="font-semibold text-lg mr-auto">{title}</h2>
        <button className="icon-btn text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      <div className="p-5 overflow-y-auto">{children}</div></div></div>;
}
export function ConfirmDialog({ title = "Please confirm", message, confirmLabel = "Delete", error, busy, onConfirm, onCancel }) {
  return <Modal title={title} size="sm" onClose={onCancel}><p className="text-sm text-slate-600">{message}</p>
    {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    <div className="flex justify-end gap-2 mt-5"><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-danger" disabled={busy} onClick={onConfirm}>{busy ? "Working…" : confirmLabel}</button></div></Modal>;
}
export function PhotoPicker({ url, name, onChange, label = "Profile photo" }) {
  const [preview, setPreview] = useState(null); const [removed, setRemoved] = useState(false);
  const pick = e => { const f = e.target.files[0]; if (!f) return; setPreview(URL.createObjectURL(f)); setRemoved(false); onChange({ file: f, remove: false }); };
  const remove = () => { setPreview(null); setRemoved(true); onChange({ file: null, remove: true }); };
  const shown = preview || (removed ? null : url);
  return <div className="flex items-center gap-4"><Avatar src={shown} name={name || "?"} size={72}/><div><span className="label">{label}</span>
    <div className="flex gap-2"><label className="btn btn-ghost cursor-pointer"><Camera size={16}/>Choose<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick}/></label>
      {shown && <button type="button" className="btn btn-ghost text-red-600" onClick={remove}>Remove</button>}</div>
    <p className="text-xs text-slate-400 mt-1">PNG/JPG/WEBP, max 2 MB.</p></div></div>;
}
// ---- toast ----
const ToastCtx = createContext(() => {}); export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, type = "ok") => { const id = Math.random(); setItems(x => [...x, { id, text, type }]); setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 3500); }, []);
  return <ToastCtx.Provider value={push}>{children}<div className="fixed top-4 right-4 z-50 space-y-2">
    {items.map(i => <div key={i.id} className={`toast-enter card flex items-center gap-2 px-4 py-3 text-sm border-l-4 ${i.type === "error" ? "border-red-500" : "border-green-500"}`}>
      {i.type === "error" ? <AlertCircle size={18} className="text-red-500"/> : <CheckCircle2 size={18} className="text-green-500"/>}{i.text}</div>)}</div></ToastCtx.Provider>;
}
// ---- common action buttons: view / edit / delete (+ extra) ----
const TONE_BTN = { view: "text-sky-600 hover:bg-sky-50", edit: "text-amber-600 hover:bg-amber-50", delete: "text-red-600 hover:bg-red-50", extra: "text-violet-600 hover:bg-violet-50" };
function ActBtn({ icon: I, label, tone, onClick }) { return <button title={label} aria-label={label} onClick={onClick} className={`icon-btn ${TONE_BTN[tone]}`}><I size={17}/></button>; }
export function RowActions({ row, onView, onEdit, onDelete, extra = [] }) {
  return <div className="flex justify-center gap-1">
    {onView && <ActBtn icon={Eye} label="View" tone="view" onClick={() => onView(row)}/>}
    {onEdit && <ActBtn icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(row)}/>}
    {extra.map(x => <ActBtn key={x.label} icon={x.icon} label={x.label} tone="extra" onClick={() => x.onClick(row)}/>)}
    {onDelete && <ActBtn icon={Trash2} label="Delete" tone="delete" onClick={() => onDelete(row)}/>}</div>;
}
/** One table for every page. columns: [{key,label,render?}] */
export function DataTable({ columns, rows, loading, empty = "No records found.", onView, onEdit, onDelete, extra, isActionable = () => true, searchKeys, filters, pageSize = 8 }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0);
  const list = useMemo(() => { const keys = searchKeys || columns.map(c => c.key); const s = q.toLowerCase();
    return !s ? (rows || []) : (rows || []).filter(r => keys.some(k => String(r[k] ?? "").toLowerCase().includes(s))); }, [rows, q]);
  useEffect(() => setPage(0), [q, rows]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize)); const view = list.slice(page * pageSize, page * pageSize + pageSize);
  const hasActions = onView || onEdit || onDelete || extra;
  return <div className="card overflow-hidden">
    <div className="flex flex-wrap items-center gap-2 p-4 border-b"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/>
      <input className="input pl-9 w-64" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} autoComplete="off"/></div>{filters}</div>
    {loading ? <p className="p-8 text-center text-slate-500">Loading…</p> : list.length === 0 ? <p className="p-8 text-center text-slate-500">{empty}</p> :
    <div className="overflow-x-auto"><table className="w-full"><thead><tr>{columns.map(c => <th key={c.key} className="th">{c.label}</th>)}{hasActions && <th className="th">Actions</th>}</tr></thead>
      <tbody>{view.map((r, i) => <tr key={r.id ?? i} className="border-t tr-hover row-enter" style={{ "--i": i }}>
        {columns.map(c => <td key={c.key} className="td">{c.render ? c.render(r) : (r[c.key] ?? "—")}</td>)}
        {hasActions && <td className="td">{isActionable(r) ? <RowActions row={r} onView={onView} onEdit={onEdit} onDelete={onDelete} extra={typeof extra === "function" ? extra(r) : extra}/> : "—"}</td>}</tr>)}</tbody></table></div>}
    {list.length > pageSize && <div className="flex items-center justify-between p-3 border-t text-sm text-slate-500"><span>{page * pageSize + 1}–{Math.min(list.length, (page + 1) * pageSize)} of {list.length}</span>
      <div className="flex gap-1"><button className="icon-btn hover:bg-slate-100" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18}/></button>
        <button className="icon-btn hover:bg-slate-100" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight size={18}/></button></div></div>}</div>;
}
export const Detail = ({ label, children }) => <div><div className="label">{label}</div><div className="text-sm">{children || "—"}</div></div>;
