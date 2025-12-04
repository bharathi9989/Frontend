import React, { useEffect, useState } from "react";

/**
 * ProductModal props:
 * - open (bool)
 * - onClose()
 * - onSave(payload) => returns promise
 * - initial (object) optional for edit
 */
export default function ProductModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    images: "",
    category: "",
    inventoryCount: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        images: (initial.images && initial.images[0]) || "",
        category: initial.category || "",
        inventoryCount: initial.inventoryCount ?? 1,
      });
    } else {
      setForm({
        title: "",
        description: "",
        images: "",
        category: "",
        inventoryCount: 1,
      });
    }
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      [name]: name === "inventoryCount" ? Number(value) : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.category) {
      setError("Title and category required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        images: form.images ? [form.images] : [],
        category: form.category,
        inventoryCount: form.inventoryCount,
      };
      await onSave(payload, initial?._id);
      onClose();
    } catch (err) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4">
          {initial ? "Edit Product" : "Add Product"}
        </h3>

        {error && <div className="text-sm text-red-300 mb-3">{error}</div>}

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-3 rounded mb-3 bg-white/20 text-white outline-none"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-3 rounded mb-3 bg-white/20 text-white outline-none"
          rows={3}
        />
        <input
          name="images"
          value={form.images}
          onChange={handleChange}
          placeholder="Image URL"
          className="w-full p-3 rounded mb-3 bg-white/20 text-white outline-none"
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          className="w-full p-3 rounded mb-3 bg-white/20 text-white outline-none"
        />
        <input
          name="inventoryCount"
          value={form.inventoryCount}
          onChange={handleChange}
          type="number"
          min="0"
          placeholder="Stock"
          className="w-full p-3 rounded mb-4 bg-white/20 text-white outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-white/10 text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
