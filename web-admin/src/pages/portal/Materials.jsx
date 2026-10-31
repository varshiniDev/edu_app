import { useEffect, useState } from "react"; import { ChevronRight, ChevronDown, FileText } from "lucide-react"; import api from "../../api";
import { PageHeader } from "../../components/ui.jsx"; import { useMyBatches, BatchPicker } from "./shared.jsx";
function Node({ n }) {
  const [open, setOpen] = useState(true);
  return <div className="ml-5 border-l border-slate-200 pl-3"><div className="py-1.5"><div className="flex items-center gap-2">
    <button onClick={() => setOpen(!open)} className="w-5 text-slate-400">{n.children.length ? (open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : null}</button>
    <span className="text-slate-400 text-sm w-10">{n.number}</span><span className="font-medium">{n.title}</span></div>
    {n.materials.length > 0 && <div className="ml-16 mt-1 flex flex-wrap gap-2">{n.materials.map(m => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-700 rounded-lg px-2.5 py-1 hover:bg-red-100 transition"><FileText size={14}/>{m.title}</a>)}</div>}</div>
    {open && n.children.map(c => <Node key={c.id} n={c}/>)}</div>;
}
export default function PortalMaterials() {
  const batches = useMyBatches(); const [batch, setBatch] = useState(""); const [tree, setTree] = useState(null);
  useEffect(() => { setTree(null); if (batch) api.get("/portal/materials/", { params: { batch } }).then(r => setTree(r.data)); }, [batch]);
  return <div><PageHeader title="Study Material" subtitle="Syllabus topics with PDF notes"/><div className="card p-4 mb-4"><BatchPicker batches={batches} value={batch} onChange={setBatch}/></div>
    <div className="card p-4">{!tree ? <p className="text-slate-500 p-4">Loading…</p> : tree.length === 0 ? <p className="text-slate-500 p-4">The syllabus has not been published yet.</p> : tree.map(n => <Node key={n.id} n={n}/>)}</div></div>;
}
