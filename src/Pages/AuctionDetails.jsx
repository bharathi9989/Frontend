// src/pages/AuctionDetailsDark.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket"; // ensure this exists

/* =========================
   Helper components (inline)
   - BidForm: handles input + validation
   - BidList: shows bids (sorted by type)
   ========================= */
function BidForm({ minRequired, onSubmit, disabled }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (disabled) return alert("Auction not live");
    const amount = Number(val);
    if (!amount || amount <= 0) return alert("Enter valid amount");
    if (minRequired != null && amount < minRequired)
      return alert(`Bid must be at least ₹${minRequired}`);
    setBusy(true);
    try {
      await onSubmit(amount);
      setVal("");
    } catch (err) {
      alert(err?.message || "Bid failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-3">
      <input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={minRequired ? `Min ₹${minRequired}` : "Enter bid amount"}
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

function BidList({ bids = [], type = "traditional" }) {
  if (!bids || bids.length === 0)
    return <div className="text-yellow-200/40">No bids yet</div>;

  const sorted =
    type === "reverse"
      ? [...bids].sort((a, b) => a.amount - b.amount)
      : [...bids].sort((a, b) => b.amount - a.amount);

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
          <div className="text-yellow-300 font-bold">₹{b.amount}</div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   Main component
   ========================= */
export default function AuctionDetailsDark() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null); // {type, days,hours,minutes,seconds}
  const socketRef = useRef(null);

  // ---------- helper: compute status ----------
  const computeStatus = (a) => {
    if (!a) return "unknown";
    const now = new Date();
    const start = new Date(a.startAt);
    const end = new Date(a.endAt);

    if (a.status === "closed") return "closed"; // respect persisted status
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "live";
  };

  // ---------- compute min required bid based on auction type ----------
  const computeMinRequired = (a, bidsList) => {
    if (!a) return null;
    if (a.type === "reverse") {
      if (!bidsList || bidsList.length === 0) return a.startPrice;
      const lowest = Math.min(...bidsList.map((x) => Number(x.amount)));
      return Math.max(0, lowest - (a.minIncrement || 0));
    } else {
      if (!bidsList || bidsList.length === 0) return a.startPrice;
      const highest = Math.max(...bidsList.map((x) => Number(x.amount)));
      return highest + (a.minIncrement || 0);
    }
  };

  // ---------- compute winner client-side if auction ended/closed ----------
  const computeWinner = (a, bidsList) => {
    if (!a || !bidsList || bidsList.length === 0) return null;
    if (a.type === "reverse") {
      // lowest wins
      const lowest = bidsList.reduce(
        (acc, b) => (b.amount < acc.amount ? b : acc),
        bidsList[0]
      );
      return lowest;
    } else {
      // traditional/sealed: highest wins
      const highest = bidsList.reduce(
        (acc, b) => (b.amount > acc.amount ? b : acc),
        bidsList[0]
      );
      return highest;
    }
  };

  // ---------- load auction, product and bids ----------
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // GET /api/auctions/:id (should return { auction, bids } or auction)
        const res = await api.get(`/auctions/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const payload = res.data;
        // accept either { auction, bids } or auction object
        const a = payload.auction || payload;
        if (!mounted) return;
        setAuction(a);

        // Handle product: could be populated object OR id
        const productCandidate = a.product || a.productId || a.product;
        if (
          productCandidate &&
          typeof productCandidate === "object" &&
          productCandidate.title
        ) {
          setProduct(productCandidate);
        } else if (productCandidate) {
          // try GET /api/products/:id (if exists), fallback to /api/products then filter
          const pid = productCandidate.toString
            ? productCandidate.toString()
            : productCandidate;
          try {
            const pRes = await api.get(`/products/${pid}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const p = pRes.data.product || pRes.data;
            setProduct(p);
          } catch (err) {
            // fallback fetch all and filter by id
            try {
              const all = await api.get("/products", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              const list = Array.isArray(all.data)
                ? all.data
                : all.data.products || [];
              const found = list.find(
                (pp) =>
                  pp._id === pid ||
                  pp.id === pid ||
                  (pp._id && pp._id.toString() === pid)
              );
              setProduct(found || null);
            } catch (err2) {
              setProduct(null);
            }
          }
        } else {
          setProduct(null);
        }

        // BIDS: use payload.bids if present else fetch /bids/:auctionId
        let incomingBids = payload.bids || payload.bids || [];
        if (!Array.isArray(incomingBids) || incomingBids.length === 0) {
          try {
            const br = await api.get(`/bids/${id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            incomingBids = Array.isArray(br.data)
              ? br.data
              : br.data.bids || [];
          } catch (err) {
            incomingBids = [];
          }
        }
        setBids(incomingBids);
      } catch (err) {
        console.error("Load auction error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // ---------- socket init & listeners (real-time updates) ----------
  useEffect(() => {
    initSocket(); // ensure connection
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket) return;

    socket.emit("joinAuction", id);

    const onNewBid = (payload) => {
      if (payload.auctionId !== id) return;
      const newBid = payload.bid || {
        _id:
          payload.bidId || payload.time || Math.random().toString(36).slice(2),
        amount: payload.amount,
        bidder: payload.bidder,
        createdAt: payload.time || new Date().toISOString(),
      };
      setBids((prev) => [newBid, ...prev]);
    };

    const onAuctionClosed = (payload) => {
      if (payload.auctionId !== id) return;
      // update auction status to closed
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

  // ---------- countdown timer ----------
  useEffect(() => {
    if (!auction) {
      setCountdown(null);
      return;
    }
    let mounted = true;
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(auction.endAt).getTime();
      const start = new Date(auction.startAt).getTime();
      if (now < start) {
        // upcoming countdown -> to start
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        if (mounted)
          setCountdown({ type: "starts_in", days, hours, minutes, seconds });
      } else if (now <= end) {
        // live countdown -> to end
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

  // ---------- place bid API ----------
  const placeBid = async (amount) => {
    if (!user) throw new Error("Login required to place bids");
    if (!auction) throw new Error("Auction not loaded");
    const status = computeStatus(auction);
    if (status !== "live") throw new Error("Auction is not live");

    try {
      await api.post(
        "/bids",
        { auctionId: id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // server will emit the newBid event; optimistic update handled by socket listener
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Bid failed";
      throw new Error(msg);
    }
  };

  // ---------- UI helpers ----------
  const status = auction ? computeStatus(auction) : "loading";
  const minRequired = computeMinRequired(auction, bids);
  const winner = computeWinner(auction, bids);

  // ---------- render ----------
  if (loading)
    return <div className="p-6 text-yellow-200">Loading auction...</div>;
  if (!auction)
    return <div className="p-6 text-yellow-200">Auction not found</div>;

  return (
    <div className="min-h-screen pt-28 p-6 bg-gradient-to-b from-black via-gray-900 to-[#070707] text-yellow-100">
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
                      <div className="text-yellow-300 font-bold">
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

          {/* LONG DESCRIPTION or other UI areas could go here */}
        </div>

        {/* RIGHT: Bid panel */}
        <aside className="bg-[#070707]/70 border border-yellow-900 p-6 rounded-xl shadow-lg">
          <div>
            <div className="text-sm text-yellow-100/80">Current Minimum</div>
            <div className="text-2xl font-bold text-yellow-300">
              ₹{minRequired}
            </div>
            <div className="mt-3 text-xs text-yellow-100/60">
              Type: {auction.type}
            </div>
          </div>

          <div className="mt-6">
            <BidForm
              minRequired={minRequired}
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
