import { useState } from "react";
import api from "../api";
import { useBranding, Logo } from "../branding.jsx";
import { useMe } from "../me.jsx";
import {
  PageHeader,
  Field,
  PhotoPicker,
  useToast,
  errText,
  formData,
} from "../components/ui.jsx";
export default function Settings() {
  const b = useBranding();
  const { me, setMe } = useMe();
  const toast = useToast();
  const [name, setName] = useState(b.academy_name);
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState({ file: null, remove: false });
  const saveBrand = async (remove = false) => {
    try {
      const { data } = await api.patch(
        "/branding/",
        formData({
          academy_name: name,
          logo: file,
          remove_logo: remove ? "1" : undefined,
        }),
      );
      b.setBranding(data);
      setFile(null);
      toast("Branding saved. Logo updated on web and mobile.");
    } catch (e) {
      toast(errText(e), "error");
    }
  };
  const saveProfile = async () => {
    try {
      const { data } = await api.patch(
        "/auth/me/",
        formData({
          photo: photo.file,
          remove_photo: photo.remove ? "1" : undefined,
        }),
      );
      setMe(data);
      setPhoto({ file: null, remove: false });
      toast("Profile photo updated");
    } catch (e) {
      toast(errText(e), "error");
    }
  };
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Branding and your admin profile" />
      <div className="card p-6 mb-5 space-y-4">
        <h2 className="font-semibold">Company branding</h2>
        <div className="flex items-center gap-4">
          <Logo size={72} />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <Field label="Academy name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => saveBrand()}>
            Save branding
          </button>
          {b.logo_url && (
            <button
              className="btn btn-ghost"
              onClick={() => confirm("Remove logo?") && saveBrand(true)}
            >
              Remove logo
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">Logo: PNG/JPG/WEBP, max 2 MB.</p>
      </div>
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">My profile</h2>
        {me && (
          <PhotoPicker
            key={me.photo}
            url={me.photo}
            name={me.name}
            onChange={setPhoto}
            label="Admin profile photo"
          />
        )}
        <p className="text-xs text-slate-400">
          Staff and student photos can only be uploaded by an admin, from their
          Add/Edit forms.
        </p>
        <button
          className="btn btn-primary"
          disabled={!photo.file && !photo.remove}
          onClick={saveProfile}
        >
          Save photo
        </button>
      </div>
    </div>
  );
}
