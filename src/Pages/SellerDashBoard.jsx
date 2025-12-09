// src/pages/SellerDashboard.jsx
import React, { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useProducts from "../hooks/useProducts";
import ProductTable from "../components/ProductTable";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";

export default function SellerDashboard() {
  const { user } = useContext(AuthContext);
  const { products, loading, addProduct, updateProduct, deleteProduct } =
    useProducts();

  // helper to normalize seller id
  const sellerId = user?._id || user?.id || null;
  // Filter only items created by this seller (supports seller object or id)
  const myProducts = useMemo(
    () =>
      products.filter((p) => {
        if (!p) return false;
        // p.seller may be an object or a string id
        const s = p.seller;
        if (!s) return false;
        if (typeof s === "string") return s === sellerId;
        if (s._id) return s._id === sellerId;
        if (s.id) return s.id === sellerId;
        return false;
      }),
    [products, sellerId]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const doSave = async (payload, id) => {
    setMessage("");
    if (id) {
      const res = await updateProduct(id, payload);
      if (!res.ok) setMessage("Failed to update product");
      else setMessage("Updated");
    } else {
      // attach seller id when creating
      await addProduct(payload);
      if (!res.ok) setMessage("Failed to add product");
      else setMessage("Created");
    }
    setTimeout(() => setMessage(""), 2000);
  };

  const doDelete = async (id) => {
    if (!confirm("Delete product? This cannot be undone.")) return;
    const res = await deleteProduct(id);
    if (!res.ok) alert("Delete failed");
  };

  return (
    <div className="min-h-screen pt-28 bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
            <p className="text-white/80">Manage your products and auctions</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 text-white px-4 py-2 rounded-lg shadow">
              Products: <strong>{myProducts.length}</strong>
            </div>
            <button
              onClick={openAdd}
              className="bg-green-600 px-4 py-2 rounded-lg text-white shadow"
            >
              + Add Product
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-4 p-3 bg-white/10 text-white rounded">
            {message}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
          <div className="hidden md:block">
            {loading ? (
              <div className="p-6 text-white">Loading...</div>
            ) : (
              <ProductTable
                products={myProducts}
                onEdit={(p) => openEdit(p)}
                onDelete={(id) => doDelete(id)}
              />
            )}
          </div>

          <div className="grid md:hidden grid-cols-1 gap-4">
            {loading ? (
              <div className="p-6 text-white">Loading...</div>
            ) : (
              myProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => doDelete(p._id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={doSave}
      />
    </div>
  );
}
