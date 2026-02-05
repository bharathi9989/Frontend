import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios.js";
import { useMagnetic } from "./Home.jsx";

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
      login({
        user: {
          ...res.data.user,
          _id: res.data.user.id, // guarantee _id
        },
        token: res.data.token,
      });
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "login failed");
    }
  };

  useMagnetic();
  return (
    <>
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
      <div className="min-h-screen bg-gray-500 via-gray-500 to-white/15 flex items-center justify-center p-6 ">
        <div className="w-full max-w-md max-h-max bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-fadeIn">
          <div className="neon-streak" style={{ top: "20%" }} />
          {/* ✨ PARTICLES */}

          <div
            className="neon-streak"
            style={{ top: "50%", animationDelay: "1s" }}
          />
          <div
            className="neon-streak"
            style={{ top: "75%", animationDelay: "2s" }}
          />

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
              className="liquid-btn magnetic-btn px-20 py-3 bg-red-400 text-black font-bold rounded-xl shadow-xl hover:bg-blue-400 transition"
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
    </>
  );
}

export default Login;
