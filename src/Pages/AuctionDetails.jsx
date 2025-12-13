import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

/* ============================================================
   Helpers
============================================================ */
const computeStatus = (a) => {
  if (!a) return "loading";
  if (a.status === "closed") return "closed";
  const now = Date.now();
  const start = new Date(a.startAt).getTime();
  const end = new Date(a.endAt).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "live";
};

const computeMinRequired = (a, bids) => {
  if (!a) return 0;
  const inc = Number(a.minIncrement || 1);
  if (!bids || bids.length === 0) return Number(a.startPrice || 0);

  if (a.type === "reverse") {
    const lowest = Math.min(...bids.map((b) => Number(b.amount)));
    return Math.max(0, lowest - inc);
  } else {
    const highest = Math.max(...bids.map((b) => Number(b.amount)));
    return highest + inc;
  }
};

const computeWinner = (a, bids) => {
  if (!a || !bids || bids.length === 0) return null;
  return a.type === "reverse"
    ? bids.reduce((acc, b) => (b.amount < acc.amount ? b : acc), bids[0])
    : bids.reduce((acc, b) => (b.amount > acc.amount ? b : acc), bids[0]);
};

/* ============================================================
   BidForm
============================================================ */
function BidForm({ minRequired, type, disabled, onSubmit }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [optimisticBidId, setOptimisticBidId] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const amount = Number(val);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (type === "reverse" && amount > minRequired) {
      setError(`Reverse auction: bid ≤ ₹${minRequired}`);
      return;
    }

    if (type !== "reverse" && amount < minRequired) {
      setError(`Minimum required ₹${minRequired}`);
      return;
    }

    setBusy(true);
    try {
      await onSubmit(amount);
      setVal("");
    } catch (err) {
      setError(err.message || "Bid failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-3">
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={disabled || busy}
          placeholder={
            type === "reverse" ? `Bid ≤ ₹${minRequired}` : `Min ₹${minRequired}`
          }
          className={`flex-1 p-3 rounded bg-black text-white border ${
            disabled
              ? "opacity-50 cursor-not-allowed border-gray-700"
              : "border-yellow-900"
          }`}
        />
        <button
          disabled={disabled || busy}
          className={`px-4 py-2 rounded font-semibold ${
            disabled
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-yellow-500 text-black"
          }`}
        >
          {busy ? "..." : "Bid"}
        </button>
      </div>

      {error && <div className="text-xs text-red-400">{error}</div>}
    </form>
  );
}

/* ============================================================
   BidList
============================================================ */
function BidList({ bids, type }) {
  if (!bids.length)
    return <>
      <div
  className={`flex justify-between p-3 rounded border ${
    b.optimistic
      ? "bg-yellow-900/40 border-yellow-500 animate-pulse"
      : "bg-black/40 border-yellow-900"
  }`}
></div>
    </>

  const sorted =
    type === "reverse"
      ? [...bids].sort((a, b) => a.amount - b.amount)
      : [...bids].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-2">
      {sorted.map((b) => (
        <div
          key={b._id}
          className="flex justify-between p-3 bg-black/40 border border-yellow-900 rounded"
        >
          <div>
            <div className="font-semibold text-yellow-200">
              {b.bidder?.name || b.bidder?.email || "Anonymous"}
            </div>
            <div className="text-xs text-yellow-100/60">
              {new Date(b.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="font-bold text-yellow-300">₹{b.amount}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN
============================================================ */
export default function AuctionDetails() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------- Load -------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auctions/${id}`);
      setAuction(res.data.auction);
      setProduct(res.data.auction.product);
      setBids(res.data.bids || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* -------- Socket -------- */
  useEffect(() => {
    initSocket();
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinAuction", id);

    socket.on("newBid", (p) => {
      if (p.auctionId !== id) return;
      const b = p.bid || p;
      setBids((prev) => [
        {
          _id: b._id || Math.random(),
          amount: b.amount,
          bidder: b.bidder || {},
          createdAt: b.createdAt || new Date(),
        },
        ...prev,
      ]);
    });

    socket.on("auctionClosed", (p) => {
      if (p.auctionId !== id) return;
      setAuction((a) => ({ ...a, status: "closed" }));
    });

    return () => {
      socket.emit("leaveAuction", id);
      socket.off("newBid");
      socket.off("auctionClosed");
    };
  }, [id]);

  /* -------- Place Bid -------- */
  const placeBid = async (amount) => {
    if (!user) throw new Error("Login required");

    const tempId = `optimistic-${Date.now()}`;
    setOptimisticBidId(tempId);

    // 1️⃣ Optimistic UI update
    setBids((prev) => [
      {
        _id: tempId,
        amount,
        bidder: { name: user.name },
        createdAt: new Date(),
        optimistic: true,
      },
      ...prev,
    ]);

    try {
      // 2️⃣ Real API call
      await api.post(
        "/bids",
        { auctionId: id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3️⃣ Re-fetch authoritative data
      await load(); // <-- THIS IS KEY
      setOptimisticBidId(null);
    } catch (err) {
      // 4️⃣ Rollback optimistic bid
      setBids((prev) => prev.filter((b) => b._id !== tempId));
      setOptimisticBidId(null);

      throw new Error(
        err?.response?.data?.message || "Bid rejected (price already updated)"
      );
    }
  };

  if (loading) return <div className="p-6 text-yellow-200">Loading…</div>;
  if (!auction) return <div className="p-6">Auction not found</div>;

  const status = computeStatus(auction);
  const isLive = status === "live";
  const confirmedBids = bids.filter((b) => !b.optimistic);
  const minRequired = computeMinRequired(auction, confirmedBids);
  const winner = computeWinner(auction, bids);

  return (
    <div className="min-h-screen pt-28 p-6 bg-black text-yellow-100">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="md:col-span-2 bg-[#0b0b0b]/80 p-6 border border-yellow-900 rounded-xl">
          <h1 className="text-2xl font-bold">{product?.title}</h1>
          <p className="mt-2 text-yellow-100/70">{product?.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              Status: <b>{status}</b>
            </div>
            <div>
              Type: <b>{auction.type}</b>
            </div>
            <div>Start: {new Date(auction.startAt).toLocaleString()}</div>
            <div>End: {new Date(auction.endAt).toLocaleString()}</div>
          </div>

          {(status === "closed" || status === "ended") && (
            <div className="mt-4 p-4 border border-yellow-900 rounded">
              Winner:{" "}
              {winner
                ? `${winner.bidder?.name} – ₹${winner.amount}`
                : "No bids"}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <aside className="bg-[#0b0b0b]/70 p-6 border border-yellow-900 rounded-xl">
          <div className="text-sm">Minimum Required</div>
          <div className="text-3xl font-bold text-yellow-300">
            ₹{minRequired}
          </div>

          <div className="mt-4">
            <BidForm
              minRequired={minRequired}
              type={auction.type}
              disabled={!isLive}
              onSubmit={placeBid}
            />
            {!isLive && (
              <div className="mt-2 text-xs text-yellow-200/60">
                {status === "upcoming" && "Auction not started yet"}
                {(status === "ended" || status === "closed") && "Auction ended"}
              </div>
            )}
          </div>

          <h3 className="mt-6 font-semibold">Bid History</h3>
          <BidList bids={bids} type={auction.type} />
        </aside>
      </div>
    </div>
  );
}
