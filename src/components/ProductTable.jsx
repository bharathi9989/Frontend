import React from "react";

/**
 * Desktop table view with Edit/Delete controls
 */
export default function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto bg-white/5 rounded-xl p-2">
      <table className="min-w-full text-left">
        <thead>
          <tr className="text-sm text-white/70">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t border-white/5">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 bg-gray-100 rounded overflow-hidden">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="object-cover h-full w-full"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{p.title}</div>
                    <div className="text-xs text-white/60">
                      {p.description?.slice(0, 60)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-white/80">{p.category}</td>
              <td className="px-4 py-3 text-white/80">{p.inventoryCount}</td>
              <td className="px-4 py-3 text-white/60">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="px-3 py-1 bg-yellow-400 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
