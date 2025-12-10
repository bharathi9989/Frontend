// src/hooks/useSellerAuctions.js
import { useCallback, useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/**
 * useSellerAuctions
 * - fetches auctions (server will filter by seller when token provided)
 * - provides actions: refresh, updateStatus, updateAuction, deleteAuction
 */
export default function useSellerAuctions() {
  const { token } = useContext(AuthContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.auctions || [];
      setAuctions(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAuctions([]);
      setLoading(false);
      return;
    }
    load();
  }, [load, token]);

  const refresh = () => load();

  const updateStatus = async (id, status) => {
    setSaving(true);
    try {
      const res = await api.put(
        `/auctions/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data?.auction || res.data;
      setAuctions((list) => list.map((a) => (a._id === id ? updated : a)));
      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const updateAuction = async (id, payload) => {
    setSaving(true);
    try {
      const res = await api.put(`/auctions/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data?.auction || res.data;
      setAuctions((list) => list.map((a) => (a._id === id ? updated : a)));
      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const deleteAuction = async (id) => {
    setSaving(true);
    try {
      await api.delete(`/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuctions((list) => list.filter((a) => a._id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  return {
    auctions,
    loading,
    saving,
    error,
    refresh,
    updateStatus,
    updateAuction,
    deleteAuction,
  };
}
