import React, { useState } from "react";
import { Icon, Avatar, roleLabel } from "../components/UI";
export function Participants({ rows, loading }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "last_name", direction: 1 });
  const [role, setRole] = useState("all");
  const filtered = rows
    .filter(
      (row) =>
        (role === "all" || row.role === role) &&
        `${row.name} ${row.group_name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        String(a[sort.key] || "").localeCompare(
          String(b[sort.key] || ""),
          "en",
        ) * sort.direction,
    );
  function toggle(key) {
    setSort((current) => ({
      key,
      direction: current.key === key ? -current.direction : 1,
    }));
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Participants</h2>
          <p>
            {rows.filter((row) => row.role === "student").length} students ·{" "}
            {rows.filter((row) => row.role === "instructor").length} instructor
          </p>
        </div>
      </div>
      <div className="table-toolbar">
        <label>
          Search participants
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or group"
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th
                aria-sort={
                  sort.key === "first_name"
                    ? sort.direction === 1
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <button onClick={() => toggle("first_name")}>
                  First name ↕
                </button>
              </th>
              <th
                aria-sort={
                  sort.key === "last_name"
                    ? sort.direction === 1
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <button onClick={() => toggle("last_name")}>
                  Last name ↕
                </button>
              </th>
              <th>Role</th>
              <th>Group</th>
              <th>Last course access</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <span className="font-semibold">
                      {row.first_name || row.name}
                    </span>
                  </div>
                </td>
                <td>{row.last_name || "—"}</td>
                <td>
                  <span
                    className={`badge ${row.role === "instructor" ? "badge-purple" : "badge-blue"}`}
                  >
                    {roleLabel(row.role)}
                  </span>
                </td>
                <td>{row.group_name || "No group"}</td>
                <td className="text-gray-500">
                  {row.last_access_at
                    ? new Date(row.last_access_at).toLocaleString("en-GB")
                    : "Not accessed yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(loading || !filtered.length) && (
        <p className="empty-state">
          {loading ? "Loading participants…" : "No matching participants."}
        </p>
      )}
    </section>
  );
}
export function Courses({
  courses,
  user,
  selectedCourse,
  participants,
  loading,
  onOpen,
  onBack,
  instructors,
  onAssign,
  busy,
  rosterOnly = false,
  onCreate,
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  if (selectedCourse)
    return (
      <>
        <button
          className="mb-5 text-sm font-semibold text-blue-600"
          onClick={onBack}
        >
          ← Back to courses
        </button>
        <section className="course-banner">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              {selectedCourse.code} · {selectedCourse.category}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {selectedCourse.name}
            </h2>
            <p className="mt-3 text-sm text-blue-100">
              Instructor: {selectedCourse.instructor}
            </p>
          </div>
          <span className="rounded-xl bg-white/15 px-4 py-3 text-sm font-bold">
            {selectedCourse.enrolled} / {selectedCourse.capacity} students
          </span>
        </section>
        {user.role === "admin" && !rosterOnly && (
          <section className="panel mb-5">
            <form
              className="flex flex-wrap items-end gap-3 p-5"
              onSubmit={onAssign}
            >
              <label className="field">
                Assigned instructor
                <select
                  name="instructorId"
                  defaultValue={selectedCourse.instructor_user_id || ""}
                  required
                >
                  <option value="" disabled>
                    Select an instructor
                  </option>
                  {instructors.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary" disabled={busy}>
                Save assignment
              </button>
            </form>
          </section>
        )}
        <Participants rows={participants} loading={loading} />
      </>
    );
  const visible = courses.filter((course) =>
    `${course.code} ${course.name} ${course.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>
            {user.role === "student"
              ? "My courses"
              : user.role === "instructor"
                ? "Assigned courses"
                : rosterOnly
                  ? "Course rosters"
                  : "Courses & instructors"}
          </h2>
          <p>
            {user.role === "student"
              ? "Explore your enrolled courses and classmates."
              : user.role === "instructor"
                ? "Your teaching assignments and course participants."
                : "Manage the course catalog, instructors, and participants."}
          </p>
        </div>
        {user.role === "admin" && !rosterOnly ? (
          <button
            className="primary"
            disabled={busy}
            onClick={() => setCreating(!creating)}
          >
            {creating ? "Close form" : "Register course"}
          </button>
        ) : (
          <span className="badge badge-blue">{courses.length} courses</span>
        )}
      </div>
      {creating && !rosterOnly && (
        <form
          className="panel mb-6 p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            values.capacity = Number(values.capacity);
            values.instructorId = Number(values.instructorId);
            if (await onCreate(values)) setCreating(false);
          }}
        >
          <h3 className="mb-5 font-bold">Register course</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              Course code
              <input name="code" maxLength={20} required />
            </label>
            <label className="field">
              Course name
              <input name="name" maxLength={120} required />
            </label>
            <label className="field">
              Category
              <input name="category" maxLength={120} required />
            </label>
            <label className="field">
              Capacity
              <input
                type="number"
                name="capacity"
                min="1"
                max="1000"
                defaultValue="30"
                required
              />
            </label>
            <label className="field">
              Instructor
              <select name="instructorId" required defaultValue="">
                <option value="" disabled>
                  Select an instructor
                </option>
                {instructors.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary mt-5" disabled={busy}>
            Save course
          </button>
        </form>
      )}
      <label className="field mb-6 max-w-md">
        Search courses
        <input
          type="search"
          placeholder="Course name, code, or category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map((course, index) => (
          <article key={course.id} className="course-card">
            <div className={`course-cover cover-${index % 4}`}>
              <Icon name="courses" className="h-12 w-12 opacity-70" />
              <span className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold">
                {course.code}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {course.category}
              </p>
              <h3 className="mt-2 text-xl font-bold text-gray-800">
                {course.name}
              </h3>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                {course.instructor}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon name="users" />
                  {course.enrolled} students
                </span>
                <button
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
                  onClick={() => onOpen(course)}
                >
                  View course
                  <Icon name="arrow" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <p className="empty-state">No courses available.</p>}
    </>
  );
}
