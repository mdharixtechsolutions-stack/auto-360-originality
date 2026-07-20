import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  let startYear = currentYear;
  if (now.getMonth() < 3) {
    startYear = currentYear - 1;
  }
  const defaultFrom = `${startYear}-04-01`;
  const defaultTo = `${startYear + 1}-03-31`;
  const from = localStorage.getItem("financialYearFrom") || defaultFrom;
  const to = localStorage.getItem("financialYearTo") || defaultTo;
  return { from, to };
}

export function isWithinFinancialYear(dateStr) {
  if (!dateStr) return false;
  const { from, to } = getFinancialYear();
  const date = dateStr.split("T")[0];
  return date >= from && date <= to;
}
