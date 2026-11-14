import type { CurrencyCode } from "./types";

export function roundTo(value: number, places: number): number {
  if (!Number.isFinite(value)) return value;
  const sign = value < 0 ? -1 : 1;
  const factor = 10 ** places;
  const shifted = Math.abs(value) * factor;
  return (sign * Math.round(shifted + 1e-8)) / factor;
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  const rounded = roundTo(value, 2);
  const absolute = formatNumber(Math.abs(rounded), 2);
  if (rounded < 0) return `${currency} -${absolute}`;
  return `${currency} ${absolute}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${formatNumber(value, digits)}%`;
}

export function formatHours(value: number): string {
  return `${formatNumber(value, 2)} h`;
}

export function fileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return slug || "workflow";
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}
