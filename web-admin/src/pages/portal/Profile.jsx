import { useState } from "react"; import api from "../../api"; import { useMe } from "../../me.jsx";
import { PageHeader, Avatar, Detail, Field, Badge, useToast, errText } from "../../components/ui.jsx";
export default function PortalProfile() {
  const { me } = useMe(); const toast = useToast(); const [v, setV] = useState({ old_password: "", new_password: "", confirm: "" }); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const set = k => e => setV({ ...v, [k]: e.target.value });
  const submit = async e => { e.preventDefault(); setErrors({}); if (v.new_password !== v.confirm) return setErrors({ confirm: "Passwords do not match." }); setBusy(true);
    try { await api.post("/portal/change-password/", { old_password: v.old_password, new_password: v.new_password }); toast("Password changed"); setV({ old_password: "", new_password: "", confirm: "" }); } catch (x) { setErrors(x.response?.data || { detail: errText(x) }); } setBusy(false); };
  return <div className="max-w-2xl mx-auto space-y-5"><PageHeader title="My Profile"/>
    <div className="card p-6"><div className="flex items-center gap-4 mb-5"><Avatar src={me.photo} name={me.name} size={84}/><div><div className="text-xl font-semibold">{me.name}</div><Badge tone="violet">{me.role === "STAFF" ? "Staff" : "Student"}</Badge></div></div>
      <div className="grid sm:grid-cols-2 gap-4"><Detail label={me.role === "STAFF" ? "Staff ID" : "Student ID"}>{me.code}</Detail><Detail label="Email">{me.email}</Detail><Detail label="Phone">{me.phone}</Detail>
        {me.role === "STAFF" && <Detail label="Designation">{me.designation}</Detail>}<Detail label={me.role === "STAFF" ? "Joined" : "Enrolled on"}>{me.joined}</Detail></div>
      <p className="text-xs text-slate-400 mt-4">Your profile photo and details are managed by the academy admin.</p></div>
    <form onSubmit={submit} autoComplete="off" className="card p-6 space-y-4"><h2 className="font-semibold">Change password</h2>
      <Field label="Current password" required error={errors.old_password}><input className="input" type="password" autoComplete="current-password" required value={v.old_password} onChange={set("old_password")}/></Field>
      <Field label="New password" required error={errors.new_password} hint="At least 8 characters, not too common"><input className="input" type="password" autoComplete="new-password" required value={v.new_password} onChange={set("new_password")}/></Field>
      <Field label="Confirm new password" required error={errors.confirm}><input className="input" type="password" autoComplete="new-password" required value={v.confirm} onChange={set("confirm")}/></Field>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Update password"}</button></form></div>;
}
