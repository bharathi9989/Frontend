import React, { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.value]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };
  return (
    <div className="min-h-screen bg-gradient-to-r form-purple-600 to-blue-600 flex items-center justify-center px-4">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl p-8 w-full mzx-w-md animate-fadeIn">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Create Account
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Enter your name"
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-400 outline-none border border-white/20 focus:border-white/40 transition "
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-400 outline-none border border-white/20 focus:border-white/40 transition"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password (min 6 characters)"
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-400 outline-none border border-white/20 focus:border-white/40 transition"
            required
          />

          <select
            name="role"
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/20 text-gray-400 outline-none border border-white/20 focus:border-gray-400 transition"
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
            className="w-full bg-white/20 border border-white/30 text-white p-3 rounded-lg font-semibold hover:bg-green-400 transition"
          >
            Register
          </button>
        </form>

        <p>
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
  );
}

export default Register;
