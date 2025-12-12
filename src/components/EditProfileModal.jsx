// src/components/EditProfileModal.jsx
import React, { useState } from "react";
import api from "../api/axios";

export default function EditProfileModal({ open, onClose, user, onUpdated }) {
  if (!open) return null;

  const safeUser = user || {};

  const [form, setForm] = useState({
    name: safeUser.name || "",
    email: safeUser.email || "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
      };

      // Only send password if user typed something
      if (form.password.trim() !== "") {
        payload.password = form.password.trim();
      }

      const res = await api.put("/profile/update", payload);

      const updated = res?.data?.user || payload;
      onUpdated(updated);

      setMsg("Profile updated successfully!");

      setTimeout(() => {
        setMsg("");
        onClose();
      }, 900);
    } catch (err) {
      setMsg(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

        {msg && (
          <div className="mb-3 p-2 bg-white/20 rounded text-center text-white text-sm">
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-white/80 text-sm">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">
              New Password (optional)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave empty to keep current password"
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-white/70 hover:text-white transition mt-1"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
