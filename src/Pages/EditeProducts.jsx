// src/pages/EditProduct.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProduct() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    inventoryCount: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = res.data?.product || res.data;
        if (!p) throw new Error("Product not found");
        if (mounted)
          setForm({
            title: p.title || "",
            description: p.description || "",
            category: p.category || "",
            inventoryCount: p.inventoryCount ?? 1,
          });
      } catch (err) {
        console.error(err);
        setErr("Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id, token]);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const handleFile = (e) => setImageFile(e.target.files?.[0] || null);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("inventoryCount", String(form.inventoryCount));
      if (imageFile) fd.append("image", imageFile);

      const res = await api.put(`/products/${id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/seller/my-products");
    } catch (err) {
      console.error("Update failed:", err);
      setErr(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="min-h-screen pt-28 p-6 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">✏️ Edit Product</h1>

        <form
          onSubmit={submit}
          className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10"
        >
          {err && <div className="text-rose-300 p-2 rounded">{err}</div>}

          <div>
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
            />
          </div>

          <div>
            <label>Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/6"
              rows={4}
            />
          </div>

          <div>
            <label>Inventory Count</label>
            <input
              name="inventoryCount"
              value={form.inventoryCount}
              onChange={handleChange}
              type="number"
              className="w-full p-3 rounded bg-white/6"
            />
          </div>

          <div>
            <label>Replace Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full p-2 rounded bg-white/6"
            />
          </div>

          <div className="flex gap-2">
            <button
              disabled={saving}
              className="px-4 py-2 bg-green-600 rounded"
            >
              {saving ? "Saving..." : "Save"}
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
