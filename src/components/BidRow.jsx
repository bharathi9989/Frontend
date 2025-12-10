// src/components/BidRow.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function BidRow({ bid }) {
  const auction = bid.auction || {};
  const product = auction.product || {};
  const outcome = bid.outcome; // "won" | "lost" | "pending"

  const outcomeColor =
    outcome === "won"
      ? "bg-green-600"
      : outcome === "lost"
      ? "bg-red-600"
      : "bg-yellow-500";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
      <div className="w-28 h-20 rounded overflow-hidden bg-black/20 flex items-center justify-center">
        {product.images?.length ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/60 text-sm">No Image</div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">
          {product.title || "Unknown product"}
        </h3>
        <p className="text-sm text-white/70">{product.category || ""}</p>

        <div className="mt-2 flex flex-wrap gap-3 items-center">
          <div className="text-white/90">
            Bid: <span className="font-bold">₹{bid.amount}</span>
          </div>
          <div className="text-white/60 text-sm">
            Placed: {new Date(bid.createdAt).toLocaleString()}
          </div>
          <div
            className={`${outcomeColor} text-black px-2 py-1 rounded-full text-sm`}
          >
            {outcome.toUpperCase()}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            to={`/auction/${auction._id}`}
            className="px-3 py-1 bg-blue-600 rounded text-white text-sm"
          >
            Open Auction
          </Link>
        </div>
      </div>
    </div>
  );
}
