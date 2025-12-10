// src/components/AuctionCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * AuctionCard
 * props:
 *  - auction {object}
 *  - showSeller (bool)
 *  - onClick (optional)
 */
export default function AuctionCard({ auction, showSeller = false }) {
  const product = auction.product || auction.productId || {};
  const [now, setNow] = useState(Date.now());

  // update now every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startAt = new Date(auction.startAt).getTime();
  const endAt = new Date(auction.endAt).getTime();

  const status = useMemo(() => {
    if (now < startAt) return "upcoming";
    if (now >= startAt && now < endAt) return "live";
    return "closed";
  }, [now, startAt, endAt]);

  const timeLeft = useMemo(() => {
    const target = status === "upcoming" ? startAt : endAt;
    const diff = target - now;
    if (diff <= 0) return "00:00:00";
    const sec = Math.floor(diff / 1000);
    const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [now, status, startAt, endAt]);

  // determine display price: show highest bid if exists (backend may include)
  const displayPrice = useMemo(() => {
    if (auction.currentPrice != null) return auction.currentPrice;
    // fallback to startPrice
    return auction.startPrice ?? 0;
  }, [auction]);

  const statusColor =
    status === "live"
      ? "bg-green-600"
      : status === "upcoming"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg hover:scale-[1.02] transition">
      <div className="h-48 w-full rounded-lg overflow-hidden bg-black/20">
        {product?.images?.length ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white/50">
            No Image
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {product?.title || "Untitled product"}
          </h3>
          <p className="text-sm text-white/70">{product?.category || "—"}</p>
          {showSeller && (
            <p className="text-xs text-white/50 mt-1">
              Seller: {auction.seller?.name || auction.seller?.email || "—"}
            </p>
          )}
        </div>

        <div className="text-right">
          <div
            className={`px-2 py-1 rounded-full text-xs text-white ${statusColor}`}
          >
            {status.toUpperCase()}
          </div>
          <div className="text-sm text-white/60 mt-2">
            Ends: {new Date(auction.endAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">Current</div>
          <div className="text-xl font-semibold">₹{displayPrice}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/60">
            Time {status === "upcoming" ? "to start" : "left"}
          </div>
          <div className="text-lg font-mono">{timeLeft}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/auction/${auction._id}`}
          className="flex-1 text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-medium"
        >
          View
        </Link>
        {status === "live" && (
          <Link
            to={`/auction/${auction._id}`}
            className="py-2 px-3 rounded-lg border border-white/10 text-white/90"
          >
            Bid
          </Link>
        )}
      </div>
    </div>
  );
}
