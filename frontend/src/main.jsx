import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { request, post, setToken } from "./api";
import { Field, Table, Panel } from "./components";
import "./styles.css";
import { MyCourses, CourseRoster, InstructorAssignment } from "./CourseViews";

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    students: [],
    courses: [],
    enrollments: [],
    reports: [],
    notifications: [],
    myCourses: [],
    instructors: [],
  });
  const [tab, setTab] = useState("students");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const clearSession = () => {
    setToken(null);
    setUser(null);
    setData({
      students: [],
      courses: [],
      enrollments: [],
      reports: [],
      notifications: [],
      myCourses: [],
      instructors: [],
    });
  };
  async function refresh() {
    const endpoints = {
      students: "/students",
      courses: "/courses",
      enrollments: "/enrollments",
      reports: "/reports",
      notifications: "/notifications",
      myCourses: "/my-courses",
    };
    if (user.role === "admin") endpoints.instructors = "/instructors";
    const entries = await Promise.all(
      Object.entries(endpoints).map(async ([key, path]) => [
        key,
        await request(path),
      ]),
    );
    setData({ instructors: [], ...Object.fromEntries(entries) });
  }

  function handleError(cause) {
    setError(cause.message);
    if (cause.status === 401) clearSession();
  }
  useEffect(() => {
    if (user) refresh().catch(handleError);
  }, [user]);
  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const credentials = Object.fromEntries(new FormData(event.currentTarget));
      const session = await post("/auth/login", credentials);
      setToken(session.token);
      setCourseId("");
      setSearch("");
      setTab(session.user.role === "admin" ? "enrollments" : "myCourses");
      setUser(session.user);
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await post("/auth/logout", {});
      clearSession();
      setMessage("");
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event, resource, numericFields = []) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    const values = Object.fromEntries(new FormData(form));
    numericFields.forEach((key) => {
      if (key in values) values[key] = Number(values[key]);
    });
    try {
      await post(`/${resource}`, values);
      form.reset();
      setMessage("Record saved successfully.");
      await refresh();
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  const button = (
    <button disabled={busy} className="primary">
      {busy ? "Saving…" : "Save record"}
    </button>
  );
  if (!user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-teal-700">
            University portal
          </p>
          <h1 className="text-3xl font-bold">Academic Manager</h1>
          <p className="mt-3 mb-7 text-slate-500">
            Sign in to manage your academic information.
          </p>
          <form onSubmit={login} className="grid gap-4">
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={150}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <button disabled={busy} className="primary">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-500">
            Demo account details are available in the project README.
          </p>
        </section>
      </main>
    );
  const tabs =
    user.role === "admin"
      ? [
          ["enrollments", "Student enrollment"],
          ["rosters", "Enrolled students"],
          ["students", "Students"],
          ["courses", "Courses & assignments"],
          ["reports", "Reports"],
          ["notifications", "Notifications"],
        ]
      : [
          [
            "myCourses",
            user.role === "instructor" ? "Assigned courses" : "My courses",
          ],
          ["rosters", "Enrolled students"],
          ["notifications", "Notifications"],
        ];
  const rosterCourses = user.role === "admin" ? data.courses : data.myCourses;
  const filtered = (data[tab] || []).filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  );
  async function assignInstructor(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await post(`/courses/${values.courseId}/instructor`, {
        instructorId: Number(values.instructorId),
      });
      form.reset();
      await refresh();
      setMessage("Instructor assigned successfully.");
    } catch (cause) {
      handleError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-7">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-teal-300">
              University portal
            </p>
            <h1 className="mt-1 text-2xl font-bold">Academic Manager</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right text-sm">
              <p>{user.name}</p>
              <p className="capitalize text-slate-400">{user.role}</p>
            </div>
            <button
              onClick={logout}
              disabled={busy}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h2 className="text-2xl font-bold">
            {user.role === "admin"
              ? "Administration"
              : user.role === "instructor"
                ? "Teaching overview"
                : "My studies"}
          </h2>
          <p className="mt-1 text-slate-500">
            {user.role === "admin"
              ? "Manage student enrollments, teaching assignments, and class rosters."
              : user.role === "instructor"
                ? "Your assigned courses and the students enrolled in them."
                : "Your enrolled courses and classmates, in one place."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(user.role === "admin"
            ? [
                ["students", "Students"],
                ["courses", "Courses"],
                ["enrollments", "Enrollments"],
              ]
            : [
                [
                  "myCourses",
                  user.role === "instructor"
                    ? "Assigned courses"
                    : "Enrolled courses",
                ],
                ["notifications", "Notifications"],
              ]
          ).map(([key, label]) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm capitalize text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{data[key].length}</p>
            </div>
          ))}
        </div>
        <nav aria-label="Academic sections" className="flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => {
                setTab(key);
                setSearch("");
                setError("");
                setMessage("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${tab === key ? "bg-teal-700 text-white" : "bg-white text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-teal-50 p-4 text-teal-800">
            {message}
          </p>
        )}
        {tab === "myCourses" && (
          <MyCourses
            courses={data.myCourses}
            role={user.role}
            onOpenRoster={(id) => {
              setCourseId(String(id));
              setTab("rosters");
            }}
          />
        )}
        {tab === "rosters" && (
          <CourseRoster
            courses={rosterCourses}
            courseId={courseId}
            onSelectCourse={setCourseId}
            onError={handleError}
          />
        )}
        {tab === "courses" && user.role === "admin" && (
          <InstructorAssignment
            courses={data.courses}
            instructors={data.instructors}
            busy={busy}
            onAssign={assignInstructor}
          />
        )}
        {tab === "students" && user.role === "admin" && (
          <Panel title="Add a student">
            <form
              className="form-grid"
              onSubmit={(event) => submit(event, "students", ["semester"])}
            >
              <Field label="Full name" name="name" maxLength={120} />
              <Field label="Major" name="major" maxLength={120} />
              <Field
                label="Semester"
                name="semester"
                type="number"
                min="1"
                max="12"
              />
              {button}
            </form>
          </Panel>
        )}
        {tab === "courses" && user.role === "admin" && (
          <Panel title="Add a course">
            <form
              className="form-grid"
              onSubmit={(event) => submit(event, "courses", ["capacity"])}
            >
              <Field label="Course name" name="name" maxLength={120} />
              <Field label="Instructor" name="instructor" maxLength={120} />
              <Field
                label="Capacity"
                name="capacity"
                type="number"
                min="1"
                max="1000"
              />
              {button}
            </form>
          </Panel>
        )}
        {tab === "enrollments" && user.role === "admin" && (
          <Panel title="Enroll a student">
            <form
              className="form-grid"
              onSubmit={(event) =>
                submit(event, "enrollments", ["studentId", "courseId"])
              }
            >
              {user.role === "admin" && (
                <label className="select-label">
                  Student
                  <select name="studentId" required defaultValue="">
                    <option value="" disabled>
                      Select a student
                    </option>
                    {data.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="select-label">
                Course
                <select name="courseId" required defaultValue="">
                  <option value="" disabled>
                    Select a course
                  </option>
                  {data.courses.map((course) => (
                    <option
                      key={course.id}
                      value={course.id}
                      disabled={course.enrolled >= course.capacity}
                    >
                      {course.name} ({course.capacity - course.enrolled} seats
                      left)
                    </option>
                  ))}
                </select>
              </label>
              {button}
            </form>
          </Panel>
        )}
        {!["myCourses", "rosters"].includes(tab) && (
          <Panel
            title={
              {
                students: "Student directory",
                courses: "Course catalog",
                enrollments: "Enrollment records",
                reports: "Academic reports",
                notifications: "Enrollment notifications",
              }[tab]
            }
          >
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field
                label="Search records"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                required={false}
              />
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await refresh();
                  } catch (cause) {
                    handleError(cause);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Refresh
              </button>
            </div>
            <Table
              rows={filtered}
              columns={
                {
                  students: [
                    ["id", "ID"],
                    ["name", "Name"],
                    ["major", "Major"],
                    ["semester", "Semester"],
                  ],
                  courses: [
                    ["id", "ID"],
                    ["name", "Course"],
                    ["instructor", "Instructor"],
                    ["capacity", "Capacity"],
                    ["enrolled", "Enrolled"],
                  ],
                  enrollments: [
                    ["id", "ID"],
                    ["student", "Student"],
                    ["course", "Course"],
                  ],
                  reports: [
                    ["name", "Student"],
                    ["major", "Major"],
                    ["courses", "Courses"],
                  ],
                  notifications: [
                    ["message", "Message"],
                    ["created_at", "Created at"],
                  ],
                }[tab]
              }
            />
          </Panel>
        )}
        <footer className="text-xs text-slate-500">
          Software Architecture · University Academic Manager
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
