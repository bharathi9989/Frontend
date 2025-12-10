// src/components/AuctionTimer.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * AuctionTimer
 * props:
 *  - startAt, endAt (ISO strings)
 *  - showLabel (true) -> returns JSX label
 *
 * returns { status, label, countdown } via UI
 */
export default function AuctionTimer({ startAt, endAt, showLabel = true }) {
  const start = useMemo(() => new Date(startAt).getTime(), [startAt]);
  const end = useMemo(() => new Date(endAt).getTime(), [endAt]);

  const compute = () => {
    const now = Date.now();
    if (now < start) {
      const diff = start - now;
      return { status: "upcoming", diff };
    }
    if (now > end) {
      return { status: "ended", diff: 0 };
    }
    return { status: "live", diff: end - now };
  };

  const [state, setState] = useState(() => compute());

  useEffect(() => {
    const t = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const toParts = (ms) => {
    if (!ms || ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / (3600 * 24));
    const h = Math.floor((s % (3600 * 24)) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { d, h, m, s: sec };
  };

  const parts = toParts(state.diff);

  const badge = (() => {
    if (state.status === "upcoming")
      return {
        text: `Starts in ${parts.d}d ${parts.h}h ${parts.m}m`,
        color: "bg-yellow-500",
      };
    if (state.status === "live")
      return {
        text: `Live • ${parts.h}h ${parts.m}m ${parts.s}s`,
        color: "bg-green-500",
      };
    return { text: "Ended", color: "bg-red-500" };
  })();

  if (!showLabel) return <>{state.status}</>;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`px-3 py-1 rounded-full text-xs text-white ${badge.color}`}
      >
        {badge.text}
      </span>
    </div>
  );
}
