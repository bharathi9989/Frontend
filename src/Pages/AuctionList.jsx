// src/pages/AuctionList.jsx
import React, { useEffect, useMemo, useState } from "react";
import useAuctions from "../hooks/useAuctions";
import AuctionCard from "../components/AuctionCard";
import Pagination from "../components/Pagination";
import debounce from "lodash.debounce";

export default function AuctionList() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("endingSoon");
  const [page, setPage] = useState(1);
  const limit = 9;

  // Debouncing Search Input
  useEffect(() => {
    const d = debounce((v) => setDebouncedQ(v), 400);
    d(q);
    return () => d.cancel();
  }, [q]);

  // Backend-powered auctions
  const { auctions, total, loading, error, reload } = useAuctions({
    page,
    limit,
    q: debouncedQ,
    filters: {
      status: statusFilter !== "all" ? statusFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
    },
    sort,
  });

  return (
    <div className="min-h-screen pt-28 bg-[#071023] text-white px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER / FILTERS */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>

          <div className="flex flex-wrap gap-3 items-center">
            {/* SEARCH */}
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className="bg-white/5 px-3 py-2 rounded-lg w-64 outline-none"
            />

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>

            {/* TYPE */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="traditional">Traditional</option>
              <option value="reverse">Reverse</option>
              <option value="sealed">Sealed</option>
            </select>

            {/* SORT */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="endingSoon">Ending Soon</option>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
            </select>
          </div>
        </header>

        {/* BODY */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-white/5 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="p-12 text-center text-white/60">
            No auctions found
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>

            {/* PAGINATION */}
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
