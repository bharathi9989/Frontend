// src/pages/AuctionDetailsDark.jsx
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
import { formatDistanceToNowStrict } from "date-fns";

function SmallSpinner({ size = 4 }) {
  return (
    <div
      style={{ width: size * 4, height: size * 4 }}
      className="border-2 border-yellow-300/40 border-t-yellow-300 rounded-full animate-spin"
      aria-hidden="true"
    />
  );
}

/* -------------------- BidForm Component -------------------- */
/*
  Props:
    - minRequired: number | null
    - type: "traditional" | "reverse" | "sealed"
    - onSubmit(amount) => Promise
    - disabled: boolean
*/
function BidForm({ minRequired, type = "traditional", onSubmit, disabled }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  // validate + submit
  const submit = async (e) => {
    e?.preventDefault();
    if (disabled) return alert("Auction not live.");
    const amount = Number(val);
    if (!Number.isFinite(amount)) return alert("Enter a valid numeric amount.");
    if (amount <= 0) return alert("Amount must be > 0.");

    // Reverse auction: next bid must be strictly LOWER than current "minRequired" (which is computed as next allowed)
    if (type === "reverse") {
      // minRequired is computed as "next allowed" which is lower than current lowest. For UX we may show current lowest too.
      if (minRequired == null) return alert("Invalid auction state.");
      if (!(amount <= minRequired)) {
        return alert(
          `For reverse auctions, bid must be ≤ ₹${minRequired} (lower is better).`
        );
      }
    } else {
      // Traditional/sealed: amount must be >= minRequired
      if (minRequired != null && amount < minRequired) {
        return alert(`Minimum required bid is ₹${minRequired}`);
      }
    }

    setBusy(true);
    try {
      await onSubmit(amount);
      setVal("");
    } catch (err) {
      // bubble message
      alert(err?.message || "Bid failed");
    } finally {
      setBusy(false);
    }
  };

  const placeholder =
    type === "reverse"
      ? minRequired
        ? `Place <= ₹${minRequired} (lower wins)`
        : "Place a bid"
      : minRequired
      ? `Min ₹${minRequired}`
      : "Place a bid";

  return (
    <form onSubmit={submit} className="flex gap-3">
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="flex-1 p-3 bg-[#0b0b0b] border border-yellow-900/40 rounded text-white outline-none"
        disabled={disabled || busy}
      />
      <button
        type="submit"
        disabled={disabled || busy}
        className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:opacity-90"
      >
        {busy ? "Placing..." : "Place Bid"}
      </button>
    </form>
  );
}

