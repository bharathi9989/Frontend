// import { useEffect, useState } from "react";
// import api from "../api/axios";

// export default function useBuyerSummary() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await api.get("/profile/summary");
//         setData(res.data);
//       } catch (err) {
//         console.log("Summary error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return { data, loading };
// }


// src/hooks/useBuyerSummary.js
import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function useBuyerSummary() {
  const { token, user } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalBids: 0,
    wonAuctions: 0,
    activeBids: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    async function load() {
      try {
        const res = await api.get("/bids/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
      } catch (err) {
        console.error("Summary load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, token]);

  return { summary, loading };
}