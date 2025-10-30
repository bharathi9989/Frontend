import { useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await api.post("/auth/login", { email, password });
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };
  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh]">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg p-6 rounded-xl w-96"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">🔐 Login</h2>

          {error && (
            <p className="bg-red-200 text-red-700 p-2 mb-3 rounded-lg">
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-3"
            required
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-3"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </div>
    </>
  );
}

export default Login;
