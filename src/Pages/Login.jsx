import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios.js";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    e.preventDefault();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await api.post("/auth/login", form);
      login(res.data);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "login failed");
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-blue-600 to-blue-800 flex item-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-fadeIn">
        <h2 className="text-3xl font-extrabold text-center text-white mb-6 mt-2 tracking-wide">
          Welcome Back
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Enter your Email Id"
            onChange={handleChange}
            className="w-full p-3 bg-white/20 text-white placeholder-white/70 rounded-xl border border-white/20 focus:border-white/70 outline-none transition"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 bg-white/20 text-white placeholder-white/70 rounded-xl 
            border border-white/20 focus:border-white/70 outline-none transition"
          />

          <button
            type="submit"
            className="w-full p-3 bg-linear-to-r from-purple-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            Login
          </button>
        </form>
        {error && <p className="text-red-300 text-center mt-2">{error}</p>}

        <p className="text-white/80 text-center mt-4">
          Don't have an account ?{" "}
          <Link to="/register" className="text-white font-bold p-5">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
