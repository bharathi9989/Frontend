// src/components/Pagination.jsx
import React from "react";

export default function Pagination({ page, total, limit, onChange }) {
  if (!total) return null;
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const arr = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2 justify-center mt-6">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 rounded bg-white/5 disabled:opacity-40"
      >
        Prev
      </button>
      {arr.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded ${
            p === page ? "bg-blue-600" : "bg-white/5"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 rounded bg-white/5 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
