"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatHours, formatMoney } from "@/lib/format";
import type { CurrencyCode, WaterfallBar } from "@/lib/types";

const tones = {
  neutral: "#477BFF",
  cost: "#EF6464",
  positive: "#35C58A",
  negative: "#EF6464",
  manual: "#477BFF",
  processing: "#36CFC9",
  human: "#E8B45A",
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function WaterfallChart({ bars, currency }: { bars: WaterfallBar[]; currency: CurrencyCode }) {
  const reduced = useReducedMotion();
  return (
    <div className="h-80 w-full" role="img" aria-label={bars.map((bar) => `${bar.label} ${formatMoney(bar.signed, currency)}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#273142" horizontal={false} />
          <XAxis type="number" stroke="#929BAB" tick={{ fill: "#929BAB", fontSize: 12 }} tickFormatter={(value: number) => compact(value)} />
          <YAxis type="category" dataKey="shortLabel" width={104} stroke="#273142" tick={{ fill: "#F4F6FA", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(71,123,255,0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as WaterfallBar;
              return (
                <div className="rounded-md border border-line bg-elevated px-3 py-2 text-sm text-text">
                  <p>{row.label}</p>
                  <p className="mt-1 tabular-nums">{formatMoney(row.signed, currency)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="waterfall" radius={[0, 4, 4, 0]} isAnimationActive={!reduced}>
            {bars.map((bar) => (
              <Cell key={bar.label} fill={tones[bar.tone]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeChart({
  rows,
}: {
  rows: Array<{ label: string; shortLabel: string; hours: number; tone: "manual" | "processing" | "human" }>;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="h-64 w-full" role="img" aria-label={rows.map((row) => `${row.label} ${formatHours(row.hours)}`).join(", ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#273142" horizontal={false} />
          <XAxis type="number" stroke="#929BAB" tick={{ fill: "#929BAB", fontSize: 12 }} unit=" h" />
          <YAxis type="category" dataKey="shortLabel" width={104} stroke="#273142" tick={{ fill: "#F4F6FA", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(71,123,255,0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof rows)[number];
              return (
                <div className="rounded-md border border-line bg-elevated px-3 py-2 text-sm text-text">
                  <p>{row.label}</p>
                  <p className="mt-1 tabular-nums">{formatHours(row.hours)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]} isAnimationActive={!reduced}>
            {rows.map((row) => (
              <Cell key={row.label} fill={tones[row.tone]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function compact(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 1_000_000) return `${sign}${(absolute / 1_000_000).toFixed(1)}m`;
  if (absolute >= 1000) return `${sign}${Math.round(absolute / 1000)}k`;
  return `${sign}${Math.round(absolute)}`;
}
