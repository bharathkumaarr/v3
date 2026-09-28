"use client";

import { useSyncExternalStore } from "react";
import { AnalogClock } from "./analog-clock";

let cachedTimestamp = Date.now();

function subscribe(callback: () => void) {
  const interval = setInterval(() => {
    cachedTimestamp = Date.now();
    callback();
  }, 500);
  return () => clearInterval(interval);
}

function getSnapshot(): number {
  return cachedTimestamp;
}

function getServerSnapshot(): null {
  return null;
}

export function Footer() {
  const timestamp = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const now = timestamp ? new Date(timestamp) : null;

  // Format IST (Asia/Kolkata) with seconds
  const istTime = now
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  // Format UTC with seconds
  const utcTime = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  const deployDate = process.env.NEXT_PUBLIC_DEPLOY_DATE || "29 sep 2026";

  return (
    <footer
      className="w-full bg-neutral-1 text-neutral-6 text-[13px]"
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="mx-auto max-w-[640px] px-6 sm:px-0">
        <div className="border-t border-neutral-3 py-5 flex flex-col gap-2">
          {/* Row 1: Statement on left, Latest update and Analog Clock on right */}
          <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-3">
            <span>&ldquo;harmony demands both order and surrender&rdquo;</span>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] sm:text-[13px] tabular-nums">
                {`latest: ${deployDate}`}
              </span>
              <AnalogClock date={now} />
            </div>
          </div>

          {/* Row 2: Location on left, Live IST & UTC times with seconds on right */}
          <div className="flex items-center justify-between text-[12px] sm:text-[13px]">
            <span>bangalore, india</span>
            <span className="font-mono tabular-nums">
              {istTime} ist · {utcTime} utc
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
