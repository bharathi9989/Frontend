import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateAuction() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loadingUser, setLoadingUser] = useState(true);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    productId: "",
    type: "traditional",
    startPrice: "",
    minIncrement: 100,
    startAt: "",
    endAt: "",
  });

  // STEP 1: Wait until user loads
  useEffect(() => {
    if (!user) return;
    setLoadingUser(false);
  }, [user]);

  // STEP 2: Fetch seller products
  useEffect(() => {
    if (loadingUser) return;

    async function loadProducts() {
      try {
        const res = await api.get("/products", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sellerProducts = res.data.filter((p) => {
          const sellerId =
            typeof p.seller === "string" ? p.seller : p.seller?._id;
          return sellerId === user._id;
        });

        setProducts(sellerProducts);
      } catch (err) {
        console.log("❌ Error loading products:", err);
      }
    }

    loadProducts();
  }, [loadingUser]);

  // VALIDATION FUNCTION
  const validate = () => {
    let temp = {};

    if (!form.productId) temp.productId = "Product selection required";
    if (!form.startPrice) temp.startPrice = "Start price required";
    if (!form.startAt) temp.startAt = "Start time required";
    if (!form.endAt) temp.endAt = "End time required";

    if (form.startAt && form.endAt) {
      if (new Date(form.startAt) >= new Date(form.endAt)) {
        temp.endAt = "End time must be after start time";
      }
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setMessage("❌ Fix the highlighted errors");
      return;
    }

    try {
      await api.post("/auctions", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("🎉 Auction created successfully!");
      setTimeout(() => navigate("/seller/dashboard"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Auction creation failed");
    }
  };

  if (!user)
    return (
      <div className="text-white text-center text-3xl mt-20">Loading user…</div>
    );

  return (
    <div className="min-h-screen flex justify-center items-center bg-linear-to-br from-[#141E30] to-[#243B55] py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 text-white animate-fadeIn"
      >
        <h2 className="text-3xl font-bold text-center mb-6">
          🎯 Create New Auction
        </h2>

        {message && (
          <p className="text-center mb-4 bg-white/20 p-3 rounded-lg text-sm shadow">
            {message}
          </p>
        )}

        {/* PRODUCT SELECT */}
        <label className="font-medium">Select Product</label>
        <select
          name="productId"
          value={form.productId}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mt-1"
        >
          <option value="">-- choose product --</option>
          {products.map((p) => (
            <option key={p._id} value={p._id} className="text-black">
              {p.title}
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="text-red-300 text-sm mt-1">{errors.productId}</p>
        )}

        {/* AUCTION TYPE */}
        <label className="font-medium mt-4 block">Auction Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mt-1"
        >
          <option value="traditional" className="text-black">
            Traditional (Highest Wins)
          </option>
          <option value="reverse" className="text-black">
            Reverse (Lowest Wins)
          </option>
          <option value="sealed" className="text-black">
            Sealed Bid
          </option>
        </select>

        {/* START PRICE */}
        <label className="font-medium mt-4 block">Start Price</label>
        <input
          name="startPrice"
          type="number"
          value={form.startPrice}
          onChange={handleChange}
          placeholder="e.g. 500"
          className={`w-full p-3 rounded-xl bg-white/10 border ${
            errors.startPrice ? "border-red-400" : "border-white/20"
          } mt-1`}
        />
        {errors.startPrice && (
          <p className="text-red-300 text-sm mt-1">{errors.startPrice}</p>
        )}

        {/* MIN INCREMENT */}
        <label className="font-medium mt-4 block">Min Increment</label>
        <input
          name="minIncrement"
          type="number"
          value={form.minIncrement}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 mt-1"
        />

        {/* START TIME */}
        <label className="font-medium mt-4 block">Start Time</label>
        <input
          name="startAt"
          type="datetime-local"
          value={form.startAt}
          onChange={handleChange}
          className={`w-full p-3 rounded-xl bg-white/10 border ${
            errors.startAt ? "border-red-400" : "border-white/20"
          } mt-1`}
        />
        {errors.startAt && (
          <p className="text-red-300 text-sm mt-1">{errors.startAt}</p>
        )}
        {/* END TIME */}
        <label className="font-medium mt-4 block">End Time</label>
        <input
          name="endAt"
          type="datetime-local"
          value={form.endAt}
          onChange={handleChange}
          className={`w-full p-3 rounded-xl bg-white/10 border ${
            errors.endAt ? "border-red-400" : "border-white/20"
          } mt-1`}
        />
        {errors.endAt && (
          <p className="text-red-300 text-sm mt-1">{errors.endAt}</p>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={!validate}
          className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 transition rounded-xl shadow-lg font-semibold disabled:opacity-40"
        >
          Create Auction
        </button>
      </form>
    </div>
  );
}
