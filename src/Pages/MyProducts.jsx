// src/pages/MyProducts.jsx
import React, { useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function MyProducts() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/products", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        // backend returns array for seller or filtered by auth — but defensive:
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.products || [];
        // filter owner
        const mine = list.filter(
          (p) => String(p.seller?._id || p.seller) === String(user._id)
        );
        if (mounted) setProducts(mine);
      } catch (err) {
        console.error("Load products failed:", err);
        setErr("Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [token, user]);

  const deleteProduct = async (id) => {
    if (!confirm("Delete product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((p) => p.filter((x) => String(x._id) !== String(id)));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  return (
    <div className="min-h-screen pt-28 p-6 bg-linear-to-br from-[#071029] to-[#0b1220] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Products</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/seller/create-product")}
              className="px-4 py-2 bg-green-500 rounded"
            >
              + Add Product
            </button>
            <Link
              to="/seller/create-auction"
              className="px-4 py-2 bg-yellow-400 text-black rounded"
            >
              Create Auction
            </Link>
          </div>
        </div>

        {err && <div className="text-rose-300 mb-4">{err}</div>}

        <div className="grid md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white/5 p-4 rounded-2xl border border-white/10"
            >
              <div className="w-full h-40 bg-black/30 rounded overflow-hidden mb-3">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    No image
                  </div>
                )}
              </div>
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs text-white/60">{p.category}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate(`/seller/edit-product/${p._id}`)}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(p._id)}
                  className="px-3 py-1 bg-rose-500 rounded"
                >
                  Delete
                </button>
                <Link
                  to={`/seller/create-auction`}
                  className="px-3 py-1 bg-yellow-300 text-black rounded"
                >
                  Create Auction
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
