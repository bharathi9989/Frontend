import { useCallback, useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

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

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      ...(payload instanceof FormData ? {} : payload),
      _id: tempId,
      createdAt: new Date().toISOString(),
      seller: null,
    };
    // if payload is FormData, we can't read fields easily; show placeholder
    setProducts((p) => [optimistic, ...p]);

    try {
      const isForm = payload instanceof FormData;
      const res = await api.post("/products", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isForm ? { "Content-Type": "multipart/form-data" } : {}),
        },
      });

      const saved = res.data?.product || res.data;
      setProducts((list) => list.map((it) => (it._id === tempId ? saved : it)));
      return { ok: true, product: saved };
    } catch (err) {
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
      const isForm = updates instanceof FormData;
      const res = await api.put(`/products/${id}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isForm ? { "Content-Type": "multipart/form-data" } : {}),
        },
      });
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
          Authorization: `Bearer ${token}`,
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
