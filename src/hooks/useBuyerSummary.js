// src/hooks/useBuyerSummary.js
import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function useBuyerSummary() {
  const { token, user } = useContext(AuthContext);

  const [data, setData] = useState({
    totalBids: 0,
    won: 0,
    lost: 0,
    active: 0,
    upcoming: 0,
    recent: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/profile/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("Buyer summary load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, user]);

  return { data, loading };
}
