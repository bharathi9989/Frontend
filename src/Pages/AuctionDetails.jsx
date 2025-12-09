// src/pages/AuctionDetailsDark.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

function BidForm({ minRequired, onSubmit, disabled }) {
  const [val, setVal] = useState("");
  const [working, setWorking] = useState(false);
  const submit = async (e) => {
    e?.preventDefault();
    if (!val) return alert("Enter bid");
    if (minRequired && Number(val) < Number(minRequired))
      return alert(`Min ₹${minRequired}`);
    setWorking(true);
    try {
      await onSubmit(Number(val));
      setVal("");
    } catch (err) {
      alert(err.message || "Bid failed");
    } finally {
      setWorking(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-3">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={minRequired ? `Min ₹${minRequired}` : "Enter bid"}
        className="flex-1 p-3 bg-[#0b0b0b] border border-yellow-700 rounded text-white"
        disabled={disabled}
      />
      <button
        className="px-4 py-2 bg-yellow-600 text-black font-bold rounded"
        disabled={working || disabled}
      >
        {working ? "..." : "Bid"}
      </button>
    </form>
  );
}

function BidList({ bids, type }) {
  if (!bids || !bids.length)
    return <div className="text-yellow-200/40">No bids yet</div>;
  const sorted =
    type === "reverse"
      ? [...bids].sort((a, b) => a.amount - b.amount)
      : [...bids].sort((a, b) => b.amount - a.amount);
  return (
    <div className="space-y-2">
      {sorted.map((b) => (
        <div
          key={b._id || b.createdAt}
          className="flex justify-between p-3 bg-[#0b0b0b]/60 border border-yellow-900 rounded"
        >
          <div>
            <div className="text-yellow-200 font-medium">
              {b.bidder?.name || "Unknown"}
            </div>
            <div className="text-xs text-yellow-100/60">
              {new Date(b.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="text-yellow-300 font-bold">₹{b.amount}</div>
        </div>
      ))}
    </div>
  );
}

export default function AuctionDetailsDark() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const statusOf = (a) => {
    const now = new Date(),
      s = new Date(a.startAt),
      e = new Date(a.endAt);
    if (now < s) return "upcoming";
    if (now > e) return "ended";
    return "live";
  };

  const minReq = (a, bs) => {
    if (!a) return null;
    if (a.type === "reverse")
      return !bs.length
        ? a.startPrice
        : Math.min(...bs.map((x) => x.amount)) - (a.minIncrement || 0);
    return !bs.length
      ? a.startPrice
      : Math.max(...bs.map((x) => x.amount)) + (a.minIncrement || 0);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auctions/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = res.data;
        const a = payload.auction || payload;
        setAuction(a);
        const pCandidate = a.product || a.productId || a.product;
        if (pCandidate && typeof pCandidate === "object" && pCandidate.title)
          setProduct(pCandidate);
        else if (pCandidate) {
          try {
            const pr = await api.get(`/products/${pCandidate}`);
            setProduct(pr.data.product || pr.data);
          } catch {
            const all = await api.get("/products", {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const list = Array.isArray(all.data)
              ? all.data
              : all.data.products || [];
            setProduct(
              list.find(
                (pp) =>
                  pp._id === String(pCandidate) ||
                  pp.id === String(pCandidate) ||
                  (pp._id && pp._id.toString() === pCandidate)
              )
            );
          }
        }
        const incomingBids =
          payload.bids && payload.bids.length
            ? payload.bids
            : (
                await api.get(`/bids/${id}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                })
              ).data;
        setBids(
          Array.isArray(incomingBids) ? incomingBids : incomingBids.bids || []
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id, token]);

  useEffect(() => {
    initSocket();
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket) return;
    socket.emit("joinAuction", id);
    const onNew = (p) => {
      if (p.auctionId !== id) return;
      setBids((prev) => [
        p.bid || { amount: p.amount, bidder: p.bidder, createdAt: p.time },
        ...prev,
      ]);
    };
    socket.on("newBid", onNew);
    return () => {
      socket.emit("leaveAuction", id);
      socket.off("newBid", onNew);
    };
  }, [id]);

  const placeBid = async (amount) => {
    if (!user) throw new Error("Login required");
    const s = statusOf(auction);
    if (s !== "live") throw new Error("Auction not live");
    await api.post(
      "/bids",
      { auctionId: id, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  if (loading) return <div className="p-6 text-yellow-200">Loading...</div>;
  if (!auction)
    return <div className="p-6 text-yellow-200">Auction not found</div>;

  const status = statusOf(auction);
  const minRequired = minReq(auction, bids);

  return (
    <div className="min-h-screen pt-28 p-6 bg-gradient-to-b from-black via-gray-900 to-[#0b0b0b] text-yellow-100">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="bg-[#070707]/70 border border-yellow-900 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-yellow-300">
            {product?.title || "Product"}
          </h2>
          <p className="text-yellow-100/80 mt-2">{product?.description}</p>

          <div className="mt-4 space-y-2 text-sm">
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={
                  status === "live"
                    ? "text-green-300"
                    : status === "upcoming"
                    ? "text-yellow-300"
                    : "text-red-400"
                }
              >
                {status}
              </span>
            </div>
            <div>
              <strong>Start:</strong>{" "}
              {new Date(auction.startAt).toLocaleString()}
            </div>
            <div>
              <strong>End:</strong> {new Date(auction.endAt).toLocaleString()}
            </div>
            <div>
              <strong>Start Price:</strong> ₹{auction.startPrice}
            </div>
            <div>
              <strong>Increment:</strong> ₹{auction.minIncrement}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-yellow-200/60">Minimum required</div>
            <div className="text-2xl font-bold text-yellow-300">
              ₹{minRequired}
            </div>
          </div>

          <div className="mt-4">
            <BidForm
              minRequired={minRequired}
              onSubmit={placeBid}
              disabled={status !== "live"}
            />
          </div>
        </div>

        <div className="bg-[#070707]/60 border border-yellow-900 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-yellow-200 mb-4">
            Bid History
          </h3>
          <BidList bids={bids} type={auction.type} />
        </div>
      </div>
    </div>
  );
}
