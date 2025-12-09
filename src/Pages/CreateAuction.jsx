// src/Pages/CreateAuction.jsx
import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateAuction() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loadingUser, setLoadingUser] = useState(true);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    productId: "",
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });

  const [message, setMessage] = useState("");

  // STEP 1 — Wait until AuthContext loads the user
  useEffect(() => {
    if (!user) return;
    console.log("User Loaded:", user);
    setLoadingUser(false);
  }, [user]);

  // STEP 2 — Load Products after user is available
  useEffect(() => {
    if (loadingUser) return;

    async function loadProducts() {
      try {
        console.log("Fetching products for user:", user._id);

        const res = await api.get("/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Backend returned products:", res.data);

        // 🔥 Universal Filtering Logic — works for ALL types
        const sellerProducts = res.data.filter((p) => {
          const sellerId =
            typeof p.seller === "string" ? p.seller : p.seller?._id;

          return sellerId === user._id;
        });

        console.log("Filtered seller products:", sellerProducts);

        setProducts(sellerProducts);
      } catch (err) {
        console.log("❌ Error fetching products:", err);
      }
    }

    loadProducts();
  }, [loadingUser, user, token]);

  // Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create Auction
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auctions", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("🎉 Auction created successfully!");
      setTimeout(() => navigate("/seller/dashboard"), 1500);
    } catch (err) {
      setMessage("❌ Could not create auction.");
      console.log("Auction error:", err);
    }
  };

  // UI while user loads
  if (!user) {
    return (
      <div className="text-center text-white text-2xl mt-20 animate-pulse">
        Loading user...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#1e3c72] to-[#2a5298] py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 text-white animate-fadeIn"
      >
        <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          📦 Create Auction
        </h2>

        {message && (
          <p className="text-center mb-4 bg-white/20 p-2 rounded-lg text-sm">
            {message}
          </p>
        )}

        {/* PRODUCT SELECT */}
        <label className="block font-medium mb-2">Select Product</label>

        {products.length === 0 ? (
          <p className="text-red-300 mb-4">
            ⚠ No products found for this seller. Add products first.
          </p>
        ) : (
          <select
            name="productId"
            value={form.productId}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4 outline-none focus:ring-2 focus:ring-blue-300"
            required
          >
            <option value="">-- choose product --</option>

            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        {/* Auction Type */}
        <label className="block font-medium mb-1">Auction Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4"
        >
          <option value="traditional">Traditional (highest wins)</option>
          <option value="reverse">Reverse (lowest wins)</option>
          <option value="sealed">Sealed Bid</option>
        </select>

        {/* Start Price */}
        <label>Start Price</label>
        <input
          type="number"
          name="startPrice"
          value={form.startPrice}
          onChange={handleChange}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl mb-4"
          placeholder="e.g. 500"
        />

        {/* Min Increment */}
        <label>Min Increment</label>
        <input
          type="number"
          name="minIncrement"
          value={form.minIncrement}
          onChange={handleChange}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl mb-4"
          placeholder="e.g. 100"
        />

        {/* Start Time */}
        <label>Start Time</label>
        <input
          type="datetime-local"
          name="startAt"
          value={form.startAt}
          onChange={handleChange}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl mb-4"
        />

        {/* End Time */}
        <label>End Time</label>
        <input
          type="datetime-local"
          name="endAt"
          value={form.endAt}
          onChange={handleChange}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl mb-6"
        />

        {/* Submit */}
        <button className="w-full py-3 bg-blue-500 rounded-xl font-bold hover:opacity-80 transition">
          Create Auction
        </button>
      </form>
    </div>
  );
}
