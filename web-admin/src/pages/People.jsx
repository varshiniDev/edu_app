import { useEffect, useState, useCallback } from "react";
import { Layers } from "lucide-react";
import api from "../api";
import {
  PageHeader,
  DataTable,
  Modal,
  ConfirmDialog,
  Field,
  Avatar,
  Badge,
  PhotoPicker,
  Detail,
  useToast,
  errText,
  formData,
} from "../components/ui.jsx";
const CFG = {
  staff: {
    title: "Staff",
    one: "staff member",
    idKey: "staff_id",
    idLabel: "Staff ID",
    dateKey: "joining_date",
    dateLabel: "Joining date",
    extra: "designation",
    extraLabel: "Designation",
  },
  students: {
    title: "Students",
    one: "student",
    idKey: "student_id",
    idLabel: "Student ID",
    dateKey: "enrollment_date",
    dateLabel: "Enrollment date",
  },
};
function PersonForm({ c, kind, row, onClose, onDone }) {
  const edit = !!row;
  const toast = useToast();
  const [v, setV] = useState({
    [c.idKey]: row?.[c.idKey] ?? "",
    full_name: row?.full_name ?? "",
    email: row?.email ?? "",
    phone: row?.phone ?? "",
    [c.extra || "x"]: row?.[c.extra] ?? "",
    [c.dateKey]: row?.[c.dateKey] ?? "",
    is_active: row?.is_active ?? true,
    password: "",
  });
  const [photo, setPhoto] = useState({ file: null, remove: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const { x, ...rest } = v;
    const body = formData(
      {
        ...rest,
        photo: photo.file,
        remove_photo: photo.remove ? "1" : undefined,
      },
      ["password", c.dateKey],
    );
    try {
      edit
        ? await api.patch(`/${kind}/${row.id}/`, body)
        : await api.post(`/${kind}/`, body);
      toast(edit ? "Updated successfully" : "Created successfully");
      onDone();
    } catch (x) {
      setErrors(x.response?.data || { detail: errText(x) });
    }
    setBusy(false);
  };
  return (
    <Modal title={edit ? `Edit ${c.one}` : `Add ${c.one}`} onClose={onClose}>
      <form onSubmit={submit} autoComplete="off" className="space-y-4">
        {/* decoy fields stop the browser auto-filling saved logins into this form */}
        <input
          type="text"
          name="fake_user"
          autoComplete="username"
          className="hidden"
          tabIndex={-1}
        />
        <input
          type="password"
          name="fake_pass"
          autoComplete="current-password"
          className="hidden"
          tabIndex={-1}
        />
        <PhotoPicker url={row?.photo} name={v.full_name} onChange={setPhoto} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={c.idLabel} required error={errors[c.idKey]}>
            <input
              className="input"
              name={`f_${c.idKey}`}
              required
              disabled={edit}
              autoComplete="off"
              value={v[c.idKey]}
              onChange={set(c.idKey)}
            />
          </Field>
          <Field label="Full name" required error={errors.full_name}>
            <input
              className="input"
              name="f_fullname"
              required
              autoComplete="off"
              value={v.full_name}
              onChange={set("full_name")}
            />
          </Field>
          <Field label="Email address" required error={errors.email}>
            <input
              className="input"
              type="email"
              name="f_contact_mail"
              required
              autoComplete="off"
              value={v.email}
              onChange={set("email")}
            />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <input
              className="input"
              name="f_phone"
              autoComplete="off"
              value={v.phone}
              onChange={set("phone")}
            />
          </Field>
          {c.extra && (
            <Field label={c.extraLabel} error={errors[c.extra]}>
              <input
                className="input"
                name="f_extra"
                autoComplete="off"
                value={v[c.extra]}
                onChange={set(c.extra)}
              />
            </Field>
          )}
          <Field label={c.dateLabel} error={errors[c.dateKey]}>
            <input
              className="input"
              type="date"
              name="f_date"
              value={v[c.dateKey] || ""}
              onChange={set(c.dateKey)}
            />
          </Field>
          <Field
            label={edit ? "New password" : "Password"}
            required={!edit}
            error={errors.password}
            hint={
              edit
                ? "Leave blank to keep the current password"
                : "Minimum 8 characters"
            }
          >
            <input
              className="input"
              type="password"
              name="f_new_password"
              autoComplete="new-password"
              required={!edit}
              minLength={8}
              value={v.password}
              onChange={set("password")}
            />
          </Field>
          <Field label="Account status">
            <select
              className="input"
              value={v.is_active ? "1" : "0"}
              onChange={(e) =>
                setV({ ...v, is_active: e.target.value === "1" })
              }
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>
        </div>
        {errors.detail && (
          <p className="text-sm text-red-600">{errors.detail}</p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : edit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function AssignToBatch({ s, onClose, onDone }) {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [mode, setMode] = useState("OFFLINE");
  const [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/courses/", { params: { page_size: 200 } })
      .then((r) =>
        setCourses(r.data.results.filter((x) => x.status === "ACTIVE")),
      );
    api
      .get("/batches/", { params: { status: "ACTIVE", page_size: 500 } })
      .then((r) => setBatches(r.data.results));
  }, []);
  const go = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post(`/batches/${batch}/enrollments/`, {
        students: [s.user_id],
        mode,
      });
      toast("Student assigned to batch");
      onDone();
    } catch (x) {
      setErr(errText(x));
    }
  };
  return (
    <Modal
      title={`Assign ${s.full_name} to a batch`}
      size="sm"
      onClose={onClose}
    >
      <form onSubmit={go} className="space-y-4">
        <Field label="Course" required>
          <select
            className="input"
            required
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setBatch("");
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
        <Field label="Batch" required>
          <select
            className="input"
            required
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            disabled={!course}
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
        <Field label="Class mode">
          <select
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="OFFLINE">Offline (in person)</option>
            <option value="ONLINE">Online</option>
          </select>
        </Field>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary">Assign</button>
        </div>
      </form>
    </Modal>
  );
}
export default function People({ kind }) {
  const c = CFG[kind];
  const toast = useToast();
  const staff = kind === "staff";
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [delErr, setDelErr] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api
        .get(`/${kind}/`, { params: { is_active: status, page_size: 500 } })
        .then((r) => setRows(r.data.results))
        .catch((e) => toast(errText(e), "error")),
    [kind, status],
  );
  useEffect(() => {
    setRows(null);
    setModal(null);
    load();
  }, [kind, status]);
  const done = () => {
    setModal(null);
    load();
  };
  const remove = async () => {
    setBusy(true);
    setDelErr("");
    try {
      await api.delete(`/${kind}/${del.id}/`);
      toast("Deleted");
      setDel(null);
      load();
    } catch (e) {
      setDelErr(errText(e));
    }
    setBusy(false);
  };
  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (r) => (
        <div className="flex items-center gap-3 text-left">
          <Avatar src={r.photo} name={r.full_name} />
          <div>
            <div className="font-medium">{r.full_name}</div>
            <div className="text-xs text-slate-400">{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: c.idKey, label: c.idLabel },
    { key: "phone", label: "Phone" },
    staff
      ? { key: "designation", label: "Designation" }
      : { key: "enrollment_date", label: "Enrolled on" },
    {
      key: "batches",
      label: "Batches",
      render: (r) =>
        r.batches.length ? (
          <div className="flex flex-wrap gap-1 justify-center">
            {r.batches.map((b) => (
              <Badge key={b} tone="violet">
                {b}
              </Badge>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (r) => (
        <Badge tone={r.is_active ? "green" : "slate"}>
          {r.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];
  return (
    <div>
      <PageHeader
        title={c.title}
        subtitle={`Manage ${c.title.toLowerCase()} accounts`}
        onAdd={() => setModal({ mode: "form" })}
        addLabel={`Add ${c.one}`}
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={!rows}
        searchKeys={["full_name", "email", c.idKey, "phone"]}
        filters={
          <select
            className="input w-40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        }
        onView={(r) => setModal({ mode: "view", row: r })}
        onEdit={(r) => setModal({ mode: "form", row: r })}
        onDelete={(r) => {
          setDelErr("");
          setDel(r);
        }}
        extra={
          staff
            ? []
            : [
                {
                  icon: Layers,
                  label: "Assign to batch",
                  onClick: (r) => setModal({ mode: "assign", row: r }),
                },
              ]
        }
      />
      {modal?.mode === "form" && (
        <PersonForm
          c={c}
          kind={kind}
          row={modal.row}
          onClose={() => setModal(null)}
          onDone={done}
        />
      )}
      {modal?.mode === "assign" && (
        <AssignToBatch
          s={modal.row}
          onClose={() => setModal(null)}
          onDone={done}
        />
      )}
      {modal?.mode === "view" && (
        <Modal
          title={`${c.one[0].toUpperCase() + c.one.slice(1)} profile`}
          onClose={() => setModal(null)}
        >
          <div className="flex items-center gap-4 mb-5">
            <Avatar
              src={modal.row.photo}
              name={modal.row.full_name}
              size={84}
            />
            <div>
              <div className="text-xl font-semibold">{modal.row.full_name}</div>
              <Badge tone={modal.row.is_active ? "green" : "slate"}>
                {modal.row.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Detail label={c.idLabel}>{modal.row[c.idKey]}</Detail>
            <Detail label="Email">{modal.row.email}</Detail>
            <Detail label="Phone">{modal.row.phone}</Detail>
            <Detail label={c.dateLabel}>{modal.row[c.dateKey]}</Detail>
            {staff && (
              <Detail label="Designation">{modal.row.designation}</Detail>
            )}
            <Detail label="Batches">{modal.row.batches.join(", ")}</Detail>
          </div>
          <div className="flex justify-end mt-5">
            <button
              className="btn btn-primary"
              onClick={() => setModal({ mode: "form", row: modal.row })}
            >
              Edit
            </button>
          </div>
        </Modal>
      )}
      {del && (
        <ConfirmDialog
          message={`Delete ${del.full_name}? This cannot be undone.`}
          error={delErr}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  );
}
