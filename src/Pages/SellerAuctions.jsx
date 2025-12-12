// src/Pages/SellerAuctions.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import * as Icons from "react-icons/hi";
import { formatDistanceToNowStrict } from "date-fns";

/**
 * SellerAuctions.jsx
 * Single-file replacement — robust, production-ready UI for seller auctions.
 *
 * Expects:
 * - api.get("/auctions?my=true")  => seller auctions (or paged object { auctions, total })
 * - api.get("/products")          => seller products
 * - api.put("/auctions/:id/close", {}) => close auction immediately
 * - api.post("/auctions/relist")  => re-list product
 *
 * Notes:
 * - Uses existing `api` axios instance for baseURL/auth.
 * - Uses react-icons/hi via Icons.* (no named import mismatch).
 */

/* ---------------------- Utilities ---------------------- */

const normalizeSellerId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.id || null;
  return null;
};

const isAuctionLive = (a, now = new Date()) => {
  if (!a) return false;
  if (a.status === "live") return true;
  if (a.status === "closed" || a.status === "ended") return false;
  const start = a.startAt ? new Date(a.startAt) : null;
  const end = a.endAt ? new Date(a.endAt) : null;
  if (!start || !end) return false;
  return start <= now && end >= now;
};

const isAuctionUpcoming = (a, now = new Date()) => {
  if (!a) return false;
  if (a.status === "upcoming") return true;
  const start = a.startAt ? new Date(a.startAt) : null;
  if (!start) return false;
  return start > now;
};

const isAuctionEnded = (a, now = new Date()) => {
  if (!a) return false;
  if (a.status === "closed" || a.status === "ended") return true;
  const end = a.endAt ? new Date(a.endAt) : null;
  if (!end) return false;
  return end < now;
};

/* ---------------------- UI Small Pieces ---------------------- */

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

/* ---------------------- Countdown Hook & Flip UI ---------------------- */

/**
 * useCountdown(endAt)
 * returns "HH:MM:SS" string (updates every second), or empty string if no endAt.
 */
