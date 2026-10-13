import React from "react";
import { Icon } from "../components/UI";
export default function Notifications({ rows, onRead, busy }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Notifications</h2>
          <p>Enrollment updates for your account and courses.</p>
        </div>
        <span className="badge badge-blue">
          {rows.filter((row) => !row.read_at).length} unread
        </span>
      </div>
      <section className="panel divide-y divide-gray-100">
        {rows.map((row) => (
          <article
            key={row.id}
            className={`flex items-start gap-4 p-5 ${!row.read_at ? "bg-blue-50/40" : ""}`}
          >
            <span className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Icon name="notifications" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-6 text-gray-800">
                {row.message}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(row.created_at).toLocaleString("en-GB")}
              </p>
              {!row.read_at && (
                <button
                  className="mt-3 text-xs font-bold text-blue-600"
                  disabled={busy}
                  onClick={() => onRead(row.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
            {!row.read_at && (
              <span
                aria-label="Unread"
                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"
              />
            )}
          </article>
        ))}
        {!rows.length && (
          <div className="empty-state py-14">
            <Icon
              name="notifications"
              className="mx-auto mb-4 h-10 w-10 text-gray-300"
            />
            <h3 className="font-semibold text-gray-600">
              No notifications yet
            </h3>
            <p className="mt-2">New enrollments will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}
