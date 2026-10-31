
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  ClipboardCheck,
  Sparkles,
  Target,
  Heart,
  Award,
} from "lucide-react";
import api from "../api";
import { useMe } from "../me.jsx";

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const { me } = useMe();

  const isAdmin = me?.is_admin;
  const isStaff = me?.role === "STAFF";
  const name = me?.name || "User";

  const welcome = isAdmin
    ? {
        label: "ADMINISTRATOR",
        title: "Great leadership builds great institutions.",
        message:
          "Your vision creates opportunities, empowers your team and builds a brighter future for every student.",
        icon: Award,
        gradient: "from-violet-600 via-indigo-600 to-blue-600",
      }
    : isStaff
      ? {
          label: "STAFF PORTAL",
          title: "Your guidance shapes their future.",
          message:
            "Every lesson you teach and every student you encourage makes a difference. Keep inspiring!",
          icon: Heart,
          gradient: "from-orange-500 via-rose-500 to-pink-600",
        }
      : {
          label: "STUDENT PORTAL",
          title: "Your dreams deserve your dedication!",
          message:
            "Learn something new every day. Believe in yourself, stay focused and make your future amazing!",
          icon: Target,
          gradient: "from-blue-500 via-indigo-600 to-purple-600",
        };

  useEffect(() => {
    if (!isAdmin) return;

    api
      .get("/dashboard/summary/")
      .then((r) => setD(r.data))
      .catch(() => setErr("Failed to load dashboard data"));
  }, [isAdmin]);

  const cards = d
    ? [
        {
          label: "Total Students",
          value: d.students,
          icon: GraduationCap,
          gradient: "from-blue-500 to-indigo-600",
        },
        {
          label: "Active Staff",
          value: d.staff,
          icon: Users,
          gradient: "from-orange-400 to-rose-500",
        },
        {
          label: "Active Courses",
          value: d.courses,
          icon: BookOpen,
          gradient: "from-emerald-400 to-teal-600",
        },
        {
          label: "Active Batches",
          value: d.batches,
          icon: Layers,
          gradient: "from-violet-500 to-fuchsia-600",
        },
        {
          label: "Today's Attendance",
          value:
            d.attendance_today == null
              ? "Not marked"
              : `${d.attendance_today}%`,
          icon: ClipboardCheck,
          gradient: "from-sky-400 to-blue-600",
        },
      ]
    : [];

  // Interactive 3D mouse movement
  const handleMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 14;
    const rotateX = ((y / rect.height) - 0.5) * -14;

    card.style.setProperty("--rotateX", `${rotateX}deg`);
    card.style.setProperty("--rotateY", `${rotateY}deg`);
    card.style.setProperty("--mouseX", `${x}px`);
    card.style.setProperty("--mouseY", `${y}px`);
  };

  const resetCard = (e) => {
    e.currentTarget.style.setProperty("--rotateX", "0deg");
    e.currentTarget.style.setProperty("--rotateY", "0deg");
  };

  return (
    <div className="dashboard-bg relative min-h-screen overflow-hidden">

      {/* Animated background */}
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />
      <div className="background-orb orb-four" />

      <div className="floating-particle particle-one" />
      <div className="floating-particle particle-two" />
      <div className="floating-particle particle-three" />
      <div className="floating-particle particle-four" />

      <div className="relative z-10 p-4 md:p-7">

        {/* Welcome section */}
        <section
          className={`welcome-banner relative overflow-hidden rounded-[28px] bg-gradient-to-br ${welcome.gradient} p-7 md:p-10 text-white shadow-2xl mb-8`}
        >
          <div className="welcome-circle circle-one" />
          <div className="welcome-circle circle-two" />
          <div className="welcome-circle circle-three" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-5 text-sm font-semibold tracking-widest text-white/80">
              <Sparkles size={17} />
              {welcome.label}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              Welcome back, {name}! 👋
            </h1>

            <h2 className="text-lg md:text-xl font-semibold mb-3">
              {welcome.title}
            </h2>

            <p className="text-sm md:text-base text-white/80 leading-relaxed">
              {welcome.message}
            </p>
          </div>

          <div className="welcome-icon hidden md:flex">
            <welcome.icon size={55} />
          </div>
        </section>

        {/* Admin cards - no extra headings */}
        {isAdmin && (
          <>
            {err && (
              <p className="rounded-xl bg-red-50 p-4 text-red-600">
                {err}
              </p>
            )}

            {!d && !err && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-3xl bg-white/50 animate-pulse"
                  />
                ))}
              </div>
            )}

            {d && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card, i) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      onMouseMove={handleMove}
                      onMouseLeave={resetCard}
                      style={{ animationDelay: `${i * 120}ms` }}
                      className={`interactive-card bg-gradient-to-br ${card.gradient}`}
                    >
                      <div className="card-shine" />

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="card-icon">
                          <Icon size={29} />
                        </div>
                        <Sparkles className="text-white/50" size={20} />
                      </div>

                      <div className="relative z-10 mt-8">
                        <h2 className="text-4xl font-extrabold tracking-tight">
                          {card.value ?? 0}
                        </h2>
                        <p className="mt-2 text-sm font-semibold text-white/85">
                          {card.label}
                        </p>
                      </div>

                      <div className="card-decoration" />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Staff and student content */}
        {!isAdmin && (
          <div className="role-message">
            {isStaff ? (
              <>
                <Heart size={27} className="text-rose-500" />
                <h2>Make Every Day Count!</h2>
                <p>
                  Inspire your students, share your knowledge and celebrate
                  their progress. Your efforts create lasting impact.
                </p>
              </>
            ) : (
              <>
                <Target size={27} className="text-indigo-500" />
                <h2>Small Steps. Big Achievements! 🚀</h2>
                <p>
                  Attend your classes, explore your study materials and
                  challenge yourself to become better every day.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
