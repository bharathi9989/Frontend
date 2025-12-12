// src/pages/CreateProduct.jsx
import React, { useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateProduct() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    inventoryCount: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e) => setImageFile(e.target.files?.[0] || null);

  const validate = () => {
    if (!form.title.trim()) return "Title required";
    if (!form.category.trim()) return "Category required";
    if (
      !Number.isFinite(Number(form.inventoryCount)) ||
      Number(form.inventoryCount) < 0
    )
      return "Invalid inventory count";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) return setErr(v);

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("inventoryCount", String(form.inventoryCount));
      if (imageFile) fd.append("image", imageFile); // backend expects 'image' for upload.single

      const res = await api.post("/products", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // success
      navigate("/seller/auctions"); // or /seller/dashboard
    } catch (err) {
      console.error("Create product failed:", err);
      setErr(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 p-6 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">➕ Create Product</h1>

        <form
          onSubmit={submit}
          className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10"
        >
          {err && (
            <div className="text-rose-300 text-sm p-2 rounded bg-white/5">
              {err}
            </div>
          )}

          <div>
            <label className="text-sm">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
              required
            />
          </div>

          <div>
            <label className="text-sm">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
              required
            />
          </div>

          <div>
            <label className="text-sm">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Inventory Count</label>
              <input
                name="inventoryCount"
                value={form.inventoryCount}
                onChange={handleChange}
                type="number"
                className="w-full p-3 rounded bg-white/6"
              />
            </div>
            <div>
              <label className="text-sm">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="w-full p-2 rounded bg-white/6"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={saving}
              type="submit"
              className="px-4 py-2 bg-green-600 rounded"
            >
              {saving ? "Creating..." : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white/5 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
