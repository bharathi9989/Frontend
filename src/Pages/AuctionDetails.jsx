// src/pages/AuctionDetails.jsx
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
   Small Spinner
============================================================ */
const SmallSpinner = () => (
  <div className="w-6 h-6 border-2 border-yellow-500/40 border-t-yellow-300 rounded-full animate-spin" />
);

/* ============================================================
   BidForm Component
============================================================ */
function BidForm({ minRequired, type, disabled, onSubmit }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (disabled) return alert("Auction not live");
    const amount = Number(val);
    if (!amount || amount <= 0) return alert("Enter valid amount");

    if (type === "reverse") {
      if (amount > minRequired)
        return alert(`Reverse auction: Must bid ≤ ₹${minRequired}`);
    } else {
      if (amount < minRequired)
        return alert(`Minimum required is ₹${minRequired}`);
    }

    setBusy(true);
    try {
      await onSubmit(amount);
      setVal("");
    } catch (err) {
      alert(err.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handle} className="flex gap-3">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 p-3 bg-black border border-yellow-900 rounded text-white"
        placeholder={
          type === "reverse" ? `Bid ≤ ${minRequired}` : `Min ₹${minRequired}`
        }
        disabled={disabled || busy}
      />
      <button
        disabled={disabled || busy}
        className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold"
      >
        {busy ? "..." : "Bid"}
      </button>
    </form>
  );
}

/* ============================================================
   BidList Component
============================================================ */
function BidList({ bids, type }) {
  if (!bids || bids.length === 0)
    return <div className="text-yellow-200/40">No bids yet</div>;

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
            <div className="text-yellow-200 font-semibold">
              {b.bidder?.name || b.bidder?.email || "Anonymous"}
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

/* ============================================================
   Utility
============================================================ */
const computeStatus = (a) => {
  const now = Date.now();
  const start = new Date(a.startAt).getTime();
  const end = new Date(a.endAt).getTime();
  if (a.status === "closed") return "closed";
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "live";
};

const computeMinRequired = (a, bids) => {
  if (!a) return 0;
  const inc = Number(a.minIncrement || 1);
  if (!bids || bids.length === 0) return Number(a.startPrice);

  if (a.type === "reverse") {
    const lowest = Math.min(...bids.map((b) => b.amount));
    return Math.max(0, lowest - inc);
  }

  const highest = Math.max(...bids.map((b) => b.amount));
  return highest + inc;
};

const computeWinner = (a, bids) => {
  if (!a || !bids || bids.length === 0) return null;
  return a.type === "reverse"
    ? bids.reduce((acc, b) => (b.amount < acc.amount ? b : acc), bids[0])
    : bids.reduce((acc, b) => (b.amount > acc.amount ? b : acc), bids[0]);
};

/* ============================================================
   Main Component
============================================================ */
export default function AuctionDetails() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------------
     Load Auction + Bids
  ---------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auctions/${id}`);
      const a = res.data.auction;
      setAuction(a);
      setProduct(a.product || null);
      setBids(res.data.bids || []);
    } catch (err) {
      setAuction(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------------------
     Socket Setup
  ---------------------------- */
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
      setAuction((old) =>
        old ? { ...old, status: "closed", winnerBid: p.winner } : old
      );
    });

    return () => {
      socket.emit("leaveAuction", id);
      socket.off("newBid");
      socket.off("auctionClosed");
    };
  }, [id]);

  /* ---------------------------
     Place Bid
  ---------------------------- */
  const handleBid = async (amount) => {
    if (!user) throw new Error("Login required");
    await api.post(
      "/bids",
      { auctionId: id, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  /* ---------------------------
     Derived Values
  ---------------------------- */
  const status = auction ? computeStatus(auction) : "loading";
  const minRequired = computeMinRequired(auction, bids);
  const winner = computeWinner(auction, bids);

  /* ---------------------------
     UI
  ---------------------------- */
  if (loading) return <div className="p-6 text-yellow-200">Loading...</div>;
  if (!auction)
    return <div className="p-6 text-yellow-200">Auction not found</div>;

  return (
    <div className="min-h-screen pt-28 p-6 bg-black text-yellow-100">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="md:col-span-2 bg-[#0b0b0b]/80 p-6 border border-yellow-900 rounded-xl">
          <div className="flex gap-6">
            <div className="w-2/5 h-60 bg-black rounded overflow-hidden flex items-center justify-center">
              {product?.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-yellow-300/40">No Image</div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{product?.title}</h1>
              <p className="mt-2 text-yellow-100/70">
                {product?.description || "No description"}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <div className="text-yellow-100/70">Type</div>
                  <div className="font-semibold">{auction.type}</div>
                </div>
                <div>
                  <div className="text-yellow-100/70">Status</div>
                  <div
                    className={`font-semibold ${
                      status === "live"
                        ? "text-green-300"
                        : status === "upcoming"
                        ? "text-yellow-300"
                        : "text-red-400"
                    }`}
                  >
                    {status}
                  </div>
                </div>
                <div>
                  <div className="text-yellow-100/70">Start Price</div>
                  <div className="font-semibold">₹{auction.startPrice}</div>
                </div>
                <div>
                  <div className="text-yellow-100/70">Min Increment</div>
                  <div className="font-semibold">₹{auction.minIncrement}</div>
                </div>
                <div>
                  <div className="text-yellow-100/70">Start At</div>
                  <div className="font-semibold">
                    {new Date(auction.startAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-yellow-100/70">End At</div>
                  <div className="font-semibold">
                    {new Date(auction.endAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Winner */}
              {(status === "closed" || status === "ended") && (
                <div className="mt-6 p-4 bg-black/40 border border-yellow-900 rounded">
                  <div className="text-yellow-100/70">Winner</div>
                  {winner ? (
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="font-semibold text-yellow-200">
                          {winner.bidder?.name || winner.bidder?.email}
                        </div>
                        <div className="text-xs text-yellow-100/60">
                          {new Date(winner.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-yellow-300 font-bold">
                        ₹{winner.amount}
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-200/40 mt-2">
                      No bids placed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <aside className="bg-[#0b0b0b]/70 p-6 border border-yellow-900 rounded-xl">
          <div className="text-sm text-yellow-100/70">Minimum Required</div>
          <div className="text-3xl font-bold text-yellow-300">
            ₹{minRequired}
          </div>

          <div className="mt-4">
            <BidForm
              minRequired={minRequired}
              type={auction.type}
              disabled={status !== "live"}
              onSubmit={handleBid}
            />
          </div>

          <h3 className="mt-6 mb-3 font-semibold text-yellow-200">
            Bid History
          </h3>
          <div className="max-h-80 overflow-y-auto">
            <BidList bids={bids} type={auction.type} />
          </div>
        </aside>
      </div>
    </div>
  );
}