function useCountdown(endAt) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endAt) {
      setTimeLeft("");
      return;
    }
    let mounted = true;

    const update = () => {
      if (!mounted) return;
      const now = new Date();
      const end = new Date(endAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = String(Math.floor(totalSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
      const secs = String(totalSec % 60).padStart(2, "0");

      setTimeLeft(`${hours}:${mins}:${secs}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [endAt]);

  return timeLeft;
}

/**
 * FlipTimer - simple flip-like blocks for H:M:S
 * danger -> last 10 minutes
 */
function FlipTimer({ time }) {
  if (!time) return null;
  const [h, m, s] = time.split(":");
  const isDanger = Number(h) === 0 && Number(m) < 10;

  const Block = ({ val, label }) => (
    <div className="flex flex-col items-center mx-1">
      <div
        className={`relative w-14 h-16 rounded-lg flex items-center justify-center text-2xl font-extrabold shadow-md transform-gpu ${
          isDanger
            ? "bg-linear-to-br from-rose-700 to-rose-500 text-white animate-pulse"
            : "bg-black/80 text-white"
        }`}
      >
        {val}
      </div>
      <div className="text-[10px] text-white/50 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="flex items-center">
      <Block val={h} label="Hrs" />
      <div className="text-white/40 mx-1 font-bold">:</div>
      <Block val={m} label="Min" />
      <div className="text-white/40 mx-1 font-bold">:</div>
      <Block val={s} label="Sec" />
    </div>
  );
}

function LiveCountdown({ endAt }) {
  const time = useCountdown(endAt);
  return <FlipTimer time={time} />;
}

/* ---------------------- ReList Modal ---------------------- */

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
        startPrice: product.startPrice ?? f.startPrice ?? "",
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
        "/auctions/relist",
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
        err?.response?.data?.message || err.message || "Failed to re-list"
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
            <Icons.HiX className="w-5 h-5" />
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
                <Icons.HiPlus /> Create Auction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------------- Main Page ---------------------- */

export default function SellerAuctions() {
  const { user, token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]); // seller products
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [relistOpen, setRelistOpen] = useState(false);
  const [relistProduct, setRelistProduct] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(0);

  // If your backend uses different path change these constants:
  const CLOSE_PATH = (id) => `/auctions/${id}/close`;
  const RELIST_PATH = `/auctions/relist`;

  // Load auctions + products for seller
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [aRes, pRes] = await Promise.all([
          api.get("/auctions?my=true", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const rawAuctions = Array.isArray(aRes.data)
          ? aRes.data
          : aRes.data?.auctions || [];

        const rawProducts = Array.isArray(pRes.data)
          ? pRes.data
          : pRes.data?.products || [];

        // product map to attach when auction.product is just id
        const productMap = new Map();
        for (const p of rawProducts) {
          const id = p._id || p.id;
          if (id) productMap.set(String(id), p);
        }

        const sellerId = normalizeSellerId(user) || null;

        const myAuctions = rawAuctions
          .map((a) => {
            const obj = { ...(a || {}) };

            const prodRef =
              obj.product || obj.productId || obj.product_id || null;
            if (typeof prodRef === "string" && productMap.has(prodRef)) {
              obj.product = productMap.get(prodRef);
            } else if (prodRef && typeof prodRef === "object") {
              const id = prodRef._id || prodRef.id;
              if (id && productMap.has(String(id))) {
                obj.product = productMap.get(String(id));
              } else {
                obj.product = prodRef;
              }
            } else {
              // no product attached, keep null to display fallback
              obj.product = null;
            }

            obj.seller = obj.seller || obj.sellerId || obj.seller_id || null;
            return obj;
          })
          .filter((a) => {
            // Only seller's auctions (defensive)
            const s = normalizeSellerId(a.seller);
            return s && sellerId && s === sellerId;
          });

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

  // counts
  const counts = useMemo(() => {
    const now = new Date();
    const live = auctions.filter((a) => isAuctionLive(a, now)).length;
    const upcoming = auctions.filter((a) => isAuctionUpcoming(a, now)).length;
    const ended = auctions.filter((a) => isAuctionEnded(a, now)).length;
    const unsold = products.filter(
      (p) => (p.inventoryCount ?? 0) > 0 && p.status !== "sold"
    ).length;
    return { live, upcoming, ended, unsold };
  }, [auctions, products]);

  // Close auction now (seller-only). Uses CLOSE_PATH function above.
  const closeNow = async (auctionId) => {
    if (!confirm("Close this auction now? This will finalize the auction."))
      return;

    setActionLoadingId(auctionId);
    try {
      const res = await api.put(
        CLOSE_PATH(auctionId),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // success
      refresh();
      return res.data;
    } catch (err) {
      console.error("Close auction failed: ", err);
      // common case: auction already closed -> backend may respond 400 or 409
      const serverMessage = err?.response?.data?.message;
      if (
        err?.response?.status === 400 ||
        err?.response?.status === 409 ||
        /already closed/i.test(serverMessage || "")
      ) {
        alert(serverMessage || "Auction already closed.");
        // ensure UI reflects actual state
        refresh();
      } else {
        alert(serverMessage || err.message || "Failed to close auction.");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRelist = (product) => {
    if (!product) {
      alert("Product missing — cannot re-list. Fix product first.");
      return;
    }
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

  const primaryImage = (product) => {
    if (!product) return null;
    if (Array.isArray(product.images) && product.images.length)
      return product.images[0];
    if (product.image) return product.image;
    return null;
  };

  /* ---------------------- Render ---------------------- */

  return (
    <div className="min-h-screen pt-28 pb-24 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
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
              <Icons.HiRefresh className="w-5 h-5" /> Refresh
            </button>

            <button
              onClick={() => (window.location.href = "/seller/create-auction")}
              className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-400 text-black font-semibold"
            >
              <Icons.HiPlus className="w-5 h-5" /> + Create Auction
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
                            {a.product?.title ||
                              a.product?.name ||
                              "(Product missing)"}
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

                      {/* Timing cell with live countdown */}
                      <td className="p-4">
                        <div className="text-xs text-white/50">
                          Starts:{" "}
                          {a.startAt
                            ? new Date(a.startAt).toLocaleString()
                            : "-"}
                        </div>

                        {isAuctionLive(a) ? (
                          <div className="mt-2">
                            <div className="text-xs text-white/60 mb-1">
                              Ends In:
                            </div>
                            <LiveCountdown endAt={a.endAt} />
                          </div>
                        ) : (
                          <div className="text-xs text-white/40 mt-2">
                            Ends:{" "}
                            {a.endAt ? new Date(a.endAt).toLocaleString() : "-"}
                          </div>
                        )}
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
                            disabled={a.product?.status !== "unsold"}
                            onClick={() => openRelist(a.product)}
                            className={`px-3 py-1 rounded text-black ${
                              a.product?.status === "unsold"
                                ? "bg-yellow-300"
                                : "bg-gray-500 cursor-not-allowed"
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

            {/* Mobile cards */}
            <div className="grid lg:hidden grid-cols-1 gap-4">
              {auctions.map((a) => {
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
                          {a.product?.title || "(Product missing)"}
                        </div>
                        <div className="text-xs text-white/60">
                          {a.product?.category || "-"}
                        </div>

                        <div className="mt-2">
                          {isAuctionLive(a) ? (
                            <>
                              <div className="text-xs text-white/60 mb-1">
                                Ends In:
                              </div>
                              <LiveCountdown endAt={a.endAt} />
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-white/50">
                                Starts:{" "}
                                <span className="font-medium">
                                  {startLabel}
                                </span>
                              </div>
                              <div className="text-xs text-white/50">
                                Ends:{" "}
                                <span className="font-medium">{endLabel}</span>
                              </div>
                            </>
                          )}
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
