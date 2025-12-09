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

  const sellerId = user?._id || user?.id;

  // Filter only seller’s items (support string OR object)
  const myProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p || !p.seller) return false;

      const s = p.seller;

      if (typeof s === "string") return s === sellerId;
      if (typeof s === "object" && s._id) return s._id === sellerId;

      return false;
    });
  }, [products, sellerId]);

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

  // FINAL FIXED SAVE FUNCTION
  const handleSave = async (payload, id) => {
    setMessage("");

    let result;

    if (id) {
      // UPDATE
      result = await updateProduct(id, payload);

      if (!result.ok) {
        setMessage("❌ Failed to update product");
        return;
      }

      setMessage("✅ Product updated successfully!");
    } else {
      // CREATE
      result = await addProduct(payload);

      if (!result.ok) {
        setMessage("❌ Failed to add product");
        return;
      }

      setMessage("✅ Product created successfully!");
    }

    setTimeout(() => setMessage(""), 2000);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;

    const res = await deleteProduct(id);

    if (!res.ok) {
      alert("Delete failed");
    }
  };

  return (
    <div className="min-h-screen pt-28 bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
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
              className="bg-green-600 px-4 py-2 rounded-lg text-white shadow-lg hover:bg-green-700 transition"
            >
              + Add Product
            </button>
          </div>
        </header>

        {/* STATUS MESSAGE */}
        {message && (
          <div className="mb-4 p-3 bg-white/10 text-white rounded">
            {message}
          </div>
        )}

        {/* PRODUCT LIST */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block">
            {loading ? (
              <div className="text-white p-6">Loading...</div>
            ) : (
              <ProductTable
                products={myProducts}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}
          </div>

          {/* MOBILE CARDS */}
          <div className="grid md:hidden grid-cols-1 gap-4">
            {loading ? (
              <div className="text-white p-6">Loading...</div>
            ) : (
              myProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => handleDelete(p._id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
}
