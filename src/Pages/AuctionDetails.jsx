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

/* ======================================================
   Utils
====================================================== */
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

  if (!bids.length) return Number(a.startPrice || 0);

  if (a.type === "reverse") {
    const lowest = Math.min(...bids.map((b) => b.amount));
    return Math.max(0, lowest - inc);
  }

  const highest = Math.max(...bids.map((b) => b.amount));
  return highest + inc;
};

const computeWinner = (a, bids) => {
  if (!a || !bids.length) return null;
  return a.type === "reverse"
    ? bids.reduce((x, y) => (y.amount < x.amount ? y : x))
    : bids.reduce((x, y) => (y.amount > x.amount ? y : x));
};

/* ======================================================
   Bid Form (Amazon UX)
====================================================== */
function BidForm({ minRequired, type, disabled, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (disabled) {
      setError("Auction is not live");
      return;
    }

    const amount = Number(value);
    if (!amount || amount <= 0) {
      setError("Enter a valid bid amount");
      return;
    }

    if (type === "reverse") {
      if (amount > minRequired) {
        setError(`Reverse auction: bid must be ≤ ₹${minRequired}`);
        return;
      }
    } else {
      if (amount < minRequired) {
        setError(`Minimum required bid is ₹${minRequired}`);
        return;
      }
    }

    setBusy(true);
    try {
      await onSubmit(amount);
      setValue("");
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
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder={
            type === "reverse" ? `Bid ≤ ₹${minRequired}` : `Min ₹${minRequired}`
          }
          disabled={disabled || busy}
          className="flex-1 p-3 bg-black border border-yellow-900 rounded text-white"
        />

        <button
          disabled={disabled || busy}
          className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold disabled:opacity-50"
        >
          {busy ? "Bidding..." : "Bid"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </form>
  );
}

/* ======================================================
   Bid List
====================================================== */
function BidList({ bids, type }) {
  if (!bids.length)
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
            <div className="font-semibold text-yellow-200">
              {b.bidder?.name || "Anonymous"}
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

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function AuctionDetails() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- Load auction ---------------- */
  const loadAuction = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auctions/${id}`);
      setAuction(res.data.auction);
      setProduct(res.data.auction.product);
      setBids(res.data.bids || []);
    } catch {
      setAuction(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  /* ---------------- Socket ---------------- */
  useEffect(() => {
    initSocket();
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinAuction", id);

    socket.on("newBid", (p) => {
      if (p.auctionId !== id) return;
      setBids((prev) => [
        {
          _id: p.bid._id,
          amount: p.bid.amount,
          bidder: p.bid.bidder,
          createdAt: p.bid.createdAt,
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

  /* ---------------- Place bid (OPTIMISTIC) ---------------- */
  const placeBid = async (amount) => {
    if (!user) throw new Error("Login required");

    const optimisticBid = {
      _id: `temp-${Date.now()}`,
      amount,
      bidder: { name: user.name },
      createdAt: new Date().toISOString(),
    };

    setBids((prev) => [optimisticBid, ...prev]);

    try {
      await api.post(
        "/bids",
        { auctionId: id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      setBids((prev) => prev.filter((b) => b._id !== optimisticBid._id));
      throw new Error(err?.response?.data?.message || "Bid rejected");
    }
  };

  /* ---------------- Derived ---------------- */
  if (loading) return <div className="p-6 text-yellow-200">Loading...</div>;
  if (!auction)
    return <div className="p-6 text-yellow-200">Auction not found</div>;

  const status = computeStatus(auction);
  const minRequired = computeMinRequired(auction, bids);
  const winner = computeWinner(auction, bids);

  return (
    <div className="min-h-screen pt-28 p-6 bg-black text-yellow-100">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="md:col-span-2 bg-[#0b0b0b]/80 p-6 border border-yellow-900 rounded-xl">
          <h1 className="text-2xl font-bold">{product?.title}</h1>
          <p className="mt-2 text-yellow-100/70">{product?.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>Type: {auction.type}</div>
            <div>Status: {status}</div>
            <div>Start: {new Date(auction.startAt).toLocaleString()}</div>
            <div>End: {new Date(auction.endAt).toLocaleString()}</div>
          </div>

          {(status === "ended" || status === "closed") && (
            <div className="mt-6 p-4 bg-black/40 border border-yellow-900 rounded">
              <div className="font-semibold">Winner</div>
              {winner ? (
                <div className="mt-2 flex justify-between">
                  <span>{winner.bidder?.name}</span>
                  <span className="font-bold">₹{winner.amount}</span>
                </div>
              ) : (
                <div className="text-yellow-200/40 mt-2">No bids</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
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
              onSubmit={placeBid}
            />
          </div>

          <h3 className="mt-6 mb-3 font-semibold">Bid History</h3>
          <div className="max-h-80 overflow-y-auto">
            <BidList bids={bids} type={auction.type} />
          </div>
        </aside>
      </div>
    </div>
  );
}
