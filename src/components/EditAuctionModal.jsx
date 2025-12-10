// src/components/EditAuctionModal.jsx
import React, { useState, useEffect } from "react";

export default function EditAuctionModal({ open, auction, onClose, onSave }) {
  const [form, setForm] = useState({
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (auction) {
      setForm({
        startPrice: auction.startPrice ?? "",
        minIncrement: auction.minIncrement ?? 100,
        startAt: auction.startAt ? auction.startAt.slice(0, 16) : "",
        endAt: auction.endAt ? auction.endAt.slice(0, 16) : "",
      });
    } else {
      setForm({
        startPrice: "",
        minIncrement: 100,
        startAt: "",
        endAt: "",
      });
    }
  }, [auction, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        startPrice: Number(form.startPrice),
        minIncrement: Number(form.minIncrement),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      };
      await onSave(auction._id, payload);
      onClose();
    } catch (err) {
      console.error("Edit save failed", err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-bold text-white mb-4">Edit Auction</h3>

        <label className="text-white/80">Start Price</label>
        <input
          name="startPrice"
          value={form.startPrice}
          onChange={handleChange}
          type="number"
          required
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <label className="text-white/80">Min Increment</label>
        <input
          name="minIncrement"
          value={form.minIncrement}
          onChange={handleChange}
          type="number"
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <label className="text-white/80">Start Time</label>
        <input
          name="startAt"
          value={form.startAt}
          onChange={handleChange}
          type="datetime-local"
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <label className="text-white/80">End Time</label>
        <input
          name="endAt"
          value={form.endAt}
          onChange={handleChange}
          type="datetime-local"
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-green-600 rounded"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
