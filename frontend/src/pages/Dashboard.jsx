import React from "react";
import { Icon } from "../components/UI";
export default function Dashboard({ data, user, onNavigate, onRegister }) {
  const cards = [
    ["students", "Students", data.students.length, "Academic records", "users"],
    [
      "courses",
      "Active courses",
      data.courses.length,
      "Available courses",
      "courses",
    ],
    [
      "enrollment",
      "Enrollments",
      data.enrollments.length,
      "Registered enrollments",
      "enrollment",
    ],
    [
      "notifications",
      "Notifications",
      data.notifications.length,
      "Recent notices",
      "notifications",
    ],
  ];
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="!mb-2 !text-blue-600">
            Hello, {user.first_name || user.name}
          </p>
          <h2>Dashboard</h2>
          <p>Your academic activity at a glance.</p>
        </div>
        <button className="primary" onClick={onRegister}>
          Register enrollment
        </button>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([id, label, count, description, icon]) => (
          <button
            key={id}
            className="panel flex items-start gap-4 p-6 text-left hover:border-blue-300"
            onClick={() => onNavigate(id)}
          >
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Icon name={icon} />
            </span>
            <span>
              <span className="text-xs text-gray-500">{label}</span>
              <strong className="my-2 block text-3xl text-gray-800">
                {count}
              </strong>
              <span className="text-xs text-gray-400">{description}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {[
          [
            "enrollment",
            "Enrollments",
            data.enrollments.length,
            "Managed registrations",
            "from-indigo-500 to-indigo-700",
          ],
          [
            "students",
            "Students",
            data.students.length,
            "Academic directory",
            "from-fuchsia-500 to-purple-700",
          ],
          [
            "courses",
            "Courses",
            data.courses.length,
            "Courses and assignments",
            "from-blue-500 to-blue-700",
          ],
        ].map(([id, label, count, caption, color]) => (
          <button
            key={id}
            className={`rounded-2xl bg-gradient-to-br ${color} p-6 text-left text-white shadow-md`}
            onClick={() => onNavigate(id)}
          >
            <div className="flex justify-between">
              <Icon name={id === "students" ? "users" : id} />
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase">
                {label}
              </span>
            </div>
            <strong className="mt-6 block text-3xl">{count}</strong>
            <p className="mt-2 text-sm text-white/85">{caption}</p>
          </button>
        ))}
      </div>
      <section className="panel p-6">
        <h3 className="font-bold text-gray-800">Quick access</h3>
        <p className="mt-2 text-sm text-gray-500">
          Open a module to continue managing academic records.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["students", "Students", "Browse the directory"],
            ["courses", "Courses & instructors", "Manage teaching assignments"],
            ["enrollment", "Enrollments", "Register students"],
            ["reports", "Reports", "Review academic summaries"],
          ].map(([id, label, caption]) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="rounded-xl border border-gray-200 p-4 text-left hover:bg-blue-50"
            >
              <strong className="block text-sm">{label}</strong>
              <span className="mt-1 block text-xs text-gray-500">
                {caption}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
