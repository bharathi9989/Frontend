import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function useAuctionDetails(id) {
  const { token } = useContext(AuthContext);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get(`/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuction(res.data);
    } catch (err) {
      console.log("Auction load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return { auction, loading, reload: load };
}
