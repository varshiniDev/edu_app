import { useEffect, useState } from "react"; import api from "../../api"; import { useMe } from "../../me.jsx";
import { PageHeader, DataTable, Badge, useToast, errText } from "../../components/ui.jsx"; import { useMyBatches, BatchPicker } from "./shared.jsx";
const ST = ["PRESENT", "ABSENT", "LATE", "LEAVE"]; const COL = { PRESENT: "bg-green-500", ABSENT: "bg-red-500", LATE: "bg-amber-500", LEAVE: "bg-sky-500" }; const TONE = { PRESENT: "green", ABSENT: "red", LATE: "orange", LEAVE: "blue" };
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); const today = () => iso(new Date()); const back = n => iso(new Date(Date.now() - n * 864e5));
function StaffView() {
  const toast = useToast(); const batches = useMyBatches(true); const [batch, setBatch] = useState(""); const [date, setDate] = useState(today()); const [sheet, setSheet] = useState(null);
  const load = () => { if (batch) api.get("/portal/attendance/sheet/", { params: { batch, date } }).then(r => setSheet(r.data)).catch(e => toast(errText(e), "error")); };
  useEffect(() => { setSheet(null); load(); }, [batch, date]);
  const mark = (i, s) => setSheet({ ...sheet, rows: sheet.rows.map((r, j) => j === i ? { ...r, status: s } : r) });
  const save = async () => { const records = sheet.rows.filter(r => r.status).map(r => ({ student: r.student, status: r.status, note: r.note }));
    if (!records.length) return toast("Mark at least one student", "error");
    try { const { data } = await api.post("/portal/attendance/sheet/", { batch: +batch, date, records }); toast(`Saved (${data.saved} changed)`); load(); } catch (e) { toast(errText(e), "error"); } };
  return <div><PageHeader title="Attendance" subtitle="Mark attendance for your batches (last 7 days editable)"/>
    <div className="card p-4 mb-4 flex flex-wrap gap-4 items-end"><BatchPicker batches={batches} value={batch} onChange={setBatch}/>
      <label className="block"><span className="label">Date</span><input type="date" className="input" min={back(7)} max={today()} value={date} onChange={e => setDate(e.target.value)}/></label></div>
    {batches && batches.length === 0 && <p className="text-slate-500">No active batches assigned to you.</p>}
    {sheet && <div className="card p-4 space-y-1"><div className="flex items-center gap-2 mb-2"><h2 className="font-semibold mr-auto">{sheet.marked}/{sheet.total} marked</h2>
      <button className="btn btn-ghost" onClick={() => setSheet({ ...sheet, rows: sheet.rows.map(r => ({ ...r, status: "PRESENT" })) })}>All present</button><button className="btn btn-primary" onClick={save}>Save</button></div>
      {sheet.rows.length === 0 ? <p className="text-slate-500">No students enrolled on this date.</p> : sheet.rows.map((r, i) => <div key={r.student} className="flex flex-wrap items-center gap-2 border-t py-2 row-enter" style={{ "--i": i }}>
        <span className="w-24 text-sm text-slate-400">{r.student_code}</span><span className="w-52 font-medium">{r.name}</span>
        {ST.map(s => <button key={s} onClick={() => mark(i, s)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${r.status === s ? COL[s] + " text-white" : "border hover:bg-slate-50"}`}>{s}</button>)}</div>)}</div>}</div>;
}
function StudentView() {
  const batches = useMyBatches(); const [batch, setBatch] = useState(""); const [d, setD] = useState(null);
  useEffect(() => { setD(null); if (batch) api.get("/portal/my-attendance/", { params: { batch } }).then(r => setD(r.data)); }, [batch]);
  const cards = d && [["Present", d.summary.PRESENT, "from-green-400 to-emerald-600"], ["Absent", d.summary.ABSENT, "from-rose-400 to-red-600"], ["Late", d.summary.LATE, "from-amber-400 to-orange-500"], ["Leave", d.summary.LEAVE, "from-sky-400 to-blue-600"], ["Attendance", d.summary.percentage == null ? "—" : d.summary.percentage + "%", "from-violet-500 to-fuchsia-600"]];
  return <div><PageHeader title="My Attendance" subtitle="Your attendance record per batch"/><div className="card p-4 mb-4"><BatchPicker batches={batches} value={batch} onChange={setBatch}/></div>
    {d && <><div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">{cards.map(([l, v, g], i) => <div key={l} style={{ "--i": i }} className={`row-enter bg-gradient-to-br ${g} text-white rounded-2xl p-4`}><div className="text-2xl font-bold">{v}</div><div className="text-xs opacity-90">{l}</div></div>)}</div>
      <DataTable columns={[{ key: "date", label: "Date" }, { key: "status", label: "Status", render: r => <Badge tone={TONE[r.status]}>{r.status}</Badge> }]} rows={d.records} empty="No attendance marked yet." pageSize={10} searchKeys={["date", "status"]}/></>}</div>;
}
export default function PortalAttendance() { const { me } = useMe(); return me.role === "STAFF" ? <StaffView/> : <StudentView/>; }
