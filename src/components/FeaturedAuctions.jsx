import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function FeaturedAuctions() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auctions"); // Public route OK

        // ✅ Always extract auction array safely
        let list = Array.isArray(res.data) ? res.data : res.data.auctions || [];

        console.log("Fetched Auctions:", list); // Debug

        // Filter only LIVE + UPCOMING
        list = list.filter(
          (a) => a.status === "live" || a.status === "upcoming"
        );

        // Shuffle
        list = list.sort(() => Math.random() - 0.5);

        // Take only 3
        list = list.slice(0, 3);

        setAuctions(list);
      } catch (err) {
        console.log("Featured auctions error:", err);
      }
    }
    load();
  }, []);

  if (!auctions.length)
    return (
      <div className="text-center text-white/70 py-10">
        No Featured Auctions
      </div>
    );

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <h2 className="text-5xl font-extrabold text-center mb-16 tracking-tight">
        Featured <span className="text-yellow-300">Auctions</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-10">
        {auctions.map((auction) => (
          <Link
            key={auction._id}
            to={`/auction/${auction._id}`}
            className="group bg-white/5 border border-white/10 rounded-2xl p-6 
                       backdrop-blur-xl shadow-xl overflow-hidden transition-all 
                       hover:-translate-y-3 hover:shadow-2xl"
          >
            {/* IMAGE */}
            <div className="h-48 rounded-xl overflow-hidden mb-5 bg-black/20">
              {auction.product?.images?.length ? (
                <img
                  src={auction.product.images[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  No Image
                </div>
              )}
            </div>

            {/* TITLE */}
            <h3 className="text-2xl font-bold">{auction.product?.title}</h3>
            <p className="text-white/70 mt-1">{auction.product?.category}</p>

            {/* PRICE */}
            <p className="mt-3 text-lg">
              Start Price:
              <span className="text-green-300 font-semibold">
                {" "}
                ₹{auction.startPrice}
              </span>
            </p>

            {/* STATUS TAG */}
            <span
              className={`inline-block mt-4 px-3 py-1 rounded-full text-sm ${
                auction.status === "live"
                  ? "bg-green-600/70"
                  : "bg-yellow-500/70"
              }`}
            >
              {auction.status.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
