import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Settings as Cog,
  LogOut,
  Users,
  GraduationCap,
  Layers,
  ClipboardCheck,
  UserPlus,
  Home as HomeIcon,
  Video,
  FileText,
  UserCircle,
} from "lucide-react";
import axios from "axios";
import api, { API } from "./api";
import { Logo, useBranding } from "./branding.jsx";
import { MeProvider, useMe } from "./me.jsx";
import { Avatar } from "./components/ui.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Courses from "./pages/Courses.jsx";
import People from "./pages/People.jsx";
import Batches from "./pages/Batches.jsx";
import PHome from "./pages/portal/Home.jsx";
import PBatches from "./pages/portal/Batches.jsx";
import PAttendance from "./pages/portal/Attendance.jsx";
import PRecordings from "./pages/portal/Recordings.jsx";
import PMaterials from "./pages/portal/Materials.jsx";
import PProfile from "./pages/portal/Profile.jsx";
import Enrollment from "./pages/Enrollment.jsx";
import Attendance from "./pages/Attendance.jsx";
import Syllabus from "./pages/Syllabus.jsx";
import Settings from "./pages/Settings.jsx";

function Login() {
  const nav = useNavigate();
  const { academy_name } = useBranding();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await axios.post(`${API}/auth/login/`, f);
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      await api.get("/auth/me/");
      nav("/");
    } catch (e) {
      setErr(
        !e.response
          ? "Cannot reach the server. Is the backend running?"
          : e.response.status === 401
            ? "Wrong ID/email or password, or the account is inactive. Ask the admin."
            : `Server error (${e.response.status}).`,
      );
    }
  };
  return (
    <div className="min-h-screen grid place-items-center grad-brand p-4">
      <form
        onSubmit={submit}
        className="card modal-enter p-8 w-full max-w-sm space-y-4"
      >
        <div className="flex flex-col items-center gap-2">
          <Logo size={64} />
          <h1 className="text-xl font-bold">{academy_name}</h1>
          <p className="text-sm text-slate-500">Sign in to your portal</p>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <input
          className="input"
          placeholder="Staff ID, Student ID or email"
          value={f.username}
          onChange={(e) => setF({ ...f, username: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
        <button className="btn btn-primary w-full">Sign in</button>
      </form>
    </div>
  );
}
const ADMIN_NAV = [
  ["/", "Dashboard", LayoutDashboard, true],
  ["/staff", "Staff", Users],
  ["/students", "Students", GraduationCap],
  ["/courses", "Courses & Syllabus", BookOpen],
  ["/batches", "Batches", Layers],
  ["/enrollment", "Enrollment", UserPlus],
  ["/attendance", "Attendance", ClipboardCheck],
  ["/settings", "Settings", Cog],
];
const PORTAL_NAV = (staff) => [
  ["/", "Home", HomeIcon, true],
  ["/batches", "My Batches", Layers],
  ["/attendance", staff ? "Attendance" : "My Attendance", ClipboardCheck],
  ["/recordings", "Recordings", Video],
  ["/materials", "Study Material", FileText],
  ["/profile", "My Profile", UserCircle],
];
function Shell({ nav: items, roleLabel, children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { academy_name } = useBranding();
  const { me } = useMe();
  const link = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-white border-r p-4 space-y-1 hidden md:block shrink-0">
        <div className="flex items-center gap-2 mb-5">
          <Logo />
          <span className="font-bold text-sm leading-tight">
            {academy_name}
          </span>
        </div>
        {items.map(([to, label, I, end]) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <I size={18} />
            {label}
          </NavLink>
        ))}
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-14 bg-white/80 backdrop-blur border-b flex items-center justify-end gap-3 px-6 sticky top-0 z-30">
          <Avatar src={me?.photo} name={me?.name} size={34} />
          <div className="text-sm leading-tight">
            <div className="font-medium">{me?.name}</div>
            <div className="text-xs text-slate-400">{roleLabel}</div>
          </div>
          <button
            title="Logout"
            className="icon-btn text-slate-500 hover:bg-slate-100"
            onClick={() => {
              localStorage.clear();
              nav("/login");
            }}
          >
            <LogOut size={18} />
          </button>
        </header>
        <nav className="md:hidden flex gap-1 overflow-x-auto p-2 bg-white border-b">
          {items.map(([to, label, I, end]) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <I size={16} />
              <span className="whitespace-nowrap text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>
        <main key={loc.pathname} className="page-enter p-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
function Gate() {
  const { me } = useMe();
  if (!me) return <p className="p-10 text-center text-slate-500">Loading…</p>;
  if (me.is_admin)
    return (
      <Shell nav={ADMIN_NAV} roleLabel="Administrator">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id/syllabus" element={<Syllabus />} />
          <Route path="staff" element={<People kind="staff" />} />
          <Route path="students" element={<People kind="students" />} />
          <Route path="batches" element={<Batches />} />
          <Route path="enrollment" element={<Enrollment />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Shell>
    );
  return (
    <Shell
      nav={PORTAL_NAV(me.role === "STAFF")}
      roleLabel={me.role === "STAFF" ? "Staff" : "Student"}
    >
      <Routes>
        <Route index element={<PHome />} />
        <Route path="batches" element={<PBatches />} />
        <Route path="attendance" element={<PAttendance />} />
        <Route path="recordings" element={<PRecordings />} />
        <Route path="materials" element={<PMaterials />} />
        <Route path="profile" element={<PProfile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Shell>
  );
}
export default function App() {
  useLocation();
  const authed = !!localStorage.getItem("access");
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          authed ? (
            <MeProvider>
              <Gate />
            </MeProvider>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
