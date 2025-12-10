import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function NotificationModal({
  open,
  onClose,
  settings,
  token,
  reload,
}) {
  // SAFE DEFAULTS
  const [form, setForm] = useState({
    auctionEnd: true,
    newBid: true,
  });

  // Load when modal opens
  useEffect(() => {
    if (settings) {
      setForm({
        auctionEnd: settings.auctionEnd ?? true,
        newBid: settings.newBid ?? true,
      });
    }
  }, [settings]);

  const save = async () => {
    await api.put("/users/settings/notifications", form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    reload();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl w-full max-w-md border border-white/20 text-white">
        <h2 className="text-xl font-bold mb-4">Notification Settings</h2>

        <div className="flex items-center justify-between mb-3">
          <span>Auction End Emails</span>
          <input
            type="checkbox"
            checked={form.auctionEnd}
            onChange={(e) => setForm({ ...form, auctionEnd: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <span>New Bid Alerts</span>
          <input
            type="checkbox"
            checked={form.newBid}
            onChange={(e) => setForm({ ...form, newBid: e.target.checked })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 rounded">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
