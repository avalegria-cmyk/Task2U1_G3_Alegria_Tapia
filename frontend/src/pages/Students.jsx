import React, { useState } from "react";
import { Avatar } from "../components/UI";
export default function Students({ students, busy, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const rows = students.filter((row) =>
    `${row.name} ${row.campus_id || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Students</h2>
          <p>Browse and register student academic records.</p>
        </div>
        <button
          className="primary"
          disabled={busy}
          onClick={() => setCreating(!creating)}
        >
          {creating ? "Close form" : "Register student"}
        </button>
      </div>
      {creating && (
        <form
          className="panel mb-6 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const values = Object.fromEntries(new FormData(form));
            values.semester = Number(values.semester);
            if (await onCreate(values)) {
              setCreating(false);
            }
          }}
        >
          <h3 className="mb-5 font-bold">Register student</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              First name
              <input name="firstName" maxLength={60} required />
            </label>
            <label className="field">
              Last name
              <input name="lastName" maxLength={59} required />
            </label>
            <label className="field">
              Major
              <input
                name="major"
                maxLength={120}
                required
                defaultValue="Software Engineering"
              />
            </label>
            <label className="field">
              Semester
              <input
                type="number"
                name="semester"
                min="1"
                max="12"
                required
                defaultValue="8"
              />
            </label>
            <label className="field">
              Group
              <input name="group" maxLength={30} placeholder="Group 1" />
            </label>
          </div>
          <p className="my-4 text-xs text-gray-500">
            This creates an academic record for enrollment. It does not create a
            sign-in account.
          </p>
          <button className="primary" disabled={busy}>
            Save student
          </button>
        </form>
      )}
      <section className="panel">
        <div className="table-toolbar">
          <label>
            Search students
            <input
              type="search"
              placeholder="Name or campus ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <span className="badge badge-blue">{rows.length} students</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Campus ID</th>
                <th>Major</th>
                <th>Semester</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <Avatar name={row.name} />
                      <strong>{row.name}</strong>
                    </span>
                  </td>
                  <td>{row.campus_id || "—"}</td>
                  <td>{row.major}</td>
                  <td>{row.semester}</td>
                  <td>{row.default_group || "No group"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="empty-state">No matching students.</p>}
      </section>
    </>
  );
}
