import React from "react";
export function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    reports: "M4 3v17h17M7 14l4-5 4 3 5-7",
    students:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 3a4 4 0 0 1 0 8",
    rosters: "M4 3h16v18H4zM8 8h8M8 12h8M8 16h5",

    courses:
      "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3V4Z",
    notifications: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    enrollment:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M17 11h6",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 6l12 12M6 18 18 6",
    logout: "M9 4H4v16h5M14 8l4 4-4 4M8 12h12",
    refresh: "M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14 0M19 17a8 8 0 0 1-14 0",
    arrow: "M4 12h16M14 6l6 6-6 6",
    check: "m5 12 4 4L19 6",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4",
  };
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.courses} />
    </svg>
  );
}
export const roleLabel = (role) =>
  ({ admin: "Administrator", instructor: "Instructor", student: "Student" })[
    role
  ] || role;
export function Avatar({ name }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")}
    </span>
  );
}
