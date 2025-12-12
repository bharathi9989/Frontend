// src/pages/BuyerProfile.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useBuyerSummary from "../hooks/useBuyerSummary";
import EditProfileModal from "../components/EditProfileModal";
import NotificationSettingsModal from "../components/NotificationSettingsModal";

export default function BuyerProfile() {
  const { user, setUser } = useContext(AuthContext);

  // safe defaults (prevents undefined errors)
  const safeUser = user || {};
  const safeSettings = safeUser.notificationSettings || {
    outbid: true,
    win: true,
    auctionStart: true,
    auctionEnd: true,
  };

  const { data, loading } = useBuyerSummary();

  const [modalOpen, setModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [profile, setProfile] = useState(safeUser);
  const [settings, setSettings] = useState(safeSettings);

  if (loading)
    return (
      <div className="text-white p-10 text-center text-lg">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen pt-28 px-6 bg-[#0f1724] text-white">
      <div className="max-w-5xl mx-auto">
        {/* --------------------- Profile Card --------------------- */}
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-lg mb-6">
          <h1 className="text-3xl font-bold">{safeUser.name}</h1>
          <p className="text-white/70">{safeUser.email}</p>

          <div className="flex items-center gap-5 mt-4">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Notification Settings
            </button>
          </div>
        </div>

        {/* --------------------- Stats --------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            ["Total Bids", data.totalBids],
            ["Won", data.won],
            ["Lost", data.lost],
            ["Active", data.active],
          ].map(([label, num]) => (
            <div
              key={label}
              className="bg-white/10 p-4 rounded-xl text-center border border-white/10"
            >
              <div className="text-3xl font-bold">{num ?? 0}</div>
              <div className="text-white/70">{label}</div>
            </div>
          ))}
        </div>

        {/* --------------------- Recent Bids --------------------- */}
        <h2 className="text-2xl font-bold mb-3">Recent Bids</h2>

        {(!data.recent || data.recent.length === 0) && (
          <div className="text-white/50 italic mb-6">No recent bids found.</div>
        )}

        <div className="space-y-3">
          {data.recent?.map((b) => {
            const product = b.auction?.product;
            const img =
              product?.images?.[0] ||
              "https://via.placeholder.com/150/222222/FFFFFF?text=No+Image";

            return (
              <div
                key={b._id}
                className="bg-white/10 p-4 rounded-xl flex items-center gap-4 border border-white/10"
              >
                {/* product image */}
                <div className="w-20 h-16 bg-black/20 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt="product"
                  />
                </div>

                {/* details */}
                <div>
                  <div className="text-lg font-semibold">
                    {product?.title || "Unnamed Product"}
                  </div>
                  <div className="text-white/70 text-sm">
                    Bid: ₹{b.amount} • {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --------------------- Modals --------------------- */}
      <EditProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={profile}
        onUpdated={(updatedUser) => {
          setProfile(updatedUser);
          setUser(updatedUser); // update global context
        }}
      />

      <NotificationSettingsModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        settings={settings}
        onUpdate={(newSettings) => {
          setSettings(newSettings);
          setUser({ ...safeUser, notificationSettings: newSettings });
        }}
      />
    </div>
  );
}
