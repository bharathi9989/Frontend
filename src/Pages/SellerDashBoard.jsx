// src/pages/SellerDashboard.jsx
import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";
import { Link, useNavigate } from "react-router-dom";

export default function SellerDashboard() {
  const { user, token } = useContext(AuthContext);
  const nav = useNavigate();
  const socketRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [counts, setCounts] = useState({
    live: 0,
    upcoming: 0,
    ended: 0,
    inventory: 0,
  });
  const [error, setError] = useState(null);

  /* ---------------------- Fetch Seller Auctions ---------------------- */
  const fetchMyAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/auctions", {
        params: { my: true, limit: 100, page: 1 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data?.auctions || [];
      setAuctions(list);

      /* ----- Compute Counts ----- */
      let live = 0,
        upcoming = 0,
        ended = 0;

      const now = new Date();
      for (const a of list) {
        const start = new Date(a.startAt);
        const end = new Date(a.endAt);

        let status = a.status;
        if (!status) {
          if (now < start) status = "upcoming";
          else if (now > end) status = "closed";
          else status = "live";
        }

        if (status === "live") live++;
        else if (status === "upcoming") upcoming++;
        else if (status === "closed") ended++;
      }

      /* ----- Inventory Count: count unsold products of this seller ----- */
      const pRes = await api.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const products = Array.isArray(pRes.data)
        ? pRes.data
        : pRes.data?.products || [];

      const inventory = products.filter(
        (p) =>
          String(p.seller?._id || p.seller) === String(user._id) &&
          p.status !== "sold"
      ).length;

      setCounts({ live, upcoming, ended, inventory });
    } catch (err) {
      console.error("SellerDashboard fetch error:", err);
      setError(
        err?.response?.data?.message || "Failed to load seller auctions"
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  /* ---------------------- Socket Initialization ---------------------- */
  useEffect(() => {
    initSocket();
    let socket;

    try {
      socket = getSocket();
      socketRef.current = socket;
    } catch {
      socket = null;
    }

    if (socket) {
      // When an auction closes → update UI
      socket.on("auctionClosed", (payload) => {
        if (!payload || !payload.auctionId) return;

        setAuctions((prev) =>
          prev.map((a) =>
            String(a._id) === String(payload.auctionId)
              ? { ...a, status: "closed" }
              : a
          )
        );

        fetchMyAuctions();
      });

      // When new bid arrives → update lastBid (optional UI)
      socket.on("newBid", (payload) => {
        if (!payload || !payload.auctionId) return;

        setAuctions((prev) =>
          prev.map((a) =>
            String(a._id) === String(payload.auctionId)
              ? {
                  ...a,
                  lastBid: payload.bid?.amount || payload.amount || a.lastBid,
                }
              : a
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("auctionClosed");
        socket.off("newBid");
      }
    };
  }, [fetchMyAuctions]);

  /* ---------------------- Initial Load ---------------------- */
  useEffect(() => {
    fetchMyAuctions();
  }, [fetchMyAuctions]);

  /* ---------------------- Close Auction ---------------------- */
  const closeNow = async (auctionId) => {
    if (!window.confirm("Close auction now? This action is irreversible.")) {
      return;
    }

    try {
      setAuctions((prev) =>
        prev.map((a) =>
          String(a._id) === auctionId ? { ...a, closing: true } : a
        )
      );

      const res = await api.put(
        `/auctions/${auctionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAuctions((prev) =>
        prev.map((a) =>
          String(a._id) === auctionId
            ? { ...a, status: "closed", closing: false }
            : a
        )
      );

      fetchMyAuctions();
      alert(res.data?.message || "Auction closed");
    } catch (err) {
      console.error("closeNow error:", err);

      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 409
          ? "Auction already closed."
          : "Failed to close auction.");

      alert(message);

      setAuctions((prev) =>
        prev.map((a) =>
          String(a._id) === auctionId ? { ...a, closing: false } : a
        )
      );
    }
  };

  /* ---------------------- Helpers ---------------------- */
  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  /* ---------------------- Render ---------------------- */
  return (
    <div className="min-h-screen pt-28 p-6 bg-gradient-to-b from-black via-gray-900 to-[#070707] text-yellow-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchMyAuctions}
              className="px-4 py-2 bg-gray-800 rounded"
            >
              Refresh
            </button>

            <button
              onClick={() => nav("/seller/create-auction")}
              className="px-4 py-2 bg-yellow-500 text-black rounded"
            >
              + Create Auction
            </button>

            <Link
              to="/seller/auctions"
              className="px-4 py-2 bg-indigo-700 rounded"
            >
              Manage Auctions
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Live" value={counts.live} subtitle="Running now" />
          <StatCard
            title="Upcoming"
            value={counts.upcoming}
            subtitle="Scheduled"
          />
          <StatCard title="Ended" value={counts.ended} subtitle="Completed" />
          <StatCard
            title="Inventory (unsold)"
            value={counts.inventory}
            subtitle="Products available"
          />
        </div>

        {/* Auctions Table */}
        <div className="bg-[#070707]/70 border border-yellow-900 p-4 rounded">
          <div className="text-lg font-semibold mb-4">Your Latest Auctions</div>

          {loading ? (
            <div className="text-yellow-200">Loading...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : auctions.length === 0 ? (
            <div className="text-yellow-200">No auctions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-sm text-yellow-100/70">
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Start Price</th>
                    <th>Timing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {auctions.slice(0, 50).map((a) => (
                    <tr key={a._id} className="border-t border-yellow-900/10">
                      <td className="py-3">
                        <div className="font-semibold">
                          {a.product?.title || "Product"}
                        </div>
                        <div className="text-xs text-yellow-100/60">
                          {a.product?.category}
                        </div>
                      </td>

                      <td>{a.type}</td>

                      <td>
                        ₹{a.startPrice}
                        <div className="text-xs text-yellow-100/60">
                          inc {a.minIncrement}
                        </div>
                      </td>

                      <td className="text-xs">
                        <div>Starts: {fmt(a.startAt)}</div>
                        <div>Ends: {fmt(a.endAt)}</div>
                      </td>

                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            a.status === "closed"
                              ? "bg-red-600"
                              : a.status === "upcoming"
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      <td className="space-x-2">
                        <Link
                          to={`/auction/${a._id}`}
                          className="px-3 py-1 bg-blue-600 rounded text-sm"
                        >
                          View
                        </Link>

                        {a.status !== "closed" && (
                          <button
                            disabled={a.closing}
                            onClick={() => closeNow(a._id)}
                            className="px-3 py-1 bg-red-500 rounded text-sm"
                          >
                            {a.closing ? "Closing..." : "Close"}
                          </button>
                        )}

                        <Link
                          to={`/seller/auctions`}
                          className="px-3 py-1 bg-yellow-400 text-black rounded text-sm"
                        >
                          Re-list
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- StatCard ---------------------- */
function StatCard({ title, value, subtitle }) {
  return (
    <div className="p-4 bg-[#0b0b0b]/50 border border-yellow-900 rounded">
      <div className="text-xs text-yellow-100/70">{title}</div>
      <div className="text-2xl font-bold text-yellow-200">{value}</div>
      <div className="text-xs mt-1 text-yellow-100/60">{subtitle}</div>
    </div>
  );
}
