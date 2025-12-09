// src/pages/AuctionDetails.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";
import BidList from "../components/BidList";
import BidForm from "../components/BidForm";

export default function AuctionDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // compute min required bid (client hint only)
  const computeMinRequired = () => {
    if (!auction) return null;
    // find last bid
    if (auction.type === "reverse") {
      // lowest wins -> minRequired is current lowest - increment
      if (bids.length === 0) return auction.startPrice;
      const lowest = Math.min(...bids.map((b) => Number(b.amount)));
      return lowest - (auction.minIncrement || 0);
    } else {
      // traditional/sealed: highest + increment
      if (bids.length === 0) return auction.startPrice;
      const highest = Math.max(...bids.map((b) => Number(b.amount)));
      return highest + (auction.minIncrement || 0);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get(`/auctions/${id}`);
        // res.data => { auction, bids } as per backend controller
        const payload = res.data;
        // backend sometimes returns auction object or wrapper
        const a = payload.auction || payload;
        const bs = payload.bids || payload.bids || [];
        if (!mounted) return;
        setAuction(a);
        setBids(bs);
      } catch (err) {
        console.error("Failed to load auction", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // socket init and listeners
  useEffect(() => {
    initSocket(); // ensure socket connected
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket) return;

    // join room
    socket.emit("joinAuction", id);

    // newBid handler -> push to top of list
    const onNewBid = (payload) => {
      if (payload.auctionId !== id) return;
      // convert payload shape to match Bid schema expected
      setBids((prev) => {
        // avoid duplicates (when optimistic)
        const exists = prev.find(
          (p) =>
            (p._id && p._id.toString()) ===
            (payload.bid?._id?.toString() || payload.bidId)
        );
        if (exists) return prev;
        // payload may contain amount & bidder & time
        const item = payload.bid || {
          _id:
            payload.bid?._id ||
            payload.time ||
            Math.random().toString(36).slice(2),
          amount: payload.amount,
          bidder: payload.bidder,
          createdAt: payload.time,
        };
        return [item, ...prev];
      });
    };

    const onAuctionClosed = (payload) => {
      if (payload.auctionId !== id) return;
      setAuction((a) => (a ? { ...a, status: "closed" } : a));
    };

    socket.on("newBid", onNewBid);
    socket.on("auctionClosed", onAuctionClosed);

    return () => {
      socket.emit("leaveAuction", id);
      socket.off("newBid", onNewBid);
      socket.off("auctionClosed", onAuctionClosed);
    };
  }, [id]);

  const placeBid = async (amount) => {
    if (!user) {
      throw new Error("Login required to place bids");
    }
    if (!auction) throw new Error("Auction not loaded");
    const now = new Date();
    if (new Date(auction.startAt) > now)
      throw new Error("Auction not started yet");
    if (new Date(auction.endAt) < now) throw new Error("Auction already ended");
    if (auction.status === "closed") throw new Error("Auction closed");

    try {
      // POST to server - server validates rules
      const res = await api.post("/bids", { auctionId: id, amount });
      // server will emit newBid; optimistic update already handled by socket listener
      return res.data;
    } catch (err) {
      // normalize error
      const msg = err?.response?.data?.message || err.message || "Bid failed";
      throw new Error(msg);
    }
  };

  if (loading) return <div className="p-6 text-white">Loading auction...</div>;
  if (!auction) return <div className="p-6 text-white">Auction not found</div>;

  const minRequired = computeMinRequired();

  return (
    <div className="min-h-screen pt-28 p-6 bg-gradient-to-br from-[#0f1724] to-[#0b1220] text-white">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Left: Auction info + bid form */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h1 className="text-2xl font-bold">{auction.product?.title}</h1>
          <p className="text-sm text-white/70 mt-1">
            {auction.product?.description}
          </p>

          <div className="mt-4 space-y-2 text-white/80">
            <div>
              <strong>Type:</strong> {auction.type}
            </div>
            <div>
              <strong>Status:</strong> {auction.status}
            </div>
            <div>
              <strong>Start:</strong>{" "}
              {new Date(auction.startAt).toLocaleString()}
            </div>
            <div>
              <strong>End:</strong> {new Date(auction.endAt).toLocaleString()}
            </div>
            <div>
              <strong>Min Increment:</strong> ₹{auction.minIncrement}
            </div>
            <div>
              <strong>Start Price:</strong> ₹{auction.startPrice}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 text-sm text-white/70">Current Minimum</div>
            <div className="text-xl font-semibold text-yellow-300">
              ₹{minRequired ?? auction.startPrice}
            </div>
          </div>

          <div className="mt-6">
            <BidForm
              onSubmit={placeBid}
              minRequired={minRequired}
              disabled={auction.status !== "live"}
              type={auction.type}
            />
            {auction.status !== "live" && (
              <div className="mt-2 text-sm text-white/60">
                Bids can be placed only while auction is live.
              </div>
            )}
          </div>
        </div>

        {/* Right: Bids list */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-3">Bids</h3>
          <BidList
            bids={bids}
            auctionType={auction.type}
            auctionStatus={auction.status}
          />
        </div>
      </div>
    </div>
  );
}
