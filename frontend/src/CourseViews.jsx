import React, { useEffect, useState } from "react";
import { request } from "./api";
import { Field, Panel, Table } from "./components";

export function MyCourses({ courses, role, onOpenRoster }) {
  return (
    <Panel
      title={role === "instructor" ? "Assigned courses" : "My enrolled courses"}
    >
      <p className="mb-5 text-sm text-slate-500">
        {role === "instructor"
          ? "Your teaching assignments and enrolled students."
          : "The courses you are enrolled in. Open a course to see your classmates."}
      </p>
      {courses.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-5 text-slate-500">
          {role === "instructor"
            ? "No courses have been assigned to you yet."
            : "You are not enrolled in any courses yet."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col items-start rounded-xl border border-slate-200 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Course #{course.id}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{course.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Instructor: {course.instructor}
              </p>
              <p className="mt-1 mb-5 text-sm text-slate-500">
                {course.enrolled} enrolled · {course.capacity} seats
              </p>
              <button
                className="primary mt-auto"
                onClick={() => onOpenRoster(course.id)}
              >
                View enrolled students
              </button>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function CourseRoster({ courses, courseId, onSelectCourse, onError }) {
  const [result, setResult] = useState({ courseId: "", rows: [], error: "" });
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const selected = courses.find(
    (course) => String(course.id) === String(courseId),
  );
  useEffect(() => {
    let active = true;
    setSearch("");
    setResult({ courseId: "", rows: [], error: "" });
    if (selected)
      request(`/courses/${selected.id}/students`)
        .then((rows) => {
          if (active)
            setResult({ courseId: String(selected.id), rows, error: "" });
        })
        .catch((error) => {
          if (active) {
            setResult({
              courseId: String(selected.id),
              rows: [],
              error: error.message,
            });
            if (error.status === 401) onError(error);
          }
        });
    return () => {
      active = false;
    };
  }, [selected?.id, revision]);
  const ready = result.courseId === String(courseId);
  return (
    <Panel title="Enrolled students">
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <label className="select-label min-w-56">
          Course
          <select
            value={courseId}
            onChange={(event) => onSelectCourse(event.target.value)}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!selected || !ready}
          onClick={() => setRevision((value) => value + 1)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Refresh roster
        </button>
      </div>
      {!selected ? (
        <p className="p-4 text-slate-500">
          {courses.length
            ? "Select a course to view its enrolled students."
            : "No courses are available for your account."}
        </p>
      ) : !ready ? (
        <p role="status" className="p-4 text-slate-500">
          Loading enrolled students…
        </p>
      ) : result.error ? (
        <p role="alert" className="p-4 text-red-700">
          {result.error}
        </p>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="font-semibold">{selected.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {result.rows.length} enrolled students · Instructor:{" "}
              {selected.instructor}
            </p>
          </div>
          <div className="mb-4">
            <Field
              label="Search enrolled students"
              type="search"
              required={false}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table
            rows={result.rows.filter((row) =>
              `${row.name} ${row.major}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            columns={[
              ["id", "Student ID"],
              ["name", "Student"],
              ["major", "Major"],
              ["semester", "Semester"],
            ]}
            empty={
              result.rows.length
                ? "No matching students."
                : "No students are enrolled in this course yet."
            }
          />
        </>
      )}
    </Panel>
  );
}

export function InstructorAssignment({ courses, instructors, busy, onAssign }) {
  return (
    <Panel title="Assign an instructor">
      <form className="form-grid" onSubmit={onAssign}>
        <label className="select-label">
          Course
          <select name="courseId" required defaultValue="">
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="select-label">
          Instructor account
          <select name="instructorId" required defaultValue="">
            <option value="" disabled>
              Select an instructor
            </option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary" disabled={busy || !instructors.length}>
          {busy ? "Saving…" : "Assign instructor"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        The assigned instructor can view this course and its enrolled students.
      </p>
    </Panel>
  );
}
