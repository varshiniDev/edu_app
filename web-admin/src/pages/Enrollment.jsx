import { useEffect, useState, useCallback } from "react";
import { ArrowRightLeft } from "lucide-react";
import api from "../api";
import AssignStudents from "../components/AssignStudents.jsx";
import {
  PageHeader,
  DataTable,
  Modal,
  ConfirmDialog,
  Field,
  Avatar,
  Badge,
  Detail,
  useToast,
  errText,
} from "../components/ui.jsx";
const TONE = { ACTIVE: "green", TRANSFERRED: "violet", LEFT: "slate" };
export default function Enrollment() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [course, setCourse] = useState("");
  const [batchId, setBatchId] = useState("");
  const [rows, setRows] = useState(null);
  const [history, setHistory] = useState(false);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [err, setErr] = useState("");
  const [val, setVal] = useState("");
  const loadBatches = useCallback(
    () =>
      api
        .get("/batches/", { params: { status: "ACTIVE", page_size: 500 } })
        .then((r) => setBatches(r.data.results)),
    [],
  );
  useEffect(() => {
    api
      .get("/courses/", { params: { page_size: 500 } })
      .then((r) =>
        setCourses(r.data.results.filter((c) => c.status === "ACTIVE")),
      );
    loadBatches();
  }, []);
  const batch = batches.find((b) => String(b.id) === batchId);
  const load = useCallback(
    () =>
      batchId
        ? api
            .get(`/batches/${batchId}/enrollments/`)
            .then((r) => setRows(r.data))
        : setRows(null),
    [batchId],
  );
  useEffect(() => {
    setRows(null);
    load();
  }, [batchId]);
  const done = () => {
    setModal(null);
    load();
    loadBatches();
  };
  const post = async (path, body, msg) => {
    try {
      await api.post(`/batches/${batchId}/${path}/`, body);
      toast(msg);
      done();
    } catch (x) {
      setErr(errText(x));
    }
  };
  const remove = async () => {
    try {
      await api.post(`/batches/${batchId}/leave/`, { student: del.student });
      toast("Student removed from batch (history kept)");
      setDel(null);
      done();
    } catch (x) {
      setErr(errText(x));
    }
  };
  const shown = rows && (history ? rows : rows.filter((r) => !r.left_on));
  const columns = [
    {
      key: "student_name",
      label: "Student",
      render: (r) => (
        <div className="flex items-center gap-3 text-left">
          <Avatar src={r.student_photo} name={r.student_name} size={32} />
          <span className="font-medium">{r.student_name}</span>
        </div>
      ),
    },
    { key: "student_code", label: "Student ID" },
    {
      key: "mode",
      label: "Mode",
      render: (r) => (
        <Badge tone={r.mode === "ONLINE" ? "blue" : "orange"}>{r.mode}</Badge>
      ),
    },
    { key: "enrolled_on", label: "Enrolled on" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
    },
  ];
  return (
    <div>
      <PageHeader
        title="Student Enrollment"
        subtitle="Select a course, then a batch, then assign students"
        onAdd={batch ? () => setModal({ t: "assign" }) : null}
        addLabel="Assign students"
      />
      <div className="card p-4 mb-4 grid sm:grid-cols-3 gap-4 items-end">
        <Field label="1. Course">
          <select
            className="input"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setBatchId("");
            }}
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="2. Batch">
          <select
            className="input"
            value={batchId}
            disabled={!course}
            onChange={(e) => setBatchId(e.target.value)}
          >
            <option value="">Select batch…</option>
            {batches
              .filter((b) => String(b.course) === course)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.enrolled_count}/{b.capacity})
                </option>
              ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input
            type="checkbox"
            checked={history}
            onChange={(e) => setHistory(e.target.checked)}
          />
          Show enrollment history
        </label>
      </div>
      {!batch ? (
        <p className="text-slate-500 text-center p-8">
          Choose a course and batch to see enrolled students.
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={shown}
          loading={!shown}
          empty="No students enrolled yet. Click + to assign students."
          isActionable={(r) => !r.left_on}
          searchKeys={["student_name", "student_code"]}
          onView={(r) => setModal({ t: "view", row: r })}
          onEdit={(r) => {
            setVal(r.mode);
            setErr("");
            setModal({ t: "edit", row: r });
          }}
          onDelete={(r) => {
            setErr("");
            setDel(r);
          }}
          extra={[
            {
              icon: ArrowRightLeft,
              label: "Transfer to another batch",
              onClick: (r) => {
                setVal("");
                setErr("");
                setModal({ t: "transfer", row: r });
              },
            },
          ]}
        />
      )}
      {modal?.t === "assign" && (
        <AssignStudents
          batch={batch}
          onClose={() => setModal(null)}
          onDone={done}
        />
      )}
      {modal?.t === "view" && (
        <Modal
          title={modal.row.student_name}
          size="sm"
          onClose={() => setModal(null)}
        >
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={modal.row.student_photo}
              name={modal.row.student_name}
              size={64}
            />
            <div>
              <div className="font-semibold">{modal.row.student_name}</div>
              <div className="text-sm text-slate-500">
                {modal.row.student_code}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Batch">{batch.name}</Detail>
            <Detail label="Mode">{modal.row.mode}</Detail>
            <Detail label="Enrolled on">{modal.row.enrolled_on}</Detail>
            <Detail label="Status">{modal.row.status}</Detail>
            <div className="col-span-2">
              <Detail label="Note">{modal.row.note}</Detail>
            </div>
          </div>
        </Modal>
      )}
      {modal?.t === "edit" && (
        <Modal
          title={`Edit · ${modal.row.student_name}`}
          size="sm"
          onClose={() => setModal(null)}
        >
          <Field label="Class mode">
            <select
              className="input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            >
              <option value="OFFLINE">Offline (in person)</option>
              <option value="ONLINE">Online (gets meeting link)</option>
            </select>
          </Field>
          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                post(
                  "mode",
                  { student: modal.row.student, mode: val },
                  "Mode updated",
                )
              }
            >
              Save
            </button>
          </div>
        </Modal>
      )}
      {modal?.t === "transfer" && (
        <Modal
          title={`Transfer · ${modal.row.student_name}`}
          size="sm"
          onClose={() => setModal(null)}
        >
          <Field
            label="Move to batch (same course)"
            hint="Old enrollment is kept as history."
          >
            <select
              className="input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            >
              <option value="">Select batch…</option>
              {batches
                .filter(
                  (b) =>
                    String(b.course) === course && String(b.id) !== batchId,
                )
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.enrolled_count}/{b.capacity})
                  </option>
                ))}
            </select>
          </Field>
          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!val}
              onClick={() =>
                post(
                  "transfer",
                  { student: modal.row.student, to_batch: +val },
                  "Student transferred",
                )
              }
            >
              Transfer
            </button>
          </div>
        </Modal>
      )}
      {del && (
        <ConfirmDialog
          title="Remove from batch"
          confirmLabel="Remove"
          message={`Remove ${del.student_name} from ${batch.name}? Their history is kept.`}
          error={err}
          onConfirm={remove}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  );
}
