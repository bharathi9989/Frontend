// src/hooks/useProducts.js
import { useCallback, useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/**
 * useProducts - central product state + helpers
 * returns consistent product shape: each product has _id, seller (object or id), title, etc.
 */
export default function useProducts() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // backend returns array in res.data
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.products || [];
      setProducts(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const addProduct = async (payload) => {
    setSaving(true);
    setError(null);

    // optimistic item
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      ...payload,
      _id: tempId,
      createdAt: new Date().toISOString(),
      // ensure seller shape exists (could be id string)
      seller: payload.seller,
    };
    setProducts((p) => [optimistic, ...p]);

    try {
      const res = await api.post("/products", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // backend returns { message, product }
      const saved = res.data?.product || res.data;
      // replace optimistic
      setProducts((list) => list.map((it) => (it._id === tempId ? saved : it)));
      return { ok: true, product: saved };
    } catch (err) {
      // rollback
      setProducts((list) => list.filter((it) => it._id !== tempId));
      setError(err);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id, updates) => {
    setSaving(true);
    setError(null);
    const prev = products;
    setProducts((p) =>
      p.map((it) => (it._id === id ? { ...it, ...updates } : it))
    );
    try {
      const res = await api.put(`/products/${id}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ send token
        },
      });
      // backend returns { message, product }
      const updated = res.data?.product || res.data;
      setProducts((p) => p.map((it) => (it._id === id ? updated : it)));
      return { ok: true, product: updated };
    } catch (err) {
      setProducts(prev);
      setError(err);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    setSaving(true);
    setError(null);
    const prev = products;
    setProducts((p) => p.filter((it) => it._id !== id));
    try {
      await api.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ send token
        },
      });
      return { ok: true };
    } catch (err) {
      setProducts(prev);
      setError(err);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  };

  return {
    products,
    loading,
    saving,
    error,
    load,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
