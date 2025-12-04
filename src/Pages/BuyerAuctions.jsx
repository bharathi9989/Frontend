import { useState, useEffect } from "react";
import api from "../api/axios";
import AuctionCard from "../components/ProductCard.jsx";

export default function BuyerAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("live");

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      const res = await api.get("/auctions");
      setAuctions(res.data);
      setFiltered(res.data);

      // unique categories
      const categories = [...new Set(res.data.map((a) => a.product?.category))];
      setCategoryList(categories);
    } catch (err) {
      console.log("Error loading auctions:", err);
    }
  };

  const handleFilter = () => {
    let data = [...auctions];

    if (statusFilter !== "all") {
      data = data.filter((a) => a.status === statusFilter);
    }

    if (typeFilter !== "all") {
      data = data.filter((a) => a.type === typeFilter);
    }

    setFiltered(data);
  };

  useEffect(() => {
    handleFilter();
  }, [statusFilter, typeFilter]);

  return (
    <div className="min-h-screen pt-28 px-8 bg-linear-to-br from-[#141E30] to-[#243B55] text-white">
      <h1 className="text-4xl font-bold mb-6">🔥 Live Auctions</h1>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 mb-8 bg-white/10 p-4 rounded-xl backdrop-blur-lg border border-white/20">
        <select
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl"
        >
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>

        <select
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl"
        >
          <option value="all">All Types</option>
          <option value="traditional">Traditional</option>
          <option value="reverse">Reverse</option>
          <option value="sealed">Sealed</option>
        </select>
      </div>

      {/* AUCTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <p>No auctions found.</p>
        ) : (
          filtered.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))
        )}
      </div>
    </div>
  );
}
