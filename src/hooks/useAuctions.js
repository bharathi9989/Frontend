// src/hooks/useAuctions.js
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

/**
 * PRODUCTION-GRADE useAuctions()
 * ------------------------------------------
 * Backend supports:
 *   - page
 *   - limit
 *   - status (live|upcoming|closed)
 *
 * Backend DOES NOT support:
 *   - q search
 *   - type filter
 *   - category filter
 *   - price sorting
 *
 * So those MUST be handled client-side.
 * This hook gives fully normalized, safe results.
 */

export default function useAuctions({
  page = 1,
  limit = 12,
  q = "",
  filters = {},
  sort = "",
} = {}) {
  const [auctions, setAuctions] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ---- BUILD SAFE QUERY FOR BACKEND ----
      const params = { page, limit };

      // Backend supports ONLY status filter
      if (filters.status) params.status = filters.status;

      // ---- GET RAW DATA ----
      const res = await api.get("/auctions", { params });

      let list = [];

      // server returned list directly
      if (Array.isArray(res.data)) {
        list = res.data;
        setTotal(list.length);
      }

      // server returned object { auctions, total }
      else if (Array.isArray(res.data.auctions)) {
        list = res.data.auctions;
        setTotal(res.data.total ?? res.data.count ?? res.data.auctions.length);
      }

      // fallback
      else {
        list = res.data?.auctions || [];
      }

      // ---- NORMALIZE product ref (avoid crashes) ----
      list = list.filter((a) => a && a.product);

      // ---- CLIENT-SIDE SEARCH ----
      if (q.trim()) {
        const lower = q.trim().toLowerCase();
        list = list.filter((a) =>
          (a.product?.title || "").toLowerCase().includes(lower)
        );
      }

      // ---- CLIENT-SIDE TYPE FILTER ----
      if (filters.type && filters.type !== "all") {
        list = list.filter((a) => a.type === filters.type);
      }

      // ---- CLIENT-SIDE CATEGORY FILTER ----
      if (filters.category && filters.category !== "all") {
        list = list.filter(
          (a) =>
            a.product?.category?.toLowerCase() ===
            filters.category.toLowerCase()
        );
      }

      // ---- CLIENT-SIDE SORTING ----
      if (sort === "endingSoon") {
        list.sort((a, b) => new Date(a.endAt) - new Date(b.endAt));
      } else if (sort === "newest") {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === "priceAsc") {
        list.sort((a, b) => (a.startPrice || 0) - (b.startPrice || 0));
      } else if (sort === "priceDesc") {
        list.sort((a, b) => (b.startPrice || 0) - (a.startPrice || 0));
      }

      // ---- CLIENT-SIDE PAGINATION ----
      const start = (page - 1) * limit;
      const end = start + limit;

      const paged = list.slice(start, end);

      setAuctions(paged);
      setTotal(list.length);
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
