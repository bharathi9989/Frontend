import React from "react";
import useAuctions from "../hooks/useAuction";
import { Link } from "react-router-dom";

export default function AuctionListing() {
  const { auctions, loading } = useAuctions();

  // Function to check status
  const getStatus = (auction) => {
    const now = new Date();
    const start = new Date(auction.startAt);
    const end = new Date(auction.endAt);

    if (now < start) return { label: "Upcoming", color: "bg-yellow-500" };
    if (now > end) return { label: "Ended", color: "bg-red-500" };
    return { label: "Live", color: "bg-green-500" };
  };

  if (loading)
    return <h1 className="text-center text-white text-3xl mt-20">Loading…</h1>;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1f1c2c] to-[#928DAB]">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-4xl font-bold text-white mb-8">🔥 Live Auctions</h1>

        {/* If no auctions */}
        {auctions.length === 0 && (
          <p className="text-white text-xl">No auctions found</p>
        )}

        {/* Grid of auctions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((auction) => {
            const status = getStatus(auction);

            return (
              <div
                key={auction._id}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden animate-fadeIn"
              >
                {/* Image */}
                <div className="h-48 w-full overflow-hidden">
                  {auction.productId?.images?.length ? (
                    <img
                      src={auction.productId.images[0]}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black/30 text-white/60">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-5 text-white">
                  {/* Status */}
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>

                  {/* Title */}
                  <h2 className="text-xl font-bold mt-3">
                    {auction.productId?.title}
                  </h2>

                  <p className="text-sm text-white/70 mt-1">
                    {auction.type.toUpperCase()} Auction
                  </p>

                  <p className="text-sm mt-3">
                    Start Price:{" "}
                    <b className="text-green-300">₹{auction.startPrice}</b>
                  </p>

                  <p className="text-sm">
                    Min Increment:{" "}
                    <b className="text-blue-300">₹{auction.minIncrement}</b>
                  </p>

                  {/* Open Auction Button */}
                  <Link
                    to={`/auction/${auction._id}`}
                    className="mt-4 block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-lg"
                  >
                    View Auction
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
