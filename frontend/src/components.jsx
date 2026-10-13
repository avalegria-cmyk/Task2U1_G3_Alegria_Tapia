import React from "react";
export function Field({ label, ...props }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-600">
      {label}
      <input
        required
        {...props}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
      />
    </label>
  );
}
export function Table({ columns, rows, empty = "No records yet." }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th
                key={key}
                className="border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-wider text-slate-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 last:border-0"
            >
              {columns.map(([key]) => (
                <td key={key} className="px-4 py-4">
                  {Array.isArray(row[key])
                    ? row[key].join(", ") || "None"
                    : row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-6 text-sm text-slate-500">{empty}</p>}
    </div>
  );
}
export function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
