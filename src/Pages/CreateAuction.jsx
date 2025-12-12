// src/pages/CreateAuction.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import * as Icons from "react-icons/hi";

const STEPS = [
  { id: 1, key: "product", title: "Product" },
  { id: 2, key: "type", title: "Auction Type" },
  { id: 3, key: "pricing", title: "Pricing" },
  { id: 4, key: "schedule", title: "Schedule" },
];

function Toast({ kind = "info", message, onClose }) {
  if (!message) return null;
  const bg =
    kind === "success"
      ? "bg-green-600"
      : kind === "error"
      ? "bg-rose-600"
      : "bg-yellow-600";
  return (
    <div
      className={`fixed right-6 bottom-6 z-50 ${bg} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3`}
      role="status"
    >
      <div>{message}</div>
      <button
        onClick={onClose}
        className="opacity-80 hover:opacity-100 ml-2 text-sm"
        aria-label="close toast"
      >
        ✕
      </button>
    </div>
  );
}

export default function CreateAuction() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  const [serverErr, setServerErr] = useState("");

  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ msg: "", kind: "info" });

  const [form, setForm] = useState({
    productId: "",
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });

  // errors map
  const [errors, setErrors] = useState({});

  // load seller products (protected)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingProducts(true);
      try {
        const res = await api.get("/products", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { limit: 200, page: 1 },
        });

        // API may return array or { products: [] } or { data: { products: [] } }
        const data =
          Array.isArray(res.data) && res.data.length
            ? res.data
            : res.data?.products || res.data?.data || [];

        // we only want seller's products (defensive)
        const sellerProducts = data.filter((p) => {
          const pid = p._id || p.id;
          const sellerId =
            typeof p.seller === "string"
              ? p.seller
              : p.seller?._id || p.seller?.id;
          return String(sellerId) === String(user?._id || user?.id);
        });

        if (!mounted) return;
        setProducts(sellerProducts);
      } catch (err) {
        console.error("Failed to load products:", err);
        setServerErr(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load products"
        );
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    }

    if (user && token) load();
    else setLoadingProducts(false);

    return () => {
      mounted = false;
    };
  }, [user, token]);

  // preview derived product
  const selectedProduct = useMemo(() => {
    if (!form.productId) return null;
    return (
      products.find((p) => String(p._id || p.id) === String(form.productId)) ||
      null
    );
  }, [form.productId, products]);

  // small helper to set fields
  const setField = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  // validation returns boolean
  const validateStep = (step = activeStep) => {
    const err = {};
    // Product step
    if (step === 1) {
      if (!form.productId)
        err.productId = "Select a product or create one first.";
    }
    // Pricing step
    if (step === 3) {
      if (form.startPrice === "" || form.startPrice == null)
        err.startPrice = "Start price is required.";
      else if (Number(form.startPrice) < 0) err.startPrice = "Invalid price.";

      if (form.minIncrement === "" || form.minIncrement == null)
        err.minIncrement = "Min increment required.";
      else if (Number(form.minIncrement) < 0)
        err.minIncrement = "Invalid increment.";
    }
    // Schedule step
    if (step === 4) {
      if (!form.startAt) err.startAt = "Start date & time required.";
      if (!form.endAt) err.endAt = "End date & time required.";

      if (form.startAt && form.endAt) {
        const start = new Date(form.startAt);
        const end = new Date(form.endAt);
        if (isNaN(start.getTime())) err.startAt = "Invalid start time.";
        if (isNaN(end.getTime())) err.endAt = "Invalid end time.";
        if (start.getTime() >= end.getTime())
          err.endAt = "End must be after start.";
        // prevent extremely short auctions
        const diff = end.getTime() - start.getTime();
        if (diff < 60 * 1000)
          err.endAt = "Auction must be at least 1 minute long.";
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const goNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((s) => Math.min(4, s + 1));
  };
  const goPrev = () => setActiveStep((s) => Math.max(1, s - 1));
  const goto = (n) => {
    // allow backward jump always; forward jump only after validation of current step
    if (n > activeStep && !validateStep(activeStep)) return;
    setActiveStep(n);
  };

  // final submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    // final validate all steps
    let allOk = true;
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        allOk = false;
        setActiveStep(s);
        break;
      }
    }
    if (!allOk) return;

    setSubmitting(true);
    setServerErr("");
    setToast({ msg: "", kind: "info" });

    try {
      const payload = {
        productId: form.productId,
        type: form.type,
        startPrice: Number(form.startPrice),
        minIncrement: Number(form.minIncrement),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      };

      const res = await api.post("/auctions", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({
        msg: "Auction created successfully! Redirecting...",
        kind: "success",
      });

      // brief pause to show toast
      setTimeout(() => {
        navigate("/seller/auctions");
      }, 900);
    } catch (err) {
      console.error("Create auction failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create auction";
      setServerErr(msg);
      setToast({ msg, kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // quick helper to render product preview
  const ProductPreview = ({ product }) => {
    if (!product)
      return (
        <div className="p-4 text-center text-white/60">
          No product selected. <br />
          <Link to="/seller/create-product" className="underline">
            Create product
          </Link>
        </div>
      );

    return (
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex gap-4">
          <div className="w-28 h-20 bg-black/40 rounded overflow-hidden">
            {product.images?.length ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white/90">{product.title}</div>
            <div className="text-xs text-white/60">{product.category}</div>
            <div className="mt-2 text-sm text-white/70">
              {product.description?.slice(0, 120)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // small stepper item
  const StepItem = ({ s }) => {
    const active = activeStep === s.id;
    const done = activeStep > s.id;
    return (
      <button
        type="button"
        onClick={() => goto(s.id)}
        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
          active ? "bg-white/6" : done ? "bg-white/4" : "hover:bg-white/3"
        }`}
      >
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            active
              ? "bg-yellow-400 text-black"
              : done
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/80"
          }`}
        >
          {done ? "✓" : s.id}
        </div>
        <div>
          <div className="text-sm font-semibold">{s.title}</div>
          <div className="text-xs text-white/60">Step {s.id}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-24 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-start gap-6">
          {/* Sidebar */}
          <aside className="w-72 sticky top-28 hidden lg:block">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="text-lg font-bold">Create Auction</div>
              <div className="text-sm text-white/60">
                Follow the steps — quick & safe.
              </div>
              <div className="mt-3 space-y-2">
                {STEPS.map((s) => (
                  <StepItem key={s.id} s={s} />
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/6 space-y-2">
                <div className="text-xs text-white/60">Quick links</div>
                <Link
                  to="/seller/create-product"
                  className="block text-sm underline"
                >
                  + Create Product
                </Link>
                <Link to="/seller/auctions" className="block text-sm underline">
                  My Auctions
                </Link>
              </div>
            </div>
          </aside>

          {/* Form + preview */}
          <main className="flex-1">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* LEFT: main form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Product */}
                <section
                  className={`p-5 rounded-2xl border border-white/10 bg-white/5 ${
                    activeStep !== 1 ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">1. Select Product</h2>
                    <div className="text-sm text-white/60">Step 1</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-white/80">
                        Choose existing product
                      </label>
                      <select
                        name="productId"
                        value={form.productId}
                        onChange={(e) => setField("productId", e.target.value)}
                        className="w-full p-3 rounded bg-white/6 border border-white/10 mt-1"
                      >
                        <option value="">-- Select product --</option>
                        {products.map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.title} {p.status === "sold" ? "(sold)" : ""}
                          </option>
                        ))}
                      </select>
                      {errors.productId && (
                        <div className="text-rose-300 text-sm mt-1">
                          {errors.productId}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-white/80">
                        Or create product
                      </label>
                      <div className="mt-1 flex gap-2">
                        <Link
                          to="/seller/create-product"
                          className="flex-1 px-3 py-2 bg-yellow-400 text-black rounded-lg text-center"
                        >
                          + Create product
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            // quick refresh products
                            setLoadingProducts(true);
                            api
                              .get("/products", {
                                headers: token
                                  ? { Authorization: `Bearer ${token}` }
                                  : {},
                              })
                              .then((r) => {
                                const data = Array.isArray(r.data)
                                  ? r.data
                                  : r.data?.products || [];
                                setProducts(
                                  data.filter(
                                    (p) =>
                                      String(p.seller?._id || p.seller) ===
                                      String(user._id)
                                  )
                                );
                                setToast({
                                  msg: "Product list refreshed",
                                  kind: "success",
                                });
                              })
                              .catch((e) => {
                                setToast({
                                  msg: "Failed to refresh products",
                                  kind: "error",
                                });
                              })
                              .finally(() => setLoadingProducts(false));
                          }}
                          className="px-3 py-2 bg-white/5 rounded-lg"
                        >
                          Refresh
                        </button>
                      </div>
                      {loadingProducts && (
                        <div className="text-sm text-white/60 mt-2">
                          Loading products…
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Step 2: Type */}
                <section
                  className={`p-5 rounded-2xl border border-white/10 bg-white/5 ${
                    activeStep !== 2 ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">2. Auction Type</h2>
                    <div className="text-sm text-white/60">Step 2</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      className={`p-3 rounded-lg border ${
                        form.type === "traditional"
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-white/6 border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="traditional"
                        checked={form.type === "traditional"}
                        onChange={(e) => setField("type", e.target.value)}
                        className="mr-2"
                      />
                      Traditional (Highest wins)
                    </label>

                    <label
                      className={`p-3 rounded-lg border ${
                        form.type === "reverse"
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-white/6 border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="reverse"
                        checked={form.type === "reverse"}
                        onChange={(e) => setField("type", e.target.value)}
                        className="mr-2"
                      />
                      Reverse (Lowest wins)
                    </label>

                    <label
                      className={`p-3 rounded-lg border ${
                        form.type === "sealed"
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-white/6 border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="sealed"
                        checked={form.type === "sealed"}
                        onChange={(e) => setField("type", e.target.value)}
                        className="mr-2"
                      />
                      Sealed (bids hidden)
                    </label>
                  </div>
                </section>

                {/* Step 3: Pricing */}
                <section
                  className={`p-5 rounded-2xl border border-white/10 bg-white/5 ${
                    activeStep !== 3 ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">3. Pricing</h2>
                    <div className="text-sm text-white/60">Step 3</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-white/80">
                        Start Price (₹)
                      </label>
                      <input
                        type="number"
                        name="startPrice"
                        step="1"
                        min="0"
                        value={form.startPrice}
                        onChange={(e) => setField("startPrice", e.target.value)}
                        className="w-full p-3 rounded bg-white/6 border border-white/10 mt-1"
                      />
                      {errors.startPrice && (
                        <div className="text-rose-300 text-sm mt-1">
                          {errors.startPrice}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-white/80">
                        Min Increment (₹)
                      </label>
                      <input
                        type="number"
                        name="minIncrement"
                        step="1"
                        min="0"
                        value={form.minIncrement}
                        onChange={(e) =>
                          setField("minIncrement", e.target.value)
                        }
                        className="w-full p-3 rounded bg-white/6 border border-white/10 mt-1"
                      />
                      {errors.minIncrement && (
                        <div className="text-rose-300 text-sm mt-1">
                          {errors.minIncrement}
                        </div>
                      )}
                    </div>

                    <div className="flex items-end">
                      <div className="w-full text-sm text-white/60">
                        Tip: Use increments that make sense for the product
                        price.
                      </div>
                    </div>
                  </div>
                </section>

                {/* Step 4: Schedule */}
                <section
                  className={`p-5 rounded-2xl border border-white/10 bg-white/5 ${
                    activeStep !== 4 ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">4. Schedule</h2>
                    <div className="text-sm text-white/60">Step 4</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-white/80">Start At</label>
                      <input
                        type="datetime-local"
                        name="startAt"
                        value={form.startAt}
                        onChange={(e) => setField("startAt", e.target.value)}
                        className="w-full p-3 rounded bg-white/6 border border-white/10 mt-1"
                      />
                      {errors.startAt && (
                        <div className="text-rose-300 text-sm mt-1">
                          {errors.startAt}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-white/80">End At</label>
                      <input
                        type="datetime-local"
                        name="endAt"
                        value={form.endAt}
                        onChange={(e) => setField("endAt", e.target.value)}
                        className="w-full p-3 rounded bg-white/6 border border-white/10 mt-1"
                      />
                      {errors.endAt && (
                        <div className="text-rose-300 text-sm mt-1">
                          {errors.endAt}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-white/60">
                    All times are local to your browser. Server converts to ISO
                    on submit.
                  </div>
                </section>

                {/* navigation */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={activeStep === 1}
                      className="px-4 py-2 rounded bg-white/6 hover:bg-white/8 disabled:opacity-40"
                    >
                      Back
                    </button>
                    {activeStep < 4 && (
                      <button
                        type="button"
                        onClick={goNext}
                        className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {serverErr && (
                      <div className="text-rose-300 text-sm">{serverErr}</div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Icons.HiOutlineRefresh className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Auction"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: preview + summary */}
              <aside className="space-y-6">
                <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/60">Preview</div>
                      <div className="font-semibold text-lg">
                        Auction summary
                      </div>
                    </div>
                    <div className="text-xs text-white/50">Live preview</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <ProductPreview product={selectedProduct} />

                    <div className="p-3 rounded bg-white/6">
                      <div className="text-xs text-white/60">Type</div>
                      <div className="font-medium">{form.type}</div>

                      <div className="text-xs text-white/60 mt-2">
                        Start Price
                      </div>
                      <div className="font-semibold">
                        ₹{form.startPrice || "-"}
                      </div>

                      <div className="text-xs text-white/60 mt-2">
                        Minimum Increment
                      </div>
                      <div className="font-semibold">
                        ₹{form.minIncrement || "-"}
                      </div>

                      <div className="text-xs text-white/60 mt-2">
                        Start / End
                      </div>
                      <div className="text-sm">
                        {form.startAt
                          ? new Date(form.startAt).toLocaleString()
                          : "-"}
                      </div>
                      <div className="text-sm">
                        {form.endAt
                          ? new Date(form.endAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="text-sm text-white/60">Tips</div>
                  <ul className="list-disc ml-4 mt-2 text-xs text-white/70 space-y-1">
                    <li>
                      Don't set extremely short auctions — buyers need time to
                      react.
                    </li>
                    <li>Use sensible min increments to avoid spamming bids.</li>
                    <li>Sealed auctions hide bidders until the end.</li>
                  </ul>
                </div>
              </aside>
            </form>
          </main>
        </div>
      </div>

      <Toast
        kind={toast.kind}
        message={toast.msg}
        onClose={() => setToast({ msg: "", kind: "info" })}
      />
    </div>
  );
}
