import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";

/**
 * useProducts - load products and provide helpers for add/update/delete.
 * Uses optimistic updates for snappy UI.
 */
export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addProduct = async (payload) => {
    setSaving(true);
    // optimistic id
    const tempId = "temp_" + Date.now();
    const optimistic = {
      ...payload,
      _id: tempId,
      seller: { _id: payload.seller } || {},
    };
    setProducts((p) => [optimistic, ...p]);

    try {
      const res = await api.post("/products", payload);
      // replace optimistic with real
      setProducts((list) =>
        list.map((it) => (it._id === tempId ? res.data.product : it))
      );
      return { ok: true, product: res.data.product };
    } catch (err) {
      // rollback
      setProducts((list) => list.filter((it) => it._id !== tempId));
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id, updates) => {
    setSaving(true);
    const prev = products;
    setProducts((p) =>
      p.map((it) => (it._id === id ? { ...it, ...updates } : it))
    );
    try {
      const res = await api.put(`/products/${id}`, updates);
      setProducts((p) =>
        p.map((it) => (it._id === id ? res.data.product : it))
      );
      return { ok: true, product: res.data.product };
    } catch (err) {
      setProducts(prev);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    setSaving(true);
    const prev = products;
    setProducts((p) => p.filter((it) => it._id !== id));
    try {
      await api.delete(`/products/${id}`);
      return { ok: true };
    } catch (err) {
      setProducts(prev);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  return {
    products,
    loading,
    error,
    saving,
    load,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
