// src/components/ReListModal.jsx
import React, { useState, useEffect } from "react";
import * as Icons from "react-icons/hi";
import api from "../api/axios";

export default function ReListModal({
  open,
  onClose,
  product,
  token,
  onCreated,
}) {
  const [form, setForm] = useState({
    productId: "",
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate modal when product changes
  useEffect(() => {
    if (!product) return;
    setForm((f) => ({
      ...f,
      productId: product._id || product.id,
      startPrice: product.startPrice ?? "",
    }));
    setError("");
  }, [product]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.productId || !form.startAt || !form.endAt) {
      return setError("Please fill required fields.");
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return setError("Invalid dates (endAt must be after startAt).");
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

      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to re-list");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <form
        className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-white"
        onSubmit={submit}
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">♻️ Re-list Product</h2>
          <button onClick={onClose}>
            <Icons.HiX className="text-white w-6 h-6" />
          </button>
        </div>

        {error && <div className="text-sm text-rose-300 mb-3">{error}</div>}

        <div className="mb-3">{product?.title}</div>

        {/* Form fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Auction Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handle}
              className="w-full p-2 bg-white/10 rounded"
            >
              <option value="traditional">Traditional</option>
              <option value="reverse">Reverse</option>
              <option value="sealed">Sealed</option>
            </select>
          </div>

          <div>
            <label>Min Increment</label>
            <input
              name="minIncrement"
              type="number"
              value={form.minIncrement}
              onChange={handle}
              className="w-full p-2 bg-white/10 rounded"
            />
          </div>

          <div>
            <label>Start Price</label>
            <input
              name="startPrice"
              type="number"
              value={form.startPrice}
              onChange={handle}
              className="w-full p-2 bg-white/10 rounded"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Start At</label>
            <input
              name="startAt"
              type="datetime-local"
              onChange={handle}
              value={form.startAt}
              className="w-full p-2 bg-white/10 rounded"
            />
          </div>

          <div>
            <label>End At</label>
            <input
              name="endAt"
              type="datetime-local"
              onChange={handle}
              value={form.endAt}
              className="w-full p-2 bg-white/10 rounded"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            className="px-4 py-2 bg-green-500 rounded text-black font-semibold flex items-center gap-2"
          >
            {saving ? (
              <Icons.HiRefresh className="animate-spin" />
            ) : (
              <Icons.HiPlus />
            )}
            Re-list
          </button>
        </div>
      </form>
    </div>
  );
}
