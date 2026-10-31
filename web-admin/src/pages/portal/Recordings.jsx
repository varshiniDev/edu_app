import { useEffect, useState } from "react"; import { Video, ExternalLink } from "lucide-react"; import api from "../../api";
import { PageHeader, DataTable } from "../../components/ui.jsx"; import { useMyBatches, BatchPicker } from "./shared.jsx";
export default function PortalRecordings() {
  const batches = useMyBatches(); const [batch, setBatch] = useState(""); const [rows, setRows] = useState(null);
  useEffect(() => { setRows(null); if (batch) api.get("/portal/recordings/", { params: { batch } }).then(r => setRows(r.data)); }, [batch]);
  const cols = [{ key: "date", label: "Date" }, { key: "weekday", label: "Day" }, { key: "title", label: "Title" },
    { key: "url", label: "Recording", render: r => <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-ghost py-1"><Video size={14}/>Watch<ExternalLink size={12}/></a> }];
  return <div><PageHeader title="Class Recordings" subtitle="Daily recordings of your batch"/><div className="card p-4 mb-4"><BatchPicker batches={batches} value={batch} onChange={setBatch}/></div>
    <DataTable columns={cols} rows={rows} loading={!rows && !!batch} empty="No recordings uploaded yet." pageSize={10} searchKeys={["date", "title", "weekday"]}/></div>;
}
