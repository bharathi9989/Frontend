// src/hooks/useAuctions.js
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

/**
 * useAuctions(options)
 * options:
 *  - page (number)        -> for server-side pagination
 *  - limit (number)
 *  - q (string)           -> search query for server
 *  - filters (object)     -> { status, type, category }
 *  - sort (string)        -> e.g. 'endingSoon' | 'newest' | 'priceAsc' | 'priceDesc'
 *
 * This hook tries to query server using query params. If backend doesn't support,
 * you can opt to fetch everything and filter client-side.
 */
export default function useAuctions({
  page = 1,
  limit = 12,
  q = "",
  filters = {},
  sort = "",
} = {}) {
  const [auctions, setAuctions] = useState([]);
  const [total, setTotal] = useState(null); // total count (if server provides)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params - backend may accept these. If not, fallback logic can be used.
      const params = {
        page,
        limit,
      };
      if (q) params.q = q;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (sort) params.sort = sort;

      const res = await api.get("/auctions", { params });
      // Expected shape:
      // Option A (preferred server): { data: { auctions: [...], total: 120 } }
      // Option B (simple): res.data => array of auctions
      if (res.data && Array.isArray(res.data)) {
        // backend returns array -> client-side total unknown
        setAuctions(res.data);
        setTotal(res.data.length);
      } else if (res.data && Array.isArray(res.data.auctions)) {
        setAuctions(res.data.auctions);
        setTotal(res.data.total ?? res.data.count ?? res.data.auctions.length);
      } else if (res.data?.auctions) {
        setAuctions(res.data.auctions);
        setTotal(res.data.total ?? res.data.count ?? res.data.auctions.length);
      } else {
        // last fallback: set whole response
        setAuctions(res.data || []);
      }
    } catch (err) {
      console.error("useAuctions load error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, JSON.stringify(filters), sort]);

  useEffect(() => {
    load();
  }, [load]);

  return { auctions, total, loading, error, reload: load };
}
