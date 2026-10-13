import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { request, post, setToken } from "./services/api";
import { Layout } from "./layouts/Layout";
import { Icon } from "./components/UI";
import { Courses } from "./pages/Courses";
import Enrollment from "./pages/Enrollment";
import Notifications from "./pages/Notifications";
import "./styles/app.css";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Reports from "./pages/Reports";
const emptyData = () => ({
  courses: [],
  students: [],
  enrollments: [],
  notifications: [],
  instructors: [],
});
function App() {
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [module, setModule] = useState("courses");
  const [data, setData] = useState(emptyData);
  const [selectedId, setSelectedId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const session = useRef(0);
  const rosterRequest = useRef(0);
  function clearSession() {
    session.current++;
    rosterRequest.current++;
    setToken(null);
    setUser(null);
    setData(emptyData());
    setParticipants([]);
    setSelectedId(null);
  }
  function handleError(cause) {
    setError(cause.message);
    if (cause.status === 401) clearSession();
  }
  async function refresh(account = user) {
    const version = session.current;
    const paths = {
      courses: account.role === "admin" ? "/courses" : "/my-courses",
      notifications: "/notifications",
    };
    if (account.role === "admin")
      Object.assign(paths, {
        students: "/students",
        enrollments: "/enrollments",
        instructors: "/instructors",
      });
    setLoading(true);
    try {
      const entries = await Promise.all(
        Object.entries(paths).map(async ([key, path]) => [
          key,
          await request(path),
        ]),
      );
      if (session.current === version)
        setData({ ...emptyData(), ...Object.fromEntries(entries) });
    } finally {
      if (session.current === version) setLoading(false);
    }
  }
  useEffect(() => {
    if (user) refresh().catch(handleError);
  }, [user]);
  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await post(
        "/auth/login",
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      setToken(result.token);
      session.current++;
      setUser(result.user);
      setModule(result.user.role === "admin" ? "dashboard" : "courses");
      setMessage("");
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await post("/auth/logout", {});
      clearSession();
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function openCourse(course) {
    const id = ++rosterRequest.current;
    setSelectedId(course.id);
    setParticipants([]);
    setRosterLoading(true);
    setError("");
    setMessage("");
    try {
      await post(`/courses/${course.id}/access`, {});
      const rows = await request(`/courses/${course.id}/students`);
      if (id === rosterRequest.current) setParticipants(rows);
    } catch (cause) {
      if (id === rosterRequest.current) handleError(cause);
    } finally {
      if (id === rosterRequest.current) setRosterLoading(false);
    }
  }
  async function mutate(action, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await refresh();
      setMessage(success);
      return true;
    } catch (cause) {
      handleError(cause);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function navigate(value) {
    rosterRequest.current++;
    setModule(value);
    setRegistering(false);
    setSelectedId(null);
    setParticipants([]);
    setError("");
    setMessage("");
  }
  const selectedCourse = data.courses.find(
    (course) => course.id === selectedId,
  );
  if (!user)
    return (
      <main className="login-page">
        <section className="login-card">
          <span className="mb-5 inline-flex rounded-2xl bg-blue-600 p-4 text-white">
            <Icon name="courses" className="h-8 w-8" />
          </span>
          <p className="text-xs font-bold tracking-[.2em] text-blue-600">
            UNIVERSITY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-800">
            Academic portal
          </h1>
          <p className="mt-3 mb-7 text-sm text-gray-500">
            Sign in to access your courses and notifications.
          </p>
          <form className="space-y-4" onSubmit={login}>
            <label className="field">
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <button className="primary w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-gray-400">
            University Academic Management
          </p>
        </section>
      </main>
    );
  return (
    <Layout
      user={user}
      module={module}
      onNavigate={navigate}
      unread={data.notifications.filter((row) => !row.read_at).length}
      busy={busy || loading}
      onLogout={logout}
      onRefresh={() => {
        setError("");
        refresh()
          .then(() => selectedCourse && openCourse(selectedCourse))
          .catch(handleError);
      }}
    >
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {message}
        </p>
      )}
      {loading && (
        <p role="status" className="mb-4 text-sm text-gray-500">
          Refreshing data…
        </p>
      )}
      {user.role === "admin" && module === "dashboard" && (
        <Dashboard
          data={data}
          user={user}
          onNavigate={navigate}
          onRegister={() => {
            navigate("enrollment");
            setRegistering(true);
          }}
        />
      )}
      {user.role === "admin" && module === "students" && (
        <Students
          students={data.students}
          busy={busy}
          onCreate={(values) =>
            mutate(
              () => post("/students", values),
              "Student registered successfully.",
            )
          }
        />
      )}
      {user.role === "admin" && module === "reports" && <Reports {...data} />}
      {(module === "courses" ||
        (module === "rosters" && user.role === "admin")) && (
        <Courses
          key={module}
          rosterOnly={module === "rosters"}
          onCreate={(values) =>
            mutate(
              () => post("/courses", values),
              "Course registered successfully.",
            )
          }
          courses={data.courses}
          user={user}
          selectedCourse={selectedCourse}
          participants={participants}
          loading={rosterLoading}
          onOpen={openCourse}
          onBack={() => {
            rosterRequest.current++;
            setSelectedId(null);
            setParticipants([]);
          }}
          instructors={data.instructors}
          busy={busy}
          onAssign={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutate(async () => {
              await post(`/courses/${selectedId}/instructor`, {
                instructorId: Number(form.get("instructorId")),
              });
              await openCourse(selectedCourse);
            }, "Instructor assigned successfully.");
          }}
        />
      )}
      {module === "notifications" && (
        <Notifications
          rows={data.notifications}
          busy={busy}
          onRead={(id) =>
            mutate(
              () => post(`/notifications/${id}/read`, {}),
              "Notification marked as read.",
            )
          }
        />
      )}
      {module === "enrollment" && user.role === "admin" && (
        <Enrollment
          courses={data.courses}
          students={data.students}
          enrollments={data.enrollments}
          busy={busy}
          registering={registering}
          onRegister={() => {
            setMessage("");
            setError("");
            setRegistering(true);
          }}
          onCancel={() => {
            setRegistering(false);
            setError("");
          }}
          onEnroll={async (courseId, studentId) => {
            const success = await mutate(
              () => post("/enrollments", { courseId, studentId }),
              "Enrollment registered successfully.",
            );
            if (success) setRegistering(false);
            return success;
          }}
        />
      )}
    </Layout>
  );
}
createRoot(document.getElementById("root")).render(<App />);
