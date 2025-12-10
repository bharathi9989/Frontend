import React, { useState } from "react";
import api from "../api/axios";

export default function ReListModal({ open, onClose, product, token }) {
  const [form, setForm] = useState({
    startPrice: "",
    minIncrement: "",
    startAt: "",
    endAt: "",
    type: "traditional",
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    await api.post(
      "/auctions/relist",
      { productId: product._id, ...form },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onClose();
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white/10 p-6 rounded-xl border border-white/20 w-full max-w-lg">
        <h2 className="text-xl text-white font-bold mb-4">
          Re-List Product: {product.title}
        </h2>

        <input
          type="number"
          name="startPrice"
          placeholder="Start Price"
          className="w-full mb-3 p-2 rounded"
          onChange={handle}
        />

        <input
          type="number"
          name="minIncrement"
          placeholder="Min Increment"
          className="w-full mb-3 p-2 rounded"
          onChange={handle}
        />

        <input
          type="datetime-local"
          name="startAt"
          className="w-full mb-3 p-2 rounded"
          onChange={handle}
        />

        <input
          type="datetime-local"
          name="endAt"
          className="w-full mb-3 p-2 rounded"
          onChange={handle}
        />

        <button
          onClick={submit}
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          Re-List Auction
        </button>
      </div>
    </div>
  );
}
