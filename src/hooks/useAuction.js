import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function useAuctions() {
  const { token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuctions(res.data);
    } catch (err) {
      console.log("Auction load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { auctions, loading, load };
}
