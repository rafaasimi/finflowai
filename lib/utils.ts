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

/**
 * Converte uma string de data (YYYY-MM-DD ou ISO) para formato brasileiro (DD/MM/YYYY)
 * Extrai diretamente da string para evitar problemas de timezone
 */
export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  
  // Se a data vem no formato YYYY-MM-DD, extrai diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Se vem como ISO string (YYYY-MM-DDTHH:mm:ss.sssZ), extrai a parte da data
  const datePart = dateStr.split('T')[0];
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Fallback: usa Date mas extrai componentes UTC para preservar o dia
  const date = new Date(dateStr);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * Converte uma string de data do input (YYYY-MM-DD) para ISO string preservando o dia
 * Usa meia-noite UTC para evitar problemas de timezone
 */
export function dateToISO(dateStr: string): string {
  if (!dateStr) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  
  // Extrai ano, mês e dia da string YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Retorna como ISO string no formato YYYY-MM-DDTHH:mm:ss.sssZ
  // Usando meia-noite UTC para preservar o dia independente do fuso horário
  const yearStr = String(year).padStart(4, '0');
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}T00:00:00.000Z`;
}

/**
 * Converte uma data ISO para string YYYY-MM-DD para uso em inputs
 * Extrai diretamente da string ISO para evitar problemas de timezone
 */
export function dateToInputFormat(dateStr: string): string {
  if (!dateStr) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Se já está no formato YYYY-MM-DD, retorna direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Extrai a parte da data da string ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
  const datePart = dateStr.split('T')[0];
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  
  // Fallback: usa Date mas extrai componentes UTC para preservar o dia
  const date = new Date(dateStr);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
