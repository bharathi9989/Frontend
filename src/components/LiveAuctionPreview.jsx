import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function LiveAuctionsPreview() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auctions");
        const data = res.data || [];

        const now = new Date();

        // LIVE auctions
        const live = data.filter((a) => {
          const start = new Date(a.startAt);
          const end = new Date(a.endAt);
          return start <= now && now < end;
        });

        // UPCOMING auctions
        const upcoming = data.filter((a) => {
          const start = new Date(a.startAt);
          return start > now;
        });

        // Sort upcoming by soonest start time
        upcoming.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

        // TAKE TOP 6 ONLY (3 live + 3 upcoming or whatever available)
        const finalList = [...live, ...upcoming].slice(0, 6);

        setAuctions(finalList);
      } catch (err) {
        console.log("Auction preview load error:", err);
      }
    }

    load();
  }, []);

  // Nothing to show
  if (!auctions.length) return null;

  return (
    <div className="py-20 bg-gradient-to-b from-transparent to-[#120b25] text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-10 text-center">
          🔥 Live & Upcoming Auctions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((a) => {
            const now = new Date();
            const start = new Date(a.startAt);
            const end = new Date(a.endAt);

            const status =
              start > now ? "Upcoming" : now < end ? "Live" : "Ended";

            const color =
              status === "Live"
                ? "bg-green-600"
                : status === "Upcoming"
                ? "bg-yellow-500"
                : "bg-red-500";

            return (
              <div
                key={a._id}
                className="bg-white/10 backdrop-blur-xl p-5 border border-white/20 rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
              >
                {/* Image */}
                <div className="h-40 w-full rounded-lg overflow-hidden mb-3">
                  {a.product.images?.length ? (
                    <img
                      src={a.product.images[0]}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black/40 text-white/50">
                      No Image
                    </div>
                  )}
                </div>

                {/* Status */}
                <span className={`px-3 py-1 rounded-full text-sm ${color}`}>
                  {status}
                </span>

                <h3 className="text-lg font-bold mt-3">{a.product.title}</h3>

                <p className="text-sm text-white/70">
                  {status === "Upcoming"
                    ? `Starts: ${start.toLocaleString()}`
                    : `Ends: ${end.toLocaleString()}`}
                </p>

                <Link
                  to={`/auction/${a._id}`}
                  className="mt-4 block text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  View Auction
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
