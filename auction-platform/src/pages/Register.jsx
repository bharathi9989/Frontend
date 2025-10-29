import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer", // default role
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await axios.post("/auth/api/register", formData);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <h2>Register</h2>
          {error && (
            <p className="bg-red-200 text-red-700 p-2 mb-3 rounded-lg">
              {error}
            </p>
          )}
          <input
            type="text"
            name="name"
            placeholder="Enter name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter the password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      </div>
    </>
  );
}

export default Register;
