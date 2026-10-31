import { useEffect, useState } from "react"; import api from "../api";
const ST = ["PRESENT", "ABSENT", "LATE", "LEAVE"]; const COL = { PRESENT: "bg-green-500", ABSENT: "bg-red-500", LATE: "bg-amber-500", LEAVE: "bg-sky-500" };
const today = () => new Date().toISOString().slice(0, 10);
const err = e => e.response?.data?.detail || "Failed";
export default function Attendance() {
  const [staff, setStaff] = useState([]); const [batches, setBatches] = useState([]); const [sf, setSf] = useState(""); const [batch, setBatch] = useState("");
  const [date, setDate] = useState(today()); const [sheet, setSheet] = useState(null); const [sum, setSum] = useState(null);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(today()); const [msg, setMsg] = useState("");
  useEffect(() => { api.get("/staff/", { params: { page_size: 200 } }).then(r => setStaff(r.data.results)); }, []);
  useEffect(() => { setBatch(""); api.get("/batches/", { params: { staff: sf, status: "ACTIVE", page_size: 200 } }).then(r => setBatches(r.data.results)); }, [sf]);
  const loadSheet = () => { if (!batch) return; setMsg(""); api.get("/attendance/sheet/", { params: { batch, date } }).then(r => setSheet(r.data)).catch(e => setMsg(err(e))); };
  const loadSum = () => { if (!batch) return; api.get("/attendance/summary/", { params: { batch, from, to } }).then(r => setSum(r.data)); };
  useEffect(() => { setSheet(null); setSum(null); loadSheet(); loadSum(); }, [batch, date]);
  const mark = (i, status) => setSheet({ ...sheet, rows: sheet.rows.map((r, j) => j === i ? { ...r, status } : r) });
  const all = status => setSheet({ ...sheet, rows: sheet.rows.map(r => ({ ...r, status })) });
  const save = async () => { const records = sheet.rows.filter(r => r.status).map(r => ({ student: r.student, status: r.status, note: r.note }));
    if (!records.length) return setMsg("Mark at least one student.");
    try { const { data } = await api.post("/attendance/sheet/", { batch: +batch, date, records }); setMsg(`Saved (${data.saved} changed).`); loadSheet(); loadSum(); } catch (e) { setMsg(err(e)); } };
  const exp = async () => { const r = await api.get("/attendance/export/", { params: { batch, from, to }, responseType: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(r.data); a.download = `attendance_batch_${batch}.csv`; a.click(); };
  const cur = batches.find(b => String(b.id) === String(batch));
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Attendance</h1>
    <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-2 items-end">
      <label className="text-xs">Staff<select className="border rounded p-2 block" value={sf} onChange={e => setSf(e.target.value)}><option value="">All staff</option>{staff.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select></label>
      <label className="text-xs">Batch<select className="border rounded p-2 block" value={batch} onChange={e => setBatch(e.target.value)}><option value="">Select batch…</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.staff_name || "no staff"})</option>)}</select></label>
      <label className="text-xs">Date<input type="date" max={today()} className="border rounded p-2 block" value={date} onChange={e => setDate(e.target.value)}/></label>
      {cur && <span className="text-sm text-slate-500">Course: {cur.course_name} · Staff: {cur.staff_name || "—"}</span>}</div>
    {!batch && <p className="text-slate-500">Pick a batch (optionally filter by staff) to view or correct attendance.</p>}
    {msg && <p className="text-sm text-brand">{msg}</p>}
    {sheet && <div className="bg-white p-4 rounded-xl shadow space-y-2"><div className="flex gap-2 items-center"><h2 className="font-semibold mr-auto">Sheet · {sheet.marked}/{sheet.total} marked</h2>
      {ST.slice(0, 1).map(s => <button key={s} onClick={() => all(s)} className="text-xs border rounded px-2 py-1">All present</button>)}<button onClick={save} className="bg-brand text-white rounded px-4 py-1">Save</button></div>
      {sheet.rows.length === 0 ? <p className="text-slate-500">No students were enrolled in this batch on this date.</p> :
      sheet.rows.map((r, i) => <div key={r.student} className="flex flex-wrap items-center gap-2 border-t py-1"><span className="w-24 text-sm text-slate-500">{r.student_code}</span><span className="w-48">{r.name}</span>
        {ST.map(s => <button key={s} onClick={() => mark(i, s)} className={`text-xs px-2 py-1 rounded ${r.status === s ? COL[s] + " text-white" : "border"}`}>{s}</button>)}</div>)}</div>}
    {sum && <div className="bg-white p-4 rounded-xl shadow space-y-2"><div className="flex flex-wrap gap-2 items-end"><h2 className="font-semibold mr-auto">Summary {sum.overall_percentage != null && `· ${sum.overall_percentage}% overall`}</h2>
      <input type="date" className="border rounded p-1" value={from} onChange={e => setFrom(e.target.value)}/><input type="date" className="border rounded p-1" value={to} onChange={e => setTo(e.target.value)}/>
      <button onClick={loadSum} className="border rounded px-3 py-1">Apply</button><button onClick={exp} className="bg-orange-500 text-white rounded px-3 py-1">Export CSV</button></div>
      {sum.rows.length === 0 ? <p className="text-slate-500">No attendance recorded in this range.</p> :
      <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>ID</th><th>Student</th><th>P</th><th>A</th><th>L</th><th>Leave</th><th>%</th></tr></thead><tbody>
        {sum.rows.map(r => <tr key={r.student} className="border-t"><td>{r.student_code}</td><td>{r.name}</td><td>{r.PRESENT}</td><td>{r.ABSENT}</td><td>{r.LATE}</td><td>{r.LEAVE}</td>
          <td><div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded"><div className="h-2 rounded bg-green-500" style={{ width: `${r.percentage || 0}%` }}/></div>{r.percentage}%</div></td></tr>)}</tbody></table>}</div>}</div>;
}
