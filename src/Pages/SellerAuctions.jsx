// src/Pages/SellerAuctions.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import {
  HiClock,
  HiCheckCircle,
  HiOutlineClock,
  HiRefresh,
  HiX,
  HiPlus,
} from "react-icons/hi"; // hi2 set if available; fallback to hi if not
import { formatDistanceToNowStrict } from "date-fns";

const normalizeSellerId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.id || null;
  return null;
};

const isAuctionLive = (a, now = new Date()) => {
  // Prefer explicit status if backend sets it
  if (a?.status === "live") return true;
  if (a?.status === "ended" || a?.status === "closed") return false;

  // Fallback to time check
  const start = a?.startAt ? new Date(a.startAt) : null;
  const end = a?.endAt ? new Date(a.endAt) : null;
  if (!start || !end) return false;
  return start <= now && end >= now;
};

const isAuctionUpcoming = (a, now = new Date()) => {
  if (a?.status === "upcoming") return true;
  const start = a?.startAt ? new Date(a.startAt) : null;
  if (!start) return false;
  return start > now;
};

const isAuctionEnded = (a, now = new Date()) => {
  if (a?.status === "closed" || a?.status === "ended") return true;
  const end = a?.endAt ? new Date(a.endAt) : null;
  if (!end) return false;
  return end < now;
};

/* ---------- Components ---------- */

