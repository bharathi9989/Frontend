import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateAuction() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    productId: "",
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });

  // ------------------------------
  // LOAD SELLER PRODUCTS
  // ------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API DATA:", res.data);
        console.log("USER ID:", user._id);

        // FIX: Works for populated & non-populated seller
        const sellerProducts = res.data.filter((p) => {
          const sellerId = p?.seller?._id || p?.seller;
          return sellerId === user._id;
        });

        console.log("SELLER PRODUCTS:", sellerProducts);

        setProducts(sellerProducts);
      } catch (err) {
        console.log("Error fetching products", err);
      }
    };

    fetchProducts();
  }, [token, user._id]);

  // ------------------------------
  // HANDLE INPUT CHANGE
  // ------------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ------------------------------
  // SUBMIT AUCTION
  // ------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auctions", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("🎉 Auction created successfully!");
      setTimeout(() => navigate("/seller/dashboard"), 1500);
    } catch (err) {
      console.log("Auction error:", err);
      setMessage("❌ Could not create auction.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-linear-to-br from-[#1e3c72] to-[#2a5298] py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8 text-white animate-fadeIn"
      >
        <h2 className="text-3xl font-bold text-center mb-6">
          📦 Create Auction
        </h2>

        {message && (
          <p className="text-center mb-4 bg-white/20 p-2 rounded-lg text-sm">
            {message}
          </p>
        )}

        {/* PRODUCT SELECT */}
        <label className="block font-medium mb-1">Select Product</label>
        <select
          name="productId"
          required
          value={form.productId}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">-- choose product --</option>

          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>

        {/* AUCTION TYPE */}
        <label className="block font-medium mb-1">Auction Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4"
        >
          <option value="traditional">Traditional (Highest wins)</option>
          <option value="reverse">Reverse (Lowest wins)</option>
          <option value="sealed">Sealed Bid</option>
        </select>

        {/* START PRICE */}
        <label className="block font-medium mb-1">Start Price</label>
        <input
          type="number"
          name="startPrice"
          required
          placeholder="e.g. 500"
          value={form.startPrice}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4"
        />

        {/* MIN INCREMENT */}
        <label className="block font-medium mb-1">Min Increment</label>
        <input
          type="number"
          name="minIncrement"
          placeholder="e.g. 100"
          value={form.minIncrement}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4"
        />

        {/* START DATE */}
        <label className="block font-medium mb-1">Start Time</label>
        <input
          type="datetime-local"
          name="startAt"
          required
          value={form.startAt}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-4"
        />

        {/* END DATE */}
        <label className="block font-medium mb-1">End Time</label>
        <input
          type="datetime-local"
          name="endAt"
          required
          value={form.endAt}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mb-6"
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-linear-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:opacity-90 shadow-lg transition"
        >
          Create Auction
        </button>
      </form>
    </div>
  );
}
