// src/components/SellerAuctionRow.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SellerAuctionRow({
  auction,
  onEdit,
  onCloseNow,
  onDelete,
}) {
  const { _id, product, startAt, endAt, status, startPrice, minIncrement } =
    auction;

  const start = new Date(startAt).toLocaleString();
  const end = new Date(endAt).toLocaleString();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start">
      <div className="w-36 h-28 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
        {product?.images?.length ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/50">No Image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{product?.title || "—"}</h3>
            <p className="text-sm text-white/70">{product?.category}</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-white/60">{status?.toUpperCase()}</div>
            <div className="text-sm text-white/70">Start: {start}</div>
            <div className="text-sm text-white/70">End: {end}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-white/70">
            Start Price: <b className="text-green-300">₹{startPrice}</b> • Min
            Increment: <b>₹{minIncrement}</b>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/auction/${_id}`}
              className="px-3 py-1 bg-blue-600 rounded text-white text-sm"
            >
              View
            </Link>

            <button
              onClick={() => onEdit(auction)}
              className="px-3 py-1 bg-yellow-500 rounded text-black text-sm"
            >
              Edit
            </button>

            {status !== "closed" && (
              <button
                onClick={() => onCloseNow(_id)}
                className="px-3 py-1 bg-red-500 rounded text-white text-sm"
              >
                Close Now
              </button>
            )}

            <button
              onClick={() => onDelete(_id)}
              className="px-3 py-1 bg-gray-600 rounded text-white text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