/* -------------------- BidList Component -------------------- */
/*
  Props:
    - bids: array
    - type: auction type
*/
function BidList({ bids = [], type = "traditional" }) {
  if (!bids || bids.length === 0)
    return <div className="text-yellow-200/40">No bids yet</div>;

  // sort: reverse -> ascending (lowest first), traditional -> descending (highest first)
  const sorted =
    type === "reverse"
      ? [...bids].sort((a, b) => Number(a.amount) - Number(b.amount))
      : [...bids].sort((a, b) => Number(b.amount) - Number(a.amount));

  // compute lowest/highest for quick checks
  const topAmount = sorted[0] ? Number(sorted[0].amount) : null;

  return (
    <div className="space-y-3">
      {sorted.map((b) => (
        <div
          key={b._id || b.createdAt || Math.random()}
          className="flex justify-between items-center p-3 bg-[#0b0b0b]/60 border border-yellow-900 rounded"
        >
          <div>
            <div className="text-yellow-200 font-medium">
              {b.bidder?.name || b.bidder?.email || "Anonymous"}
            </div>
            <div className="text-xs text-yellow-100/60">
              {new Date(b.createdAt).toLocaleString()}
            </div>
          </div>

          <div
            className={
              type === "reverse" && Number(b.amount) === topAmount
                ? "text-green-300 font-bold"
                : "text-yellow-300 font-bold"
            }
          >
            ₹{b.amount}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------- Utility helpers -------------------- */

const computeStatus = (a) => {
  if (!a) return "unknown";
  if (a.status === "closed") return "closed";
  const now = Date.now();
  const start = new Date(a.startAt).getTime();
  const end = new Date(a.endAt).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "live";
};

/**
 * computeMinRequired:
 * - traditional/sealed: highestBid + minIncrement (or startPrice if no bids)
 * - reverse: next allowed = lowestBid - minIncrement (or startPrice if no bids)
 *   ensure non-negative and integer math
 */
const computeMinRequired = (a, bidsList) => {
  if (!a) return null;
  const minInc = Number(a.minIncrement || 1);
  if (a.type === "reverse") {
    if (!bidsList || bidsList.length === 0) return Number(a.startPrice || 0);
    const lowest = Math.min(...bidsList.map((x) => Number(x.amount)));
    const next = Math.max(0, lowest - minInc);
    return next;
  } else {
    if (!bidsList || bidsList.length === 0) return Number(a.startPrice || 0);
    const highest = Math.max(...bidsList.map((x) => Number(x.amount)));
    return highest + minInc;
  }
};

const computeWinner = (a, bidsList) => {
  if (!a || !bidsList || bidsList.length === 0) return null;
  if (a.type === "reverse") {
    return bidsList.reduce(
      (acc, b) => (Number(b.amount) < Number(acc.amount) ? b : acc),
      bidsList[0]
    );
  } else {
    return bidsList.reduce(
      (acc, b) => (Number(b.amount) > Number(acc.amount) ? b : acc),
      bidsList[0]
    );
  }
};

/* -------------------- Main Component -------------------- */

export default function AuctionDetails() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null); // {type, days,hours,minutes,seconds}
  const socketRef = useRef(null);

  // ------- load auction + product + bids with fallbacks -------
  const loadAuction = useCallback(async () => {
    setLoading(true);
    try {
      // Try /auctions/:id
      const res = await api.get(`/auctions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = res.data;
      const a = payload?.auction || payload;
      if (!a) throw new Error("Auction payload malformed");
      setAuction(a);

      // set bids if included
      const incomingBids = Array.isArray(payload?.bids) ? payload.bids : [];
      if (incomingBids.length > 0) {
        setBids(incomingBids);
      } else {
        // try hits: GET /bids/:auctionId or /bids?auctionId=...
        try {
          const br = await api.get(`/bids/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const list = Array.isArray(br.data) ? br.data : br.data?.bids || [];
          setBids(list);
        } catch (err) {
          // fallback to empty bids
          setBids([]);
        }
      }

      // product: may be populated object or id reference
      const pRef = a.product || a.productId || null;
      if (pRef && typeof pRef === "object" && pRef.title) {
        setProduct(pRef);
      } else if (pRef) {
        const pid = pRef.toString ? pRef.toString() : pRef;
        try {
          const pRes = await api.get(`/products/${pid}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const p = pRes.data?.product || pRes.data;
          setProduct(p || null);
        } catch (err) {
          // fallback: fetch list and pick
          try {
            const all = await api.get("/products", {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const arr = Array.isArray(all.data)
              ? all.data
              : all.data?.products || [];
            const found = arr.find(
              (pp) => pp._id === pid || String(pp._id) === pid || pp.id === pid
            );
            setProduct(found || null);
          } catch {
            setProduct(null);
          }
        }
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error("Load auction error:", err);
      setAuction(null);
      setProduct(null);
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  // ------- socket init & listeners -------
  useEffect(() => {
    initSocket(); // create socket connection if not already
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket) return;

    socket.emit("joinAuction", id);

    const onNewBid = (payload) => {
      // payload might be { auctionId, bid } or { auctionId, amount, bidder, time }
      if (!payload || payload.auctionId !== id) return;
      const newBid = payload.bid || payload;
      // Ensure bid object shape
      const bidObj = {
        _id:
          newBid._id ||
          newBid.bidId ||
          `${Math.random().toString(36).slice(2)}`,
        amount: Number(newBid.amount),
        bidder: newBid.bidder || {},
        createdAt: newBid.createdAt || newBid.time || new Date().toISOString(),
      };
      setBids((prev) => [bidObj, ...prev]);
    };

    const onAuctionClosed = (payload) => {
      if (!payload || payload.auctionId !== id) return;
      setAuction((a) =>
        a
          ? {
              ...a,
              status: "closed",
              winnerBid: payload.winner?.id ? payload.winner : a.winnerBid,
            }
          : a
      );
    };

    socket.on("newBid", onNewBid);
    socket.on("auctionClosed", onAuctionClosed);

    return () => {
      try {
        socket.emit("leaveAuction", id);
      } catch (e) {}
      socket.off("newBid", onNewBid);
      socket.off("auctionClosed", onAuctionClosed);
    };
  }, [id]);

  // ------- countdown (client-side) -------
  useEffect(() => {
    if (!auction) {
      setCountdown(null);
      return;
    }
    let mounted = true;
    const update = () => {
      const now = Date.now();
      const start = new Date(auction.startAt).getTime();
      const end = new Date(auction.endAt).getTime();

      if (isNaN(start) || isNaN(end)) {
        if (mounted) setCountdown(null);
        return;
      }

      if (now < start) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        if (mounted)
          setCountdown({ type: "starts_in", days, hours, minutes, seconds });
      } else if (now <= end) {
        const diff = end - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        if (mounted)
          setCountdown({ type: "ends_in", days, hours, minutes, seconds });
      } else {
        if (mounted) setCountdown({ type: "ended" });
      }
    };

    update();
    const t = setInterval(update, 1000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [auction]);

  // ------- place bid API -------
  const placeBid = async (amount) => {
    if (!user) throw new Error("Login required to place bids");
    if (!auction) throw new Error("Auction not loaded");
    const status = computeStatus(auction);
    if (status !== "live") throw new Error("Auction is not live");

    // server will validate again — client does pre-checks in form
    try {
      await api.post(
        "/bids",
        { auctionId: id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // optimistic update is handled via socket; if you want immediate UI update:
      // const pseudoBid = { _id: `local-${Date.now()}`, amount, bidder: { name: user.name }, createdAt: new Date().toISOString() };
      // setBids(prev=>[pseudoBid,...prev]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Bid failed";
      throw new Error(msg);
    }
  };

  // ------- derived values -------
  const status = auction ? computeStatus(auction) : "loading";
  const minRequired = computeMinRequired(auction, bids);
  const winner = computeWinner(auction, bids);

  // ------- UI -------
  if (loading)
    return <div className="p-6 text-yellow-200">Loading auction...</div>;
  if (!auction)
    return <div className="p-6 text-yellow-200">Auction not found</div>;

  return (
    <div className="min-h-screen pt-28 p-6 bg-linear-to-b from-black via-gray-900 to-[#070707] text-yellow-100">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* LEFT: Product + info */}
        <div className="md:col-span-2 bg-[#070707]/80 border border-yellow-900 p-6 rounded-xl shadow-lg">
          <div className="flex gap-6">
            {/* image */}
            <div className="w-2/5 min-h-[220px] bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
              {product?.images?.length > 0 && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-yellow-100/40 text-center p-4">
                  <div className="text-lg font-medium">No Image</div>
                  <div className="text-xs mt-1">Seller didn't add an image</div>
                </div>
              )}
            </div>

            {/* details */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-yellow-200">
                {product?.title || "Product"}
              </h1>
              <p className="text-yellow-100/80 mt-2">
                {product?.description || "No description"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-yellow-100/80">Type</div>
                  <div className="font-semibold">{auction.type}</div>
                </div>
                <div>
                  <div className="text-yellow-100/80">Status</div>
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
                  <div className="text-yellow-100/80">Start</div>
                  <div className="font-semibold">
                    {new Date(auction.startAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-yellow-100/80">End</div>
                  <div className="font-semibold">
                    {new Date(auction.endAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-yellow-100/80">Start Price</div>
                  <div className="font-semibold">₹{auction.startPrice}</div>
                </div>
                <div>
                  <div className="text-yellow-100/80">Increment</div>
                  <div className="font-semibold">₹{auction.minIncrement}</div>
                </div>
              </div>

              {/* countdown */}
              <div className="mt-6">
                {countdown?.type === "starts_in" && (
                  <div className="p-3 bg-[#0b0b0b]/60 rounded flex items-center gap-4">
                    <div className="text-sm">Starts in</div>
                    <div className="font-mono text-lg">
                      {countdown.days}d {countdown.hours}h {countdown.minutes}m{" "}
                      {countdown.seconds}s
                    </div>
                  </div>
                )}
                {countdown?.type === "ends_in" && (
                  <div className="p-3 bg-[#0b0b0b]/60 rounded flex items-center gap-4">
                    <div className="text-sm">Ends in</div>
                    <div className="font-mono text-lg">
                      {countdown.days}d {countdown.hours}h {countdown.minutes}m{" "}
                      {countdown.seconds}s
                    </div>
                  </div>
                )}
                {countdown?.type === "ended" && (
                  <div className="p-3 bg-[#0b0b0b]/60 rounded text-red-400 font-semibold">
                    Auction ended
                  </div>
                )}
              </div>

              {/* winner display if ended/closed */}
              {(status === "ended" || auction.status === "closed") && (
                <div className="mt-6 p-4 bg-[#090808]/60 rounded border border-yellow-900">
                  <div className="text-yellow-100/80">Winner</div>
                  {winner ? (
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="font-semibold text-yellow-200">
                          {winner.bidder?.name ||
                            winner.bidder?.email ||
                            "Unknown"}
                        </div>
                        <div className="text-xs text-yellow-100/60">
                          {new Date(winner.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={
                          auction.type === "reverse"
                            ? "text-green-300 font-bold"
                            : "text-yellow-300 font-bold"
                        }
                      >
                        ₹{winner.amount}
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-100/60 mt-2">
                      No bids were placed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Bid panel */}
        <aside className="bg-[#070707]/70 border border-yellow-900 p-6 rounded-xl shadow-lg">
          <div>
            <div className="text-sm text-yellow-100/80">Current Minimum</div>
            <div className="text-2xl font-bold text-yellow-300">
              ₹{minRequired ?? "-"}
            </div>
            <div className="mt-3 text-xs text-yellow-100/60">
              Type: {auction.type}
            </div>
            {auction.type === "reverse" && (
              <div className="mt-1 text-green-300 text-xs">
                🔻 Lowest bid wins this auction
              </div>
            )}
          </div>

          <div className="mt-6">
            <BidForm
              minRequired={minRequired}
              type={auction.type}
              onSubmit={placeBid}
              disabled={status !== "live"}
            />
            {status !== "live" && (
              <div className="mt-2 text-xs text-yellow-100/60">
                Bids accepted only while auction is live.
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-yellow-200 font-semibold mb-3">Bid History</h4>
            <div className="max-h-80 overflow-auto">
              <BidList bids={bids} type={auction.type} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
