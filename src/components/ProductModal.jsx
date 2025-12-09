// src/components/ProductModal.jsx
import React, { useEffect, useState } from "react";

export default function ProductModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageFile: null, // File
    imageUrl: "", // existing URL
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
        imageFile: null,
        imageUrl: initial.images?.[0] || "",
        category: initial.category || "",
        inventoryCount: initial.inventoryCount ?? 1,
      });
    } else {
      setForm({
        title: "",
        description: "",
        imageFile: null,
        imageUrl: "",
        category: "",
        inventoryCount: 1,
      });
    }
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      setForm((s) => ({ ...s, imageFile: files[0] || null }));
    } else if (name === "inventoryCount") {
      setForm((s) => ({ ...s, inventoryCount: Number(value) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
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
      // Use FormData for multipart upload when file present
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("category", form.category);
      payload.append("inventoryCount", String(form.inventoryCount));

      // If imageFile present, append as 'image' (route expects field name 'image')
      if (form.imageFile) {
        payload.append("image", form.imageFile);
      } else if (form.imageUrl) {
        // fallback: allow sending image URL as plain field (server accepts)
        payload.append("images", JSON.stringify([form.imageUrl]));
      }

      // onSave should handle FormData when necessary
      await onSave(payload, initial?._id);
      onClose();
    } catch (err) {
      console.error("Product save failed:", err);
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
        className="relative z-10 w-full max-w-lg bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
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
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
          rows={3}
        />

        <div className="mb-3">
          <label className="block text-sm text-white/80 mb-1">Image</label>

          {form.imageUrl && !form.imageFile && (
            <img
              src={form.imageUrl}
              alt="preview"
              className="w-40 h-40 object-cover rounded mb-2 border border-white/20"
            />
          )}

          {form.imageFile && (
            <img
              src={URL.createObjectURL(form.imageFile)}
              alt="preview"
              className="w-40 h-40 object-cover rounded mb-2 border border-white/20"
            />
          )}

          <input
            name="imageFile"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full text-white/80"
          />
        </div>

        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          className="w-full p-3 rounded mb-3 bg-white/10 text-white outline-none"
        />

        <input
          name="inventoryCount"
          value={form.inventoryCount}
          onChange={handleChange}
          type="number"
          min="0"
          placeholder="Stock"
          className="w-full p-3 rounded mb-4 bg-white/10 text-white outline-none"
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
