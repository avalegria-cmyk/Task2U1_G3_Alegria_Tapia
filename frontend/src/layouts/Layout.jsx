import React, { useState } from "react";
import { Icon, roleLabel } from "../components/UI";
export function Layout({
  user,
  module,
  onNavigate,
  unread,
  busy,
  onLogout,
  onRefresh,
  children,
}) {
  const [open, setOpen] = useState(false);
  const modules =
    user.role === "admin"
      ? [
          ["dashboard", "Dashboard"],
          ["enrollment", "Enrollments"],
          ["rosters", "Course rosters"],
          ["students", "Students"],
          ["courses", "Courses & instructors"],
          ["reports", "Reports"],
          ["notifications", "Notifications"],
        ]
      : [
          ["courses", "Courses"],
          ["notifications", "Notifications"],
        ];
  const active = modules.find(([id]) => id === module)?.[1] || "Dashboard";
  return (
    <div className="app-shell">
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">
            <Icon name="courses" />
          </span>
          <div>
            <strong>UNIVERSITY</strong>
            <small>Academic portal</small>
          </div>
          <button
            className="ml-auto md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Main modules" className="flex-1 space-y-2 px-4 py-7">
          <p className="mb-4 px-4 text-[11px] font-bold tracking-widest text-gray-500">
            {user.role === "admin"
              ? "ADMINISTRATION"
              : user.role === "instructor"
                ? "TEACHING"
                : "STUDENT PORTAL"}
          </p>
          {modules.map(([id, label]) => (
            <button
              key={id}
              aria-current={module === id ? "page" : undefined}
              className={`nav-link ${module === id ? "active" : ""}`}
              onClick={() => {
                onNavigate(id);
                setOpen(false);
              }}
            >
              <Icon name={id} />
              <span>{label}</span>
              {id === "notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <p className="text-xs text-gray-400">Current user</p>
          <p className="mt-2 break-words text-sm font-semibold text-blue-300">
            {user.name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">
            {roleLabel(user.role)}
          </p>
          <button
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            disabled={busy}
            onClick={onLogout}
          >
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="icon-button md:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{active}</h1>
              <p className="text-xs text-gray-500">University / {active}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="icon-button"
              aria-label="Refresh data"
              disabled={busy}
              onClick={onRefresh}
            >
              <Icon name="refresh" />
            </button>
            <span className="hidden rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 sm:inline">
              {roleLabel(user.role)}
            </span>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="px-6 pb-5 text-xs text-gray-400">
          University Academic Portal · Software Architecture
        </footer>
      </div>
    </div>
  );
}
