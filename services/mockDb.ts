import { Transaction, Budget, User, FixedExpense } from '../types';

// Initial Data Seeding
const STORAGE_KEY_TRANSACTIONS = 'finflow_transactions';
const STORAGE_KEY_BUDGETS = 'finflow_budgets';
const STORAGE_KEY_USER = 'finflow_user';
const STORAGE_KEY_FIXED_EXPENSES = 'finflow_fixed_expenses';

const seedTransactions: Transaction[] = [
  { id: '1', type: 'income', category: 'Salary', amount: 5000, date: new Date().toISOString(), description: 'Salário Mensal' },
  { id: '2', type: 'expense', category: 'Housing', amount: 1200, date: new Date().toISOString(), description: 'Aluguel' },
  { id: '3', type: 'expense', category: 'Food', amount: 150, date: new Date(Date.now() - 86400000).toISOString(), description: 'Mercado' },
  { id: '4', type: 'expense', category: 'Transport', amount: 50, date: new Date(Date.now() - 172800000).toISOString(), description: 'Uber' },
];

const seedBudgets: Budget[] = [
  { id: '1', category: 'Food', limit: 800 },
  { id: '2', category: 'Entertainment', limit: 300 },
  { id: '3', category: 'Transport', limit: 400 },
];

// Helper to simulate Axios calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth (Simulating BetterAuth)
  login: async (email: string, password?: string) => {
    await delay(500);
    // Simple mock validation
    if (email === 'finflow@teste.com' && password === 'teste123') {
        const user: User = { id: 'u1', name: 'Usuário Demo', email };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        return user;
    }
    throw new Error("Invalid credentials");
  },
  
  logout: async () => {
    await delay(300);
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getSession: async () => {
    await delay(200);
    const u = localStorage.getItem(STORAGE_KEY_USER);
    return u ? JSON.parse(u) as User : null;
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    await delay(500);
    const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(seedTransactions));
      return seedTransactions;
    }
    return JSON.parse(stored);
  },

  addTransaction: async (tx: Omit<Transaction, 'id'>, installments = 1): Promise<void> => {
    await delay(400);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]');
    const newTxs: Transaction[] = [];
    
    if (installments > 1 && tx.type === 'expense') {
        const amountPerInstallment = tx.amount / installments; // Simple division
        const originalId = crypto.randomUUID();

        // Extrai ano, mês e dia diretamente da string ISO para evitar problemas de timezone
        const datePart = tx.date.split('T')[0];
        const [baseYear, baseMonth, baseDay] = datePart.split('-').map(Number);

        // Helper function to add months correctly, preservando o dia quando possível
        // month é 1-indexed (1 = janeiro, 12 = dezembro)
        const addMonthsToDate = (year: number, month: number, day: number, monthsToAdd: number): { year: number, month: number, day: number } => {
            let targetYear = year;
            let targetMonth = month + monthsToAdd;
            
            // Ajusta o ano se necessário
            while (targetMonth > 12) {
                targetMonth -= 12;
                targetYear += 1;
            }
            while (targetMonth < 1) {
                targetMonth += 12;
                targetYear -= 1;
            }
            
            // Verifica quantos dias existem no mês alvo
            // JavaScript usa meses 0-indexed, então targetMonth - 1 para o construtor
            // new Date(year, month, 0) retorna o último dia do mês anterior
            const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
            const finalDay = Math.min(day, daysInTargetMonth);
            
            return { year: targetYear, month: targetMonth, day: finalDay };
        };

        for (let i = 0; i < installments; i++) {
            const { year, month, day } = addMonthsToDate(baseYear, baseMonth, baseDay, i);
            
            // Converte para ISO preservando o dia exato
            const yearStr = String(year).padStart(4, '0');
            const monthStr = String(month).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const dateISO = `${yearStr}-${monthStr}-${dayStr}T00:00:00.000Z`;
            
            newTxs.push({
                ...tx,
                id: crypto.randomUUID(),
                amount: amountPerInstallment,
                date: dateISO,
                description: `${tx.description} (${i + 1}/${installments})`,
                installments: {
                    current: i + 1,
                    total: installments,
                    originalId
                }
            });
        }
    } else {
        newTxs.push({ ...tx, id: crypto.randomUUID() });
    }

    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([...stored, ...newTxs]));
  },

  updateTransaction: async (tx: Transaction): Promise<void> => {
    await delay(300);
    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]');
    
    // Find the original transaction to check for installments
    const existingIndex = stored.findIndex((t: Transaction) => t.id === tx.id);
    if (existingIndex === -1) return; // Not found

    const existing = stored[existingIndex];

    // If it's part of an installment plan, we usually want to update the Category, Description (base), and Amount for ALL installments
    // But we usually want to keep the specific Dates for the other installments.
    if (existing.installments?.originalId) {
        // Strip any existing suffix like " (1/10)" from the new description to get the base name
        const baseDescription = tx.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();

        stored = stored.map((t: Transaction) => {
            if (t.installments?.originalId === existing.installments?.originalId) {
                // Determine the suffix for this specific installment
                const suffix = ` (${t.installments.current}/${t.installments.total})`;
                
                // If this is the specific transaction being edited, update its date.
                // For others, keep their calculated date.
                const newDate = t.id === tx.id ? tx.date : t.date;

                return {
                    ...t,
                    category: tx.category,
                    type: tx.type,
                    amount: tx.amount, // Assume the user updated the installment value
                    description: `${baseDescription}${suffix}`,
                    date: newDate
                };
            }
            return t;
        });
    } else {
        // Simple update for single transaction
        stored[existingIndex] = tx;
    }
    
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(stored));
  },

  deleteTransaction: async (id: string) => {
    await delay(300);
    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]');
    const filtered = stored.filter((t: Transaction) => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(filtered));
  },

  // Fixed Expenses
  getFixedExpenses: async (): Promise<FixedExpense[]> => {
    await delay(300);
    const stored = localStorage.getItem(STORAGE_KEY_FIXED_EXPENSES);
    return stored ? JSON.parse(stored) : [];
  },

  addFixedExpense: async (expense: Omit<FixedExpense, 'id'>) => {
    await delay(300);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FIXED_EXPENSES) || '[]');
    const newExpense = { ...expense, id: crypto.randomUUID() };
    localStorage.setItem(STORAGE_KEY_FIXED_EXPENSES, JSON.stringify([...stored, newExpense]));
  },

  deleteFixedExpense: async (id: string) => {
    await delay(300);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FIXED_EXPENSES) || '[]');
    const filtered = stored.filter((e: FixedExpense) => e.id !== id);
    localStorage.setItem(STORAGE_KEY_FIXED_EXPENSES, JSON.stringify(filtered));
  },

  generateFixedTransactions: async (month: number, year: number) => {
    await delay(600);
    const fixedExpenses: FixedExpense[] = JSON.parse(localStorage.getItem(STORAGE_KEY_FIXED_EXPENSES) || '[]');
    const transactions: Transaction[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]');
    
    const newTransactions: Transaction[] = [];

    fixedExpenses.forEach(fe => {
        // Check if this fixed expense has already been generated for this specific month/year
        const alreadyExists = transactions.some(t => {
            const d = new Date(t.date);
            return t.fixedExpenseId === fe.id && d.getMonth() === month && d.getFullYear() === year;
        });

        if (!alreadyExists) {
            // Create date for the specific day of the target month
            const date = new Date(year, month, fe.dayOfMonth);
            // Converte para ISO preservando o dia
            const yearStr = String(date.getFullYear()).padStart(4, '0');
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const dateISO = `${yearStr}-${monthStr}-${dayStr}T00:00:00.000Z`;
            
            newTransactions.push({
                id: crypto.randomUUID(),
                type: 'expense',
                amount: fe.amount,
                category: fe.category,
                description: fe.description,
                date: dateISO,
                fixedExpenseId: fe.id
            });
        }
    });

    if (newTransactions.length > 0) {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([...transactions, ...newTransactions]));
    }
    
    return newTransactions.length;
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    await delay(400);
    const stored = localStorage.getItem(STORAGE_KEY_BUDGETS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(seedBudgets));
        return seedBudgets;
    }
    return JSON.parse(stored);
  },

  updateBudget: async (budget: Budget) => {
    await delay(300);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_BUDGETS) || '[]');
    const index = stored.findIndex((b: Budget) => b.id === budget.id);
    if (index >= 0) {
        stored[index] = budget;
    } else {
        stored.push({ ...budget, id: crypto.randomUUID() });
    }
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(stored));
  }
};