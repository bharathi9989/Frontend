// src/Pages/SellerAuctions.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import {
  HiClock,
  HiCheckCircle,
  HiOutlineClock,
  HiRefresh,
} from "react-icons/hi";
import { formatDistanceToNowStrict } from "date-fns";

/**
 * Senior-level Seller Auctions page (glass UI, animations)
 *
 * Requirements:
 * - must have AuthContext with { user, token }
 * - api is axios instance pointing to /api base
 *
 * Route suggestion: /seller/auctions
 */

function Badge({ children, color = "bg-gray-500" }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs rounded-full ${color} text-black/90 font-semibold`}
    >
      {children}
    </span>
  );
}

function SmallSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

/* ReList modal - create quick auction for the product */
function ReListModal({ open, onClose, product, token, onCreated }) {
  const [form, setForm] = useState({
    productId: product?._id || "",
    type: "traditional",
    startPrice: product?.startPrice || "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setForm((f) => ({
        ...f,
        productId: product._id,
        startPrice: product.startPrice || "",
      }));
      setError("");
    }
  }, [product]);

  if (!open) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.productId || !form.startAt || !form.endAt) {
      setError("Please fill required fields.");
      return;
    }
    setSaving(true);
    try {
      await api.post(
        "/auctions",
        {
          productId: form.productId,
          type: form.type,
          startPrice: Number(form.startPrice),
          minIncrement: Number(form.minIncrement),
          startAt: form.startAt,
          endAt: form.endAt,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create auction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-lg bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white"
      >
        <h3 className="text-2xl font-bold mb-3">
          ♻️ Re-list Product: {product?.title}
        </h3>

        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}

        <label className="block text-sm mb-1">Auction Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-3 rounded mb-3 bg-white/6 border border-white/10"
        >
          <option value="traditional">Traditional</option>
          <option value="reverse">Reverse</option>
          <option value="sealed">Sealed</option>
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm mb-1 block">Start Price</label>
            <input
              name="startPrice"
              value={form.startPrice}
              onChange={handleChange}
              type="number"
              className="w-full p-2 rounded bg-white/6 border border-white/10"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Min Increment</label>
            <input
              name="minIncrement"
              value={form.minIncrement}
              onChange={handleChange}
              type="number"
              className="w-full p-2 rounded bg-white/6 border border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-sm mb-1 block">Start At</label>
            <input
              name="startAt"
              value={form.startAt}
              onChange={handleChange}
              type="datetime-local"
              className="w-full p-2 rounded bg-white/6 border border-white/10"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">End At</label>
            <input
              name="endAt"
              value={form.endAt}
              onChange={handleChange}
              type="datetime-local"
              className="w-full p-2 rounded bg-white/6 border border-white/10"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-green-600"
          >
            {saving ? <SmallSpinner /> : "Create Auction"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SellerAuctions() {
  const { user, token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [relistOpen, setRelistOpen] = useState(false);
  const [relistProduct, setRelistProduct] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // fetch auctions (public endpoint)
        const [aRes, pRes] = await Promise.all([
          api.get("/auctions"),
          api.get("/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // aRes.data may be { auctions, total, ... } or array (depending on backend)
        let list = Array.isArray(aRes.data)
          ? aRes.data
          : aRes.data.auctions || [];
        let prodList = Array.isArray(pRes.data)
          ? pRes.data
          : pRes.data.products || [];

        // filter only seller's auctions & populate product if missing
        const myAuctions = list.filter((a) => {
          const sellerId = a.seller?._id || a.seller || a.seller?.id;
          return sellerId === (user?._id || user?.id);
        });

        // keep products list (seller's products)
        const myProducts = prodList.filter((p) => {
          const s = p.seller;
          if (!s) return false;
          if (typeof s === "string") return s === (user?._id || user?.id);
          if (s._id) return s._id === (user?._id || user?.id);
          return false;
        });

        if (!mounted) return;
        setAuctions(myAuctions);
        setProducts(myProducts);
      } catch (err) {
        console.error("Load seller auctions error:", err);
        setError(err?.response?.data?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [token, user, refreshToggle]);

  const refresh = () => setRefreshToggle((s) => s + 1);

  const counts = useMemo(() => {
    const now = new Date();
    const live = auctions.filter(
      (a) => new Date(a.startAt) <= now && new Date(a.endAt) >= now
    ).length;
    const upcoming = auctions.filter((a) => new Date(a.startAt) > now).length;
    const ended = auctions.filter((a) => new Date(a.endAt) < now).length;
    const unsold = products.filter((p) => p.status !== "sold").length;
    return { live, upcoming, ended, unsold };
  }, [auctions, products]);

  const closeNow = async (auctionId) => {
    if (!confirm("Close this auction now?")) return;
    setActionLoadingId(auctionId);
    try {
      await api.put(
        `/auctions/${auctionId}/status`,
        { status: "closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refresh();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to close");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRelist = (product) => {
    setRelistProduct(product);
    setRelistOpen(true);
  };

  const renderStatus = (a) => {
    const now = new Date();
    const start = new Date(a.startAt);
    const end = new Date(a.endAt);
    if (a.status === "closed" || end < now)
      return <Badge color="bg-rose-400">Ended</Badge>;
    if (start > now) return <Badge color="bg-yellow-300">Upcoming</Badge>;
    return <Badge color="bg-green-300">Live</Badge>;
  };

  return (
    <div className="min-h-screen pt-28 pb-16 bg-linear-to-br from-[#0b1220] to-[#0f1724] text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold">Seller Auctions</h1>
            <p className="text-white/70 mt-1">
              Manage & monitor all auctions you created
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition flex items-center gap-2"
            >
              <HiRefresh /> Refresh
            </button>
            <button
              onClick={() => (window.location.href = "/seller/create-auction")}
              className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold"
            >
              + Create Auction
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <div className="text-sm text-white/70">Live</div>
            <div className="text-2xl font-bold">{counts.live}</div>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <div className="text-sm text-white/70">Upcoming</div>
            <div className="text-2xl font-bold">{counts.upcoming}</div>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <div className="text-sm text-white/70">Ended</div>
            <div className="text-2xl font-bold">{counts.ended}</div>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <div className="text-sm text-white/70">Inventory (unsold)</div>
            <div className="text-2xl font-bold">{counts.unsold}</div>
          </div>
        </div>

        {/* TABLE / CARDS */}
        {loading ? (
          <div className="py-20 text-center">
            <SmallSpinner />
            <div className="mt-4 text-white/70">Loading auctions...</div>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-300">{error}</div>
        ) : auctions.length === 0 ? (
          <div className="py-20 text-center text-white/70">
            No auctions found — create your first auction
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="text-white/60 text-left">
                  <tr>
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
                    <tr key={a._id} className="border-t border-white/6">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-20 h-14 bg-black/30 rounded overflow-hidden">
                          {a.product?.images?.[0] ? (
                            <img
                              src={a.product.images[0]}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {a.product?.title}
                          </div>
                          <div className="text-sm text-white/60">
                            {a.product?.category}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">{a.type}</td>
                      <td className="p-4">
                        ₹{a.startPrice}{" "}
                        <div className="text-xs text-white/60">
                          inc {a.minIncrement}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(a.startAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/60">
                          ends {new Date(a.endAt).toLocaleString()}
                        </div>
                      </td>

                      <td className="p-4">{renderStatus(a)}</td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/auction/${a._id}`)
                            }
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
                          >
                            View
                          </button>

                          <button
                            disabled={actionLoadingId === a._id}
                            onClick={() => closeNow(a._id)}
                            className="px-3 py-1 rounded bg-rose-500 hover:bg-rose-600"
                          >
                            {actionLoadingId === a._id ? (
                              <SmallSpinner />
                            ) : (
                              "Close Now"
                            )}
                          </button>

                          <button
                            onClick={() => openRelist(a.product)}
                            className="px-3 py-1 rounded bg-yellow-300 text-black"
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

            {/* Mobile cards */}
            <div className="grid lg:hidden grid-cols-1 gap-4">
              {auctions.map((a) => (
                <div
                  key={a._id}
                  className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-16 bg-black/30 rounded overflow-hidden">
                      {a.product?.images?.[0] ? (
                        <img
                          src={a.product.images[0]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold">{a.product?.title}</div>
                      <div className="text-xs text-white/60">
                        {a.product?.category}
                      </div>
                      <div className="text-sm mt-1">
                        Start:{" "}
                        {formatDistanceToNowStrict(new Date(a.startAt), {
                          addSuffix: true,
                        })}
                      </div>
                      <div className="text-sm">
                        End:{" "}
                        {formatDistanceToNowStrict(new Date(a.endAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>{renderStatus(a)}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          (window.location.href = `/auction/${a._id}`)
                        }
                        className="px-3 py-1 rounded bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        disabled={actionLoadingId === a._id}
                        onClick={() => closeNow(a._id)}
                        className="px-3 py-1 rounded bg-rose-500"
                      >
                        {actionLoadingId === a._id ? <SmallSpinner /> : "Close"}
                      </button>
                      <button
                        onClick={() => openRelist(a.product)}
                        className="px-3 py-1 rounded bg-yellow-300 text-black"
                      >
                        Re-list
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ReListModal
        open={relistOpen}
        onClose={() => setRelistOpen(false)}
        product={relistProduct}
        token={token}
        onCreated={() => {
          setRelistOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
