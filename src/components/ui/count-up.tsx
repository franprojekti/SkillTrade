"use client";

import { useEffect, useState } from "react";

function DigitSlot({ digit, delay = 0 }: { digit: number; delay?: number }) {
  return (
    <span
      className="inline-block overflow-hidden align-bottom"
      style={{ height: "1.25em", lineHeight: "1.25em" }}
    >
      <span
        className="flex flex-col"
        style={{
          transform: `translateY(calc(-${digit} * 1.25em))`,
          transition: `transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block" style={{ height: "1.25em", lineHeight: "1.25em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function CountUp({ to }: { to: number }) {
  const numDigits = Math.max(String(to).length, 1);
  const [digits, setDigits] = useState<number[]>(Array(numDigits).fill(0));

  useEffect(() => {
    const timer = setTimeout(() => {
      const padded = String(to).padStart(numDigits, "0");
      setDigits(padded.split("").map(Number));
    }, 120);
    return () => clearTimeout(timer);
  }, [to, numDigits]);

  return (
    <span className="inline-flex tabular-nums">
      {digits.map((d, i) => (
        // Higher-order digits lag slightly behind lower-order ones
        <DigitSlot key={i} digit={d} delay={(numDigits - 1 - i) * 60} />
      ))}
    </span>
  );
}
