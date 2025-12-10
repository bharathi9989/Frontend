import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useBuyerSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/profile/summary");
        setData(res.data);
      } catch (err) {
        console.log("Summary error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading };
}
