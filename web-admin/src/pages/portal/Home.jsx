import { useEffect, useState } from "react"; import { Video, Clock3, MapPin, CalendarDays } from "lucide-react"; import api from "../../api"; import { useMe } from "../../me.jsx";
import { PageHeader, DataTable, Badge } from "../../components/ui.jsx"; import { clock, hhmm } from "./shared.jsx";
const STATE = { live: ["green", "Live now"], starting: ["blue", "Starting soon"], upcoming: ["orange", "Upcoming"], ended: ["slate", "Ended"] };
export default function PortalHome() {
  const { me } = useMe(); const [live, setLive] = useState(null); const [sched, setSched] = useState(null);
  const load = () => { api.get("/portal/live-classes/").then(r => setLive(r.data)); api.get("/portal/schedule/").then(r => setSched(r.data)); };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);   // link appears/disappears by itself
  const cols = [{ key: "date", label: "Date" }, { key: "weekday", label: "Day" }, { key: "name", label: "Batch" }, { key: "course", label: "Course" },
    { key: "start_time", label: "Time", render: r => `${hhmm(r.start_time)} – ${hhmm(r.end_time)}` }, ...(me.role === "STUDENT" ? [{ key: "mode", label: "Mode", render: r => <Badge tone={r.mode === "ONLINE" ? "blue" : "orange"}>{r.mode}</Badge> }] : [])];
  return <div className="space-y-6"><PageHeader title={`Welcome, ${me.name}`} subtitle="Your classes for today"/>
    {!live ? <p>Loading…</p> : live.length === 0 ? <div className="card p-8 text-center text-slate-500"><CalendarDays className="mx-auto mb-2" size={30}/>No classes scheduled today.</div> :
    <div className="grid gap-4 md:grid-cols-2">{live.map((c, i) => <div key={c.batch} style={{ "--i": i }} className="card p-5 row-enter space-y-3">
      <div className="flex items-start gap-2"><div className="mr-auto"><h3 className="font-semibold text-lg">{c.name}</h3><p className="text-sm text-slate-500">{c.course}</p></div><Badge tone={STATE[c.state][0]}>{STATE[c.state][1]}</Badge></div>
      <div className="flex items-center gap-2 text-sm text-slate-600"><Clock3 size={16}/>{clock(c.starts_at)} – {clock(c.ends_at)}{c.mode && <Badge tone={c.mode === "ONLINE" ? "blue" : "orange"}>{c.mode}</Badge>}</div>
      {c.meet_link ? <a href={c.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary w-full"><Video size={18}/>Join class</a>
        : c.note ? <p className="text-sm text-orange-600 flex items-center gap-2"><MapPin size={16}/>{c.note}</p>
        : c.state === "ended" ? <p className="text-sm text-slate-400">Class has ended.</p>
        : <p className="text-sm text-slate-400">The joining link appears 10 minutes before the class starts.</p>}</div>)}</div>}
    <div><h2 className="font-semibold mb-3">Next 7 days</h2><DataTable columns={cols} rows={sched} loading={!sched} empty="Nothing scheduled this week." pageSize={7} searchKeys={["name", "course", "date"]}/></div></div>;
}
