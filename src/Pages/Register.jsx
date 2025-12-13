import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { useMagnetic } from "./Home";

function Register() {
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await api.post("/auth/register", form);
      login({
        user: {
          ...res.data.user,
          _id: res.data.user.id,
        },
        token: res.data.token,
      });
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Registration Failed");
    }
  };
  useMagnetic();

  return (
    <div>
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="backdrop-blur-xl max-w-md bg-white/10 border border-white/20 shadow-xl rounded-2xl p-8 w-full mzx-w-md animate-fadeIn">
          <h2 className="text-3xl font-bold text-center text-white mb-3">
            Create Account
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/20 text-gray-900 placeholder-white/70 outline-none border border-white/20 focus:border-white/40 transition "
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none border border-white/20 focus:border-white/40 transition"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password (min 6 characters)"
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none border border-white/20 focus:border-black transition"
              required
            />

            <select
              name="role"
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white/20 text-white/70 outline-none border border-white/20 focus:border-gray-400 transition"
            >
              <option value="buyer" className="text-black">
                Buyer
              </option>
              <option value="seller" className="text-black">
                Seller
              </option>
            </select>

            <button
              type="submit"
              className="liquid-btn magnetic-btn w-full py-3 bg-red-400 text-black font-bold rounded-xl shadow-xl hover:bg-blue-400 transition"
            >
              Register
            </button>
          </form>
          {error && <p className="text-red-300 text-center mb-3">{error}</p>}

          <p className="text-white/80 text-center mt-4">
            Already have an account ?{" "}
            <Link
              to={"/login"}
              className="text-white font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
