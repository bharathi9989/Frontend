// src/pages/SellerAuctions.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import * as Icons from "react-icons/hi";
import { formatDistanceToNowStrict } from "date-fns";

/* ============================================================
   UTILS
============================================================ */
const normalizeId = (v) =>
  typeof v === "string" ? v : v?._id || v?.id || v?.$id || null;

const isLive = (a) => {
  if (!a) return false;
  const now = new Date();
  const s = new Date(a.startAt);
  const e = new Date(a.endAt);
  return now >= s && now < e && a.status !== "closed";
};
const isUpcoming = (a) => new Date(a.startAt) > new Date();
const isEnded = (a) => new Date(a.endAt) < new Date() || a.status === "closed";

/* ============================================================
   COUNTDOWN HOOK
============================================================ */
function useCountdown(endAt) {
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(endAt);
      const diff = end - now;
      if (diff <= 0) return setTime("00:00:00");

      const sec = Math.floor(diff / 1000);
      const h = String(Math.floor(sec / 3600)).padStart(2, "0");
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return time;
}

function LiveCountdown({ endAt }) {
  const t = useCountdown(endAt);
  if (!t) return null;
  const [h, m, s] = t.split(":");
  return (
    <div className="flex gap-1 items-center text-white font-mono text-lg">
      {h}:{m}:{s}
    </div>
  );
}

/* ============================================================
   BADGE
============================================================ */
const Badge = ({ text, color }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
    {text}
  </span>
);

