import { useEffect, useState } from "react"; import api from "../../api"; import { Field } from "../../components/ui.jsx";
export const hhmm = t => (t || "").slice(0, 5);
export const clock = iso => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
/** Batches visible to the logged-in staff/student. */
export function useMyBatches(activeOnly = false) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get("/portal/batches/").then(r => setRows(activeOnly ? r.data.filter(b => b.status === "ACTIVE") : r.data)); }, []);
  return rows;
}
export function BatchPicker({ batches, value, onChange, label = "Batch" }) {
  useEffect(() => { if (batches?.length && !value) onChange(String(batches[0].id)); }, [batches]);
  return <Field label={label} className="w-72"><select className="input" value={value} onChange={e => onChange(e.target.value)}>
    {(batches || []).map(b => <option key={b.id} value={b.id}>{b.name} · {b.course}</option>)}</select></Field>;
}