function Badge({ children, color = "bg-gray-300 text-black" }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs rounded-full ${color} font-semibold`}
    >
      {children}
    </span>
  );
}

function SmallSpinner({ size = 4 }) {
  return (
    <div
      style={{ width: size * 4, height: size * 4 }}
      className="border-2 border-white/30 border-t-white rounded-full animate-spin"
    />
  );
}

/* Re-list modal: create new auction quickly for a product */
function ReListModal({ open, onClose, product, token, onCreated }) {
  const [form, setForm] = useState({
    productId: product?._id || product?.id || "",
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
        productId: product._id || product.id,
        startPrice: product.startPrice || f.startPrice || "",
      }));
      setError("");
    }
  }, [product]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

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
      setError(
        err?.response?.data?.message || err.message || "Failed to create"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold">♻️ Re-list Product</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10"
            aria-label="close"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 text-sm text-white/70">{product?.title}</div>

        {error && <div className="mb-3 text-sm text-rose-300">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Auction Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6 border border-white/10"
            >
              <option value="traditional">Traditional</option>
              <option value="reverse">Reverse</option>
              <option value="sealed">Sealed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Min Increment</label>
            <input
              name="minIncrement"
              value={form.minIncrement}
              onChange={handleChange}
              type="number"
              className="w-full p-3 rounded bg-white/6 border border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Start Price (₹)</label>
            <input
              name="startPrice"
              value={form.startPrice}
              onChange={handleChange}
              type="number"
              className="w-full p-3 rounded bg-white/6 border border-white/10"
            />
          </div>

          <div />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-sm mb-1">Start At</label>
            <input
              name="startAt"
              value={form.startAt}
              onChange={handleChange}
              type="datetime-local"
              className="w-full p-3 rounded bg-white/6 border border-white/10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End At</label>
            <input
              name="endAt"
              value={form.endAt}
              onChange={handleChange}
              type="datetime-local"
              className="w-full p-3 rounded bg-white/6 border border-white/10"
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
            className="px-4 py-2 rounded bg-green-600 flex items-center gap-2"
          >
            {saving ? (
              <SmallSpinner />
            ) : (
              <>
                <HiPlus /> Create Auction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function SellerAuctions() {
  const { user, token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]); // seller's products
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [relistOpen, setRelistOpen] = useState(false);
  const [relistProduct, setRelistProduct] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(0);

  // loader — fetch auctions + seller's products
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // fetch auctions public endpoint (supports query)
        const [aRes, pRes] = await Promise.all([
          api.get("/auctions?my=true", {
            headers: { Authorization: `Bearer ${token}` },
          }), // should work without auth for listing
          api.get("/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // handle shapes: array OR { auctions, total, ... }
        const rawAuctions = Array.isArray(aRes.data)
          ? aRes.data
          : aRes.data?.auctions || [];

        const rawProducts = Array.isArray(pRes.data)
          ? pRes.data
          : pRes.data?.products || [];

        // normalize: ensure every auction has product populated with object if possible
        // Some backends return auction.product as id (string). We'll map product objects by id.
        const productMap = new Map();
        for (const p of rawProducts) {
          const id = p._id || p.id;
          if (id) productMap.set(String(id), p);
        }

        // Build seller-specific lists (only auctions created by this seller)
        const sellerId = normalizeSellerId(user) || null;

        const myAuctions = rawAuctions
          .map((a) => {
            // make defensive copy
            const obj = { ...(a || {}) };

            // normalize product field: some backends use product or productId
            const prodRef =
              obj.product || obj.productId || obj.product_id || null;

            // If product is id string and we have productMap, attach product object
            if (typeof prodRef === "string" && productMap.has(prodRef)) {
              obj.product = productMap.get(prodRef);
            } else if (prodRef && typeof prodRef === "object") {
              // ensure product has id/_id
              const id = prodRef._id || prodRef.id;
              if (!obj.product && id && productMap.has(String(id))) {
                obj.product = productMap.get(String(id));
              } else {
                obj.product = prodRef;
              }
            }

            // normalize seller property
            obj.seller = obj.seller || obj.sellerId || obj.seller_id || null;

            return obj;
          })
          .filter((a) => {
            // filter auctions by seller id (supports different shapes)
            const s = normalizeSellerId(a.seller);
            return s && sellerId && s === sellerId;
          });

        // Keep seller's products only (for inventory / re-list)
        const myProducts = rawProducts.filter((p) => {
          const s = normalizeSellerId(p.seller);
          return s && sellerId && s === sellerId;
        });

        if (!mounted) return;
        setAuctions(myAuctions);
        setProducts(myProducts);
      } catch (err) {
        console.error("Load seller auctions error:", err);
        setError(
          err?.response?.data?.message || err.message || "Failed to load"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token, user, refreshToggle]);

  const refresh = () => setRefreshToggle((s) => s + 1);

  // counts computed robustly: prefer explicit status, fallback to time windows
  const counts = useMemo(() => {
    const now = new Date();

    const live = auctions.filter(
      (a) =>
        new Date(a.startAt) <= now &&
        new Date(a.endAt) >= now &&
        a.status !== "closed"
    ).length;

    const upcoming = auctions.filter(
      (a) => new Date(a.startAt) > now && a.status !== "closed"
    ).length;

    const ended = auctions.filter(
      (a) => a.status === "closed" || new Date(a.endAt) < now
    ).length;

    const unsold = products.filter(
      (p) => p.inventoryCount > 0 && p.status !== "sold"
    ).length;

    return { live, upcoming, ended, unsold };
  }, [auctions, products]);

  // Close auction immediately endpoint (seller only)
  const closeNow = async (auctionId) => {
    if (!confirm("Close this auction now? This will finalize the auction."))
      return;
    setActionLoadingId(auctionId);
    try {
      await api.put(
        `/auctions/${auctionId}/status`,
        { status: "closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refresh();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to close");
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
    if (a?.status === "closed" || isAuctionEnded(a, now)) {
      return <Badge color="bg-rose-300">Ended</Badge>;
    } else if (a?.status === "upcoming" || isAuctionUpcoming(a, now)) {
      return <Badge color="bg-yellow-300">Upcoming</Badge>;
    } else {
      return <Badge color="bg-green-300">Live</Badge>;
    }
  };

  // Small helper to show primary image (safe)
  const primaryImage = (product) => {
    if (!product) return null;
    if (Array.isArray(product.images) && product.images.length > 0)
      return product.images[0];
    if (product.image) return product.image;
    return null;
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold">Seller Auctions</h1>
            <p className="text-white/70 mt-1">
              Manage & monitor all auctions you created — live, upcoming, and
              ended.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition"
            >
              <HiRefresh className="w-5 h-5" /> Refresh
            </button>

            <button
              onClick={() => (window.location.href = "/seller/create-auction")}
              className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-400 text-black font-semibold"
            >
              <HiPlus className="w-5 h-5" /> + Create Auction
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow">
            <div className="text-sm text-white/70">Live</div>
            <div className="text-2xl font-bold">{counts.live}</div>
            <div className="text-xs text-white/60 mt-1">Currently running</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow">
            <div className="text-sm text-white/70">Upcoming</div>
            <div className="text-2xl font-bold">{counts.upcoming}</div>
            <div className="text-xs text-white/60 mt-1">Scheduled</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow">
            <div className="text-sm text-white/70">Ended</div>
            <div className="text-2xl font-bold">{counts.ended}</div>
            <div className="text-xs text-white/60 mt-1">Completed</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow">
            <div className="text-sm text-white/70">Inventory (unsold)</div>
            <div className="text-2xl font-bold">{counts.unsold}</div>
            <div className="text-xs text-white/60 mt-1">Products available</div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-20 text-center">
            <SmallSpinner />
            <div className="mt-4 text-white/70">Loading auctions...</div>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-rose-300">{error}</div>
        ) : auctions.length === 0 ? (
          <div className="py-20 text-center text-white/70">
            No auctions found — create your first auction.
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
                    <tr key={a._id || a.id} className="border-t border-white/6">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-24 h-16 bg-black/30 rounded overflow-hidden">
                          {primaryImage(a.product) ? (
                            <img
                              src={primaryImage(a.product)}
                              alt={a.product?.title || "product"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {a.product?.title || a.product?.name || "Untitled"}
                          </div>
                          <div className="text-sm text-white/60">
                            {a.product?.category ||
                              a.product?.categoryName ||
                              "-"}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 capitalize">{a.type || "-"}</td>

                      <td className="p-4">
                        <div className="text-lg font-semibold">
                          ₹{a.startPrice ?? "-"}
                        </div>
                        <div className="text-xs text-white/60">
                          inc {a.minIncrement ?? "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-sm">
                          {a.startAt
                            ? new Date(a.startAt).toLocaleString()
                            : "-"}
                        </div>
                        <div className="text-xs text-white/60">
                          ends{" "}
                          {a.endAt ? new Date(a.endAt).toLocaleString() : "-"}
                        </div>
                      </td>

                      <td className="p-4">{renderStatus(a)}</td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/auction/${
                                a._id || a.id
                              }`)
                            }
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
                          >
                            View
                          </button>

                          <button
                            disabled={actionLoadingId === (a._id || a.id)}
                            onClick={() => closeNow(a._id || a.id)}
                            className="px-3 py-1 rounded bg-rose-500 hover:bg-rose-600"
                          >
                            {actionLoadingId === (a._id || a.id) ? (
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

            {/* Mobile / small screens cards */}
            <div className="grid lg:hidden grid-cols-1 gap-4">
              {auctions.map((a) => {
                const now = new Date();
                const startLabel = a.startAt
                  ? formatDistanceToNowStrict(new Date(a.startAt), {
                      addSuffix: true,
                    })
                  : "-";
                const endLabel = a.endAt
                  ? formatDistanceToNowStrict(new Date(a.endAt), {
                      addSuffix: true,
                    })
                  : "-";
                return (
                  <div
                    key={a._id || a.id}
                    className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-16 bg-black/30 rounded overflow-hidden">
                        {primaryImage(a.product) ? (
                          <img
                            src={primaryImage(a.product)}
                            alt={a.product?.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold">
                          {a.product?.title || "Untitled"}
                        </div>
                        <div className="text-xs text-white/60">
                          {a.product?.category || "-"}
                        </div>

                        <div className="mt-2 text-sm">
                          <div>
                            Start:{" "}
                            <span className="font-medium">{startLabel}</span>
                          </div>
                          <div>
                            End: <span className="font-medium">{endLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>{renderStatus(a)}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/auction/${a._id || a.id}`)
                          }
                          className="px-3 py-1 rounded bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          disabled={actionLoadingId === (a._id || a.id)}
                          onClick={() => closeNow(a._id || a.id)}
                          className="px-3 py-1 rounded bg-rose-500"
                        >
                          {actionLoadingId === (a._id || a.id) ? (
                            <SmallSpinner />
                          ) : (
                            "Close"
                          )}
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
                );
              })}
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
