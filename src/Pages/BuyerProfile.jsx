import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import useBuyerSummary from "../hooks/useBuyerSummary";
import EditProfileModal from "../components/EditProfileModal";
import NotificationSettingsModal from "../components/NotificationSettingsModal";
import { useState } from "react";

export default function BuyerProfile() {
  const { user } = useContext(AuthContext);
  const { data, loading } = useBuyerSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState(user);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settings, setSettings] = useState(user.notificationSettings);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen pt-28 px-6 bg-[#0f1724] text-white">
      <div className="max-w-5xl mx-auto">
        {/* Profile */}
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-lg mb-6">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-white/70">{user.email}</p>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              className="mt-3 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Notification Settings
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            ["Total Bids", data.totalBids],
            ["Won", data.won],
            ["Lost", data.lost],
            ["Active", data.active],
          ].map(([label, num]) => (
            <div key={label} className="bg-white/10 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold">{num}</div>
              <div className="text-white/70">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent Bids */}
        <h2 className="text-2xl font-bold mb-3">Recent Bids</h2>
        <div className="space-y-3">
          {data.recent.map((b) => (
            <div
              key={b._id}
              className="bg-white/10 p-4 rounded-xl flex items-center gap-4"
            >
              <div className="w-20 h-16 bg-black/20 rounded overflow-hidden">
                {b.auction.product?.images?.length ? (
                  <img
                    src={b.auction.product.images[0]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white/40 text-sm flex items-center justify-center h-full">
                    No Image
                  </div>
                )}
              </div>

              <div>
                <div className="text-lg font-semibold">
                  {b.auction.product?.title}
                </div>
                <div className="text-white/70 text-sm">
                  Bid: ₹{b.amount} • {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <EditProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={profile}
        onUpdated={(updatedUser) => setProfile(updatedUser)}
      />
      <NotificationSettingsModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        settings={settings}
        onUpdate={(newSet) => setSettings(newSet)}
      />
    </div>
  );
}