/* ============================================================
   RELIST MODAL
============================================================ */
function ReListModal({ open, onClose, product, token, onDone }) {
  const [form, setForm] = useState({
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (product) {
      setForm((f) => ({
        ...f,
        startPrice: f.startPrice || product.startPrice || "",
      }));
    }
  }, [product]);

  if (!open) return null;
  if (!product) return null;

  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.startAt || !form.endAt) {
      setErr("Start and End time required");
      return;
    }

    setSaving(true);
    try {
      await api.post(
        "/auctions/relist",
        {
          productId: product._id,
          type: form.type,
          startPrice: Number(form.startPrice),
          minIncrement: Number(form.minIncrement),
          startAt: form.startAt,
          endAt: form.endAt,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDone();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={submit}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white w-full max-w-lg"
      >
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-2xl font-bold">Re-list Product</h2>
          <button onClick={onClose}>
            <Icons.HiX className="text-white" />
          </button>
        </div>

        {err && <p className="text-rose-300 mb-3">{err}</p>}

        <label className="block mb-2 text-sm">Auction Type</label>
        <select
          name="type"
          value={form.type}
          onChange={change}
          className="w-full p-2 rounded bg-white/10 mb-4"
        >
          <option value="traditional">Traditional</option>
          <option value="reverse">Reverse</option>
          <option value="sealed">Sealed</option>
        </select>

        <label className="block mb-2 text-sm">Start Price</label>
        <input
          name="startPrice"
          value={form.startPrice}
          onChange={change}
          className="w-full p-2 rounded bg-white/10 mb-4"
        />

        <label className="block mb-2 text-sm">Min Increment</label>
        <input
          name="minIncrement"
          value={form.minIncrement}
          onChange={change}
          className="w-full p-2 rounded bg-white/10 mb-4"
        />

        <label className="block mb-2 text-sm">Start At</label>
        <input
          name="startAt"
          type="datetime-local"
          value={form.startAt}
          onChange={change}
          className="w-full p-2 rounded bg-white/10 mb-4"
        />

        <label className="block mb-2 text-sm">End At</label>
        <input
          name="endAt"
          type="datetime-local"
          value={form.endAt}
          onChange={change}
          className="w-full p-2 rounded bg-white/10 mb-4"
        />

        <button
          disabled={saving}
          className="w-full py-2 rounded bg-yellow-400 text-black font-semibold mt-4"
        >
          {saving ? "Saving..." : "Create Auction"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   MAIN PAGE: SellerAuctions
============================================================ */
export default function SellerAuctions() {
  const { user, token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoad, setActionLoad] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  const refresh = () => setLoading(true); // triggers reload because useEffect depends on loading

  /* -------------------------------
     LOAD DATA
  -------------------------------- */
  useEffect(() => {
    if (!loading) return;

    const loadData = async () => {
      try {
        const [aRes, pRes] = await Promise.all([
          api.get("/auctions?my=true", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const aList = aRes.data?.auctions || aRes.data || [];
        const pList = pRes.data?.products || pRes.data || [];

        setProducts(pList);

        // Ensure auction.product is populated
        const map = new Map(pList.map((p) => [p._id, p]));
        const finalAuctions = aList.map((a) => ({
          ...a,
          product: a.product?._id ? a.product : map.get(a.product) || null,
        }));

        setAuctions(finalAuctions);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loading, token]);

  /* -------------------------------
     CLOSE AUCTION
  -------------------------------- */
  const closeNow = async (id) => {
    if (!confirm("Close auction now?")) return;

    setActionLoad(id);
    try {
      await api.put(
        `/auctions/${id}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refresh();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed");
    } finally {
      setActionLoad(null);
    }
  };

  /* -------------------------------
     SUMMARY BOXES
  -------------------------------- */
  const counts = useMemo(() => {
    return {
      live: auctions.filter(isLive).length,
      upcoming: auctions.filter(isUpcoming).length,
      ended: auctions.filter(isEnded).length,
      unsold: products.filter((p) => p.status === "unsold").length,
    };
  }, [auctions, products]);

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#070D1A] text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Auctions</h1>
            <p className="text-white/60">Manage all your auctions.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
            >
              <Icons.HiRefresh className="inline-block mr-1" /> Refresh
            </button>
            <button
              onClick={() => (window.location.href = "/seller/create-auction")}
              className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded"
            >
              <Icons.HiPlus className="inline-block mr-1" /> Create Auction
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryBox title="Live" count={counts.live} color="text-green-300" />
          <SummaryBox
            title="Upcoming"
            count={counts.upcoming}
            color="text-yellow-300"
          />
          <SummaryBox
            title="Ended"
            count={counts.ended}
            color="text-rose-300"
          />
          <SummaryBox
            title="Unsold Products"
            count={counts.unsold}
            color="text-blue-300"
          />
        </div>

        {/* MAIN TABLE */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : auctions.length === 0 ? (
          <div className="text-center text-white/60 py-10">
            No auctions found.
          </div>
        ) : (
          <AuctionTable
            auctions={auctions}
            closeNow={closeNow}
            actionLoad={actionLoad}
            setModalOpen={setModalOpen}
            setModalProduct={setModalProduct}
          />
        )}
      </div>

      <ReListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={modalProduct}
        token={token}
        onDone={refresh}
      />
    </div>
  );
}

/* ============================================================
   SUMMARY BOX
============================================================ */
const SummaryBox = ({ title, count, color }) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
    <div className="text-sm text-white/60">{title}</div>
    <div className={`text-2xl font-bold ${color}`}>{count}</div>
  </div>
);

/* ============================================================
   TABLE VIEW
============================================================ */
const AuctionTable = ({
  auctions,
  closeNow,
  actionLoad,
  setModalOpen,
  setModalProduct,
}) => {
  const img = (p) =>
    p?.images?.[0] || "https://via.placeholder.com/150?text=No+Image";

  return (
    <div className="hidden lg:block bg-white/5 rounded-2xl border border-white/10">
      <table className="w-full">
        <thead>
          <tr className="text-white/60">
            <th className="p-4">Product</th>
            <th className="p-4">Type</th>
            <th className="p-4">Start Price</th>
            <th className="p-4">Timing</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {auctions.map((a) => (
            <tr key={a._id} className="border-t border-white/10">
              <td className="p-4 flex gap-3 items-center">
                <img
                  src={img(a.product)}
                  alt=""
                  className="w-24 h-16 rounded object-cover"
                />
                <div>
                  <div className="font-semibold">{a.product?.title}</div>
                  <div className="text-white/50 text-sm">
                    {a.product?.category}
                  </div>
                </div>
              </td>

              <td className="p-4 capitalize">{a.type}</td>

              <td className="p-4">
                <div className="font-semibold text-lg">₹{a.startPrice}</div>
                <div className="text-xs text-white/50">
                  min inc: {a.minIncrement}
                </div>
              </td>

              <td className="p-4">
                {isLive(a) ? (
                  <LiveCountdown endAt={a.endAt} />
                ) : (
                  <span className="text-sm text-white/50">
                    Ends{" "}
                    {formatDistanceToNowStrict(new Date(a.endAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </td>

              <td className="p-4">
                {isEnded(a) ? (
                  <Badge text="Ended" color="bg-rose-400/20 text-rose-300" />
                ) : isUpcoming(a) ? (
                  <Badge
                    text="Upcoming"
                    color="bg-yellow-400/20 text-yellow-300"
                  />
                ) : (
                  <Badge text="Live" color="bg-green-400/20 text-green-300" />
                )}
              </td>

              <td className="p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => (window.location.href = `/auction/${a._id}`)}
                    className="px-3 py-1 bg-blue-600 rounded"
                  >
                    View
                  </button>

                  <button
                    disabled={actionLoad === a._id}
                    onClick={() => closeNow(a._id)}
                    className="px-3 py-1 bg-rose-500 rounded"
                  >
                    {actionLoad === a._id ? "..." : "Close"}
                  </button>

                  <button
                    disabled={a.product?.status !== "unsold"}
                    onClick={() => {
                      setModalProduct(a.product);
                      setModalOpen(true);
                    }}
                    className={`px-3 py-1 rounded ${
                      a.product?.status === "unsold"
                        ? "bg-yellow-300 text-black"
                        : "bg-gray-600 opacity-50"
                    }`}
                  >
                    Re-list
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
