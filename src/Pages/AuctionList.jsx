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

  // Hook will attempt server-side query; fallback handled in hook
  const {
    auctions: remoteAuctions,
    total,
    loading,
    error,
    reload,
  } = useAuctions({
    page,
    limit,
    q: debouncedQ,
    filters: {
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
    },
    sort,
  });

  // debounce search
  useEffect(() => {
    const d = debounce((val) => setDebouncedQ(val), 450);
    d(q);
    return () => d.cancel();
  }, [q]);

  // client-side fallback: if server returns array without paging, we paginate locally
  const usingClientSide = useMemo(() => {
    // heuristic: if total equals remoteAuctions.length, server likely didn't provide total
    return total == null || total === remoteAuctions.length;
  }, [remoteAuctions, total]);

  // final list (if server-side paging then remoteAuctions already paged)
  const final = useMemo(() => {
    let list = Array.isArray(remoteAuctions) ? [...remoteAuctions] : [];

    // if remote gave full list (no server filtering on q), still apply client filters
    if (debouncedQ) {
      const lq = debouncedQ.toLowerCase();
      list = list.filter((a) =>
        (a.product?.title || a.productId?.title || "")
          .toLowerCase()
          .includes(lq)
      );
    }
    if (statusFilter !== "all") {
      const now = Date.now();
      list = list.filter((a) => {
        const s = new Date(a.startAt).getTime();
        const e = new Date(a.endAt).getTime();
        if (statusFilter === "live") return now >= s && now < e;
        if (statusFilter === "upcoming") return now < s;
        if (statusFilter === "closed") return now >= e;
        return true;
      });
    }
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
    if (categoryFilter !== "all")
      list = list.filter(
        (a) =>
          (a.product?.category || a.productId?.category || "").toLowerCase() ===
          categoryFilter.toLowerCase()
      );

    if (sort === "endingSoon")
      list.sort((x, y) => new Date(x.endAt) - new Date(y.endAt));
    else if (sort === "newest")
      list.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    else if (sort === "priceAsc")
      list.sort((x, y) => (x.startPrice || 0) - (y.startPrice || 0));
    else if (sort === "priceDesc")
      list.sort((x, y) => (y.startPrice || 0) - (x.startPrice || 0));

    return usingClientSide
      ? list.slice((page - 1) * limit, page * limit)
      : list;
  }, [
    remoteAuctions,
    debouncedQ,
    statusFilter,
    typeFilter,
    categoryFilter,
    sort,
    page,
    usingClientSide,
  ]);

  const computedTotal = usingClientSide
    ? Array.isArray(remoteAuctions)
      ? remoteAuctions.length
      : 0
    : total || (Array.isArray(remoteAuctions) ? remoteAuctions.length : 0);

  return (
    <div className="min-h-screen pt-28 bg-[#071023] text-white px-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">All Auctions</h1>

          <div className="flex gap-3 items-center">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product title..."
              className="bg-white/5 px-3 py-2 rounded-lg w-64 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="all">All status</option>
              <option value="live">Live</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="all">All types</option>
              <option value="traditional">Traditional</option>
              <option value="reverse">Reverse</option>
              <option value="sealed">Sealed</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 px-3 py-2 rounded-lg"
            >
              <option value="endingSoon">Ending soon</option>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: low → high</option>
              <option value="priceDesc">Price: high → low</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-white/3 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : final.length === 0 ? (
          <div className="p-12 text-center text-white/70">
            No auctions found.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {final.map((a) => (
                <AuctionCard key={a._id} auction={a} />
              ))}
            </div>

            <Pagination
              page={page}
              total={computedTotal}
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
