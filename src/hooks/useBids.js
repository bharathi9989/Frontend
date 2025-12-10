// src/hooks/useBids.js
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";

export default function useBids({ page = 1, limit = 20 } = {}) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState(null);

  const load = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/bids/my?page=${p}&limit=${limit}`);
        setBids(res.data.bids || []);
        setPageInfo({
          page: res.data.page,
          limit,
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 0,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    load(page);
  }, [load, page]);

  return {
    bids,
    loading,
    error,
    pageInfo,
    reload: load,
  };
}
