import React, { useState } from "react";
import api from "../api/axios";

export default function NotificationSettingsModal({
  open,
  onClose,
  settings,
  onUpdate,
}) {
  if (!open) return null;

  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const toggle = (key) => {
    setForm({ ...form, [key]: !form[key] });
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await api.put("/profile/notifications", form);
      onUpdate(res.data.settings);
      setMsg("Updated successfully!");
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setMsg("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-8 rounded-2xl w-full max-w-lg animate-slideUp text-white">
        <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>

        {msg && (
          <div className="p-2 bg-white/20 rounded mb-3 text-center">{msg}</div>
        )}

        <div className="space-y-5">
          {[
            ["outbid", "Outbid Alerts"],
            ["win", "Winning Alerts"],
            ["auctionStart", "Auction Start Alerts"],
            ["auctionEnd", "Auction End Alerts"],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10"
            >
              <span>{label}</span>

              <button
                onClick={() => toggle(key)}
                className={`w-14 h-7 rounded-full transition flex items-center ${
                  form[key] ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transform transition ${
                    form[key] ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-white/70 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
