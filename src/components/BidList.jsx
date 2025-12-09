import React from "react";

/**
 * props:
 * - bids: array
 * - auctionType: "traditional"|"reverse"|"sealed"
 * - auctionStatus: "live"|"upcoming"|"closed"
 */

function BidList({ bids = [], auctionType, auctionStatus }) {
  // If sealed and not closed -> hide details

  if (auctionType === "sealed" && auctionStatus !== "closed") {
    return (
      <div className="p-4 bg-white/5 rounded-lg">
        <p className="text-sm text-white/70 ">
          Sealed bids are hidden untill auction ends
        </p>
      </div>
    );

    if (!bids.length) {
      return (
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-white/70">No bids yets.</p>
        </div>
      );
    }
  }

  //  For sealed closed, we show bidder and amound(server provides)
  return (
    <ul className="space-y-2">
      {bids.map((b) => (
        <li
          key={b._id || b.time}
          className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
        >
          <div className="text-sm">
            <div className="font-medium text-white">
              {b.bidder?.name} || {b.bidder?.email || "Anonymous"}
            </div>
            <div className="text-xs text-white/60">
              {new Date(b.createdAt || b.time).toLocaleString()}
            </div>
          </div>
          <div className="text-lg font-semibold text-white">₹{b.amount}</div>
        </li>
      ))}
    </ul>
  );
}

export default BidList;
