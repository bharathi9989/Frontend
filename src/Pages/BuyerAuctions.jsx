// src/Pages/BuyerAuctions.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function BuyerAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 6;

  const loadAuctions = async () => {
    try {
      const res = await api.get("/auctions", {
        params: {
          status: status === "all" ? "" : status,
          category,
          sort,
          page,
          limit,
        },
      });

      setAuctions(res.data.auctions);
      setTotalPages(res.data.pages);

      // collect category list from products
      const cats = [
        ...new Set(res.data.auctions.map((a) => a.product?.category)),
      ].filter(Boolean);
      setCategories(cats);
    } catch (err) {
      console.log("Error loading auctions", err);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, [status, category, sort, page]);

  // status badge
  const getStatus = (a) => {
    const now = new Date();
    if (now < new Date(a.startAt)) return "upcoming";
    if (now > new Date(a.endAt)) return "ended";
    return "live";
  };

  const badgeColor = {
    live: "bg-green-500",
    upcoming: "bg-yellow-500",
    ended: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2735] to-[#090a0f] pt-32 px-6 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">
        🔥 Auction Marketplace
      </h1>

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-10 bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Status Filter */}
          <select
            className="p-3 bg-white/10 rounded-lg border border-white/20"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Auctions</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>

          {/* Category Filter */}
          <select
            className="p-3 bg-white/10 rounded-lg border border-white/20"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="p-3 bg-white/10 rounded-lg border border-white/20"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_high">Price High → Low</option>
            <option value="price_low">Price Low → High</option>
            <option value="ending_soon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Auction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {auctions.map((a) => {
          const state = getStatus(a);
          return (
            <div
              key={a._id}
              className="bg-white/10 border border-white/10 rounded-2xl shadow-xl backdrop-blur-lg overflow-hidden hover:scale-105 transition duration-300"
            >
              {/* Image */}
              <div className="h-48 w-full overflow-hidden">
                {a.product?.images?.length ? (
                  <img
                    src={a.product.images[0]}
                    className="h-full w-full object-cover"
                    alt="product"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${badgeColor[state]}`}
                >
                  {state.toUpperCase()}
                </span>

                <h2 className="text-xl font-semibold mt-3">
                  {a.product?.title}
                </h2>

                <div className="mt-3 text-white/70 text-sm">
                  <p>Start Price: ₹{a.startPrice}</p>
                  <p>Increment: ₹{a.minIncrement}</p>
                </div>

                <Link
                  to={`/auction/${a._id}`}
                  className="block mt-4 text-center bg-blue-600 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View Auction
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-12">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`px-4 py-2 rounded-lg ${
              page === i + 1 ? "bg-blue-600" : "bg-white/10"
            }`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
