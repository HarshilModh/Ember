"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake while `active` is true — for the iPad Stand Mode
 * clock and running focus sessions, where the display sleeping defeats the
 * point. Silently no-ops on browsers without the Wake Lock API (iPadOS 16.4+
 * only) or when permission is refused. Re-acquires on visibility return,
 * since the OS releases the lock whenever the tab is backgrounded.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        // Refused (low battery, backgrounded mid-request) — nothing to do.
      }
    }

    void acquire();

    function handleVisibility() {
      if (document.visibilityState === "visible" && !lockRef.current) void acquire();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
