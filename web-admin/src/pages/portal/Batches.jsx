import { useState } from "react"; import api from "../../api"; import { useMe } from "../../me.jsx";
import { PageHeader, DataTable, Modal, Badge, Detail, Avatar } from "../../components/ui.jsx"; import { useMyBatches, hhmm } from "./shared.jsx";
export default function PortalBatches() {
  const { me } = useMe(); const rows = useMyBatches(); const staff = me.role === "STAFF"; const [sel, setSel] = useState(null); const [students, setStudents] = useState(null);
  const open = b => { setSel(b); setStudents(null); if (staff) api.get("/portal/students/", { params: { batch: b.id } }).then(r => setStudents(r.data)); };
  const columns = [{ key: "name", label: "Batch", render: r => <span className="font-medium">{r.name}</span> }, { key: "course", label: "Course" },
    staff ? { key: "students", label: "Students" } : { key: "staff", label: "Staff" },
    { key: "class_days", label: "Schedule", render: r => <div>{r.class_days || "—"}<div className="text-xs text-slate-400">{hhmm(r.start_time)}–{hhmm(r.end_time)}</div></div> },
    ...(staff ? [] : [{ key: "mode", label: "Mode", render: r => <Badge tone={r.mode === "ONLINE" ? "blue" : "orange"}>{r.mode}</Badge> }]),
    { key: "status", label: "Status", render: r => <Badge tone={r.status === "ACTIVE" ? "green" : "slate"}>{r.status}</Badge> }];
  return <div><PageHeader title="My Batches" subtitle={staff ? "Batches assigned to you" : "Batches you are enrolled in"}/>
    <DataTable columns={columns} rows={rows} loading={!rows} empty="No batches yet." onView={open} searchKeys={["name", "course"]}/>
    {sel && <Modal title={sel.name} onClose={() => setSel(null)}><div className="grid sm:grid-cols-2 gap-4"><Detail label="Course">{sel.course}</Detail><Detail label="Staff">{sel.staff}</Detail>
      <Detail label="Dates">{sel.start_date} → {sel.end_date || "open"}</Detail><Detail label="Schedule">{sel.class_days} {hhmm(sel.start_time)}–{hhmm(sel.end_time)}</Detail></div>
      {staff && <div className="mt-5"><div className="label">Students ({students?.length ?? "…"})</div><div className="border rounded-xl divide-y max-h-64 overflow-y-auto">
        {(students || []).map(s => <div key={s.student} className="flex items-center gap-3 p-2"><Avatar src={s.photo} name={s.name} size={30}/><span className="text-sm mr-auto">{s.name}</span><span className="text-xs text-slate-400">{s.code}</span><Badge tone={s.mode === "ONLINE" ? "blue" : "orange"}>{s.mode}</Badge></div>)}</div></div>}</Modal>}</div>;
}
