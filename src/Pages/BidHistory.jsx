// src/pages/BidHistory.jsx
import React from "react";
import BidRow from "../components/BidRow";
import useBids from "../hooks/UseBids";

export default function BidHistory() {
  const { bids, loading, error, pageInfo, reload } = useBids({
    page: 1,
    limit: 30,
  });

  if (loading) return <div className="p-6 text-white">Loading your bids…</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load bids</div>;

  return (
    <div className="min-h-screen pt-28 px-6 bg-linear-to-br from-[#0f1724] to-[#0b1220] text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Bids</h1>

        {bids.length === 0 ? (
          <div className="p-6 bg-white/5 rounded">
            You haven't placed any bids yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {bids.map((b) => (
              <BidRow key={b._id} bid={b} />
            ))}
          </div>
        )}

        {/* Pagination stub - show page info and reload button */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-white/70">
            Total: {pageInfo.total} • Page: {pageInfo.page}/
            {pageInfo.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reload(Math.max(1, (pageInfo.page || 1) - 1))}
              className="px-3 py-1 bg-white/10 rounded"
            >
              Prev
            </button>
            <button
              onClick={() => reload((pageInfo.page || 1) + 1)}
              className="px-3 py-1 bg-white/10 rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
