import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export const CATEGORY_STYLES: Record<
  string,
  { label: string; color: string; badge: string }
> = {
  Housing: {
    label: "Moradia",
    color: "#ef4444", // Red-500
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  },
  Transport: {
    label: "Transporte",
    color: "#0ea5e9", // Sky-500 (Changed from Amber to distinct Blue)
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200",
  },
  Food: {
    label: "Alimentação",
    color: "#f97316", // Orange-500
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  },
  Entertainment: {
    label: "Entretenimento",
    color: "#8b5cf6", // Violet-500
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200",
  },
  Health: {
    label: "Saúde",
    color: "#ec4899", // Pink-500
    badge: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200",
  },
  Education: {
    label: "Educação",
    color: "#eab308", // Yellow-500 (Changed from Blue to Yellow)
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  },
  Clothing: {
    label: "Roupas",
    color: "#06b6d4", // Cyan-500
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200",
  },
  Pets: {
    label: "Animais de Estimação",
    color: "#14b8a6", // Teal-500
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200",
  },
  Salary: {
    label: "Salário",
    color: "#10b981", // Emerald-500
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  },
  Investment: {
    label: "Investimento",
    color: "#6366f1", // Indigo-500
    badge:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  },
  Other: {
    label: "Outros",
    color: "#64748b", // Slate-500
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
};
