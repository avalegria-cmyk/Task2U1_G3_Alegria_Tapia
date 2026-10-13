import React, { useState } from "react";
export default function Enrollment({
  courses,
  students,
  enrollments,
  onEnroll,
  busy,
  registering,
  onRegister,
  onCancel,
}) {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const student = students.find((row) => String(row.id) === studentId);
  const course = courses.find((row) => String(row.id) === courseId);
  const duplicate = enrollments.some(
    (row) =>
      String(row.student_id) === studentId &&
      String(row.course_id) === courseId,
  );
  const full = course && course.enrolled >= course.capacity;
  const visible = enrollments.filter(
    (row) =>
      (!courseFilter || String(row.course_id) === courseFilter) &&
      `${row.student} ${row.course}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (registering)
    return (
      <>
        <button
          className="mb-5 text-sm font-semibold text-blue-600"
          disabled={busy}
          onClick={onCancel}
        >
          ← Back to enrollments
        </button>
        <div className="page-intro">
          <div>
            <h2>Register enrollment</h2>
            <p>
              Select a student and a course to create an academic enrollment.
            </p>
          </div>
        </div>
        <form
          className="panel max-w-3xl"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await onEnroll(Number(courseId), Number(studentId))) {
              setStudentId("");
              setCourseId("");
            }
          }}
        >
          <div className="panel-heading">
            <h2>Enrollment details</h2>
            <p>
              All fields are required. Existing enrollments and course capacity
              are checked before registration.
            </p>
          </div>
          <div className="space-y-6 p-6">
            <label className="field">
              Student
              <select
                required
                value={studentId}
                disabled={busy}
                onChange={(event) => setStudentId(event.target.value)}
              >
                <option value="">Select a student</option>
                {students.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                    {row.campus_id ? ` · ${row.campus_id}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Course
              <select
                required
                value={courseId}
                disabled={busy}
                onChange={(event) => setCourseId(event.target.value)}
              >
                <option value="">Select a course</option>
                {courses.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code ? `${row.code} — ` : ""}
                    {row.name} · {row.capacity - row.enrolled} seats available
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7">
              <h3 className="mb-2 font-bold text-blue-900">
                Enrollment summary
              </h3>
              <p>
                <strong>Student:</strong> {student?.name || "Not selected"}
              </p>
              <p>
                <strong>Course:</strong> {course?.name || "Not selected"}
              </p>
              <p>
                <strong>Instructor:</strong> {course?.instructor || "—"}
              </p>
              <p>
                <strong>Group:</strong> {student?.default_group || "No group"}
              </p>
            </div>
            {duplicate && (
              <p role="alert" className="text-sm text-red-600">
                This student is already enrolled in the selected course.
              </p>
            )}
            {!duplicate && full && (
              <p role="alert" className="text-sm text-red-600">
                This course has no available seats.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={busy || !student || !course || duplicate || full}
            >
              {busy ? "Registering…" : "Register enrollment"}
            </button>
          </div>
        </form>
      </>
    );
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Enrollments</h2>
          <p>Manage student registrations and review the enrollment record.</p>
        </div>
        <button className="primary" onClick={onRegister} disabled={busy}>
          Register enrollment
        </button>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <label>
            Search enrollments
            <input
              type="search"
              placeholder="Student or course name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Course filter
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.code} — {row.name}
                </option>
              ))}
            </select>
          </label>
          <span className="badge badge-blue">{visible.length} enrollments</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Enrollment ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Group</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold text-blue-600">
                    ENR-{String(row.id).padStart(5, "0")}
                  </td>
                  <td className="font-semibold">{row.student}</td>
                  <td>{row.course}</td>
                  <td>{row.group_name || "No group"}</td>
                  <td>
                    <span className="badge badge-green">Enrolled</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <p className="empty-state">No enrollments match your search.</p>
        )}
      </section>
    </>
  );
}
