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

  // Filter only items created by this seller
  const myProducts = useMemo(
    () => products.filter((p) => p.seller?._id === user?._id),
    [products, user]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = async (payload, id) => {
    if (id) await updateProduct(id, payload);
    else await addProduct({ ...payload, seller: user._id });
  };

  return (
    <div className="min-h-screen pt-28 bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-6">
      {/* Dashboard Container */}
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow">
              Seller Dashboard
            </h1>
            <p className="text-white/70">Manage your products and auctions</p>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-lg transition"
          >
            + Add Product
          </button>
        </div>

        {/* STAT BOXES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow border border-white/20">
            <p className="text-white/60">Total Products</p>
            <h2 className="text-3xl font-bold text-white">
              {myProducts.length}
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow border border-white/20">
            <p className="text-white/60">Active Auctions</p>
            <h2 className="text-3xl font-bold text-white">0</h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow border border-white/20">
            <p className="text-white/60">Inventory Items</p>
            <h2 className="text-3xl font-bold text-white">
              {myProducts.reduce((sum, p) => sum + p.inventoryCount, 0)}
            </h2>
          </div>
        </div>

        {/* PRODUCT SECTION */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
          {/* Desktop Table */}
          <div className="hidden md:block">
            {loading ? (
              <p className="text-white">Loading...</p>
            ) : (
              <ProductTable
                products={myProducts}
                onEdit={(p) => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                onDelete={async (id) => {
                  if (confirm("Delete this product?")) await deleteProduct(id);
                }}
              />
            )}
          </div>

          {/* Mobile Cards */}
          <div className="grid md:hidden grid-cols-1 gap-4">
            {myProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={() => {
                  setEditing(product);
                  setModalOpen(true);
                }}
                onDelete={() => deleteProduct(product._id)}
              />
            ))}
          </div>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
}
