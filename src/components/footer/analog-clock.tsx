"use client";

import { useEffect, useRef } from "react";

type AnalogClockProps = {
  date: Date | null;
};

export function AnalogClock({ date }: AnalogClockProps) {
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clockRef.current || !date) return;

    // Use Asia/Kolkata (IST) time parts for the analog hands
    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const h =
      parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 12;
    const m = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10,
    );
    const s = parseInt(
      parts.find((p) => p.type === "second")?.value ?? "0",
      10,
    );

    clockRef.current.style.setProperty("--now-h", String(h));
    clockRef.current.style.setProperty("--now-m", String(m));
    clockRef.current.style.setProperty("--now-s", String(s));
  }, [date]);

  return (
    <div
      ref={clockRef}
      className="paco-clock"
      aria-label="Bangalore IST analog clock"
      title="Bangalore, India (IST)"
    >
      <div className="paco-clock-second" />
      <div className="paco-clock-minute" />
      <div className="paco-clock-hour" />
    </div>
  );
}
