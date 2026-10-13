import React from "react";
export default function Reports({ courses, students, enrollments }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Reports</h2>
          <p>
            Enrollment totals and course capacity from current academic records.
          </p>
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Students", students.length],
          ["Courses", courses.length],
          ["Enrollments", enrollments.length],
        ].map(([label, count]) => (
          <div key={label} className="panel p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <strong className="mt-2 block text-3xl text-gray-800">
              {count}
            </strong>
          </div>
        ))}
      </div>
      <section className="panel mb-6">
        <div className="panel-heading">
          <h2>Course occupancy</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th>Enrolled</th>
                <th>Capacity</th>
                <th>Available seats</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.code} — {row.name}
                  </td>
                  <td>{row.instructor}</td>
                  <td>{row.enrolled}</td>
                  <td>{row.capacity}</td>
                  <td>{row.capacity - row.enrolled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Student enrollment summary</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrolled courses</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const rows = enrollments.filter(
                  (row) => row.student_id === student.id,
                );
                return (
                  <tr key={student.id}>
                    <td className="font-semibold">{student.name}</td>
                    <td>
                      {rows.map((row) => row.course).join(", ") ||
                        "Not enrolled"}
                    </td>
                    <td>{rows.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
