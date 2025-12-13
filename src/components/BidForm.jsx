// src/components/BidForm.jsx
import React, { useState } from "react";

export default function BidForm({ onSubmit, minRequired, disabled, type }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const handle = async (e) => {
      e.preventDefault();
      setError("");

      if (disabled) return;

      const amount = Number(val);
      if (!amount || amount <= 0) {
        setError("Enter a valid bid amount");
        return;
      }

      if (type === "reverse") {
        if (amount > minRequired) {
          setError(`Reverse auction: bid must be ≤ ₹${minRequired}`);
          return;
        }
      } else {
        if (amount < minRequired) {
          setError(`Minimum bid is ₹${minRequired}`);
          return;
        }
      }

      setBusy(true);
      try {
        await onSubmit(amount);
        setVal("");
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Bid failed. Try again."
        );
      } finally {
        setBusy(false);
      }
    };

    const num = Number(amount);
    if (!num || isNaN(num)) return setError("Enter a valid number");
    // For reverse auction amount must be lower; for traditional must be >= minRequired
    if (type === "reverse") {
      if (minRequired != null && !(num < minRequired)) {
        return setError(
          `Bid must be lower than current lowest (${minRequired})`
        );
      }
    } else {
      if (minRequired != null && num < minRequired) {
        return setError(`Bid must be at least ${minRequired}`);
      }
    }

    try {
      await onSubmit(num);
      setAmount("");
    } catch (err) {
      setError(err?.message || "Bid failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <div className="text-sm text-red-300">{error}</div>}
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-white/10 text-white outline-none"
          placeholder="Enter bid amount"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-semibold ${
            disabled ? "bg-gray-500/60" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Place Bid
        </button>
      </div>
    </form>

    
  );
}
