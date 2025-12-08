import { supabase } from './supabaseClient';
import { Transaction, Budget, FixedExpense, User } from '../types';

export const supabaseService = {
  // Auth
  getSession: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*');
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    // Map DB JSON structure back to TS interface if needed
    // Supabase returns JSON columns as objects, so installments should be fine
    return data as Transaction[];
  },

  addTransaction: async (tx: Omit<Transaction, 'id'>, installments = 1): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const newTxs: any[] = [];
    
    if (installments > 1 && tx.type === 'expense') {
        const amountPerInstallment = tx.amount / installments;
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
            // JavaScript usa meses 0-indexed (0 = janeiro, 11 = dezembro)
            // new Date(year, month, 0) retorna o último dia do mês anterior
            // Como targetMonth é 1-indexed (1-12), usamos targetMonth diretamente (que será 1-12)
            // new Date(2025, 12, 0) retorna o último dia de novembro (mês 11)
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
                user_id: user.id,
                amount: amountPerInstallment,
                type: tx.type,
                category: tx.category,
                description: `${tx.description} (${i + 1}/${installments})`,
                date: dateISO,
                installments: {
                    current: i + 1,
                    total: installments,
                    originalId
                },
                fixedExpenseId: tx.fixedExpenseId
            });
        }
    } else {
        newTxs.push({
            user_id: user.id,
            ...tx
        });
    }

    const { error } = await supabase.from('transactions').insert(newTxs);
    if (error) throw error;
  },

  updateTransaction: async (tx: Transaction): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if installment
    if (tx.installments?.originalId) {
         // Logic: Update ALL installments with same originalId
         // Fields to update globally: Category, Type, Base Description (without suffix), Amount (re-calculated?)
         // For simplicity, we update Category, Type, Amount (assuming user edited one installment amount to update all? or total? 
         // Implementation matches Mock: Update Category, Type, Amount of ALL. Update Description Base.
         // Keep Dates individual.

         const baseDescription = tx.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();
         
         // Fetch all related first to iterate (or use a clever SQL update)
         // Using SQL Update is better but harder to reconstruct description strings dynamically in standard SQL without functions.
         // Let's fetch IDs first.
         const { data: related } = await supabase
            .from('transactions')
            .select('id, installments, date')
            .filter('installments->>originalId', 'eq', tx.installments.originalId);

         if (!related) return;

         const updates = related.map((t: any) => {
             const suffix = ` (${t.installments.current}/${t.installments.total})`;
             // Only update date if it's the specific one edited
             const newDate = t.id === tx.id ? tx.date : t.date;
             
             return {
                 id: t.id,
                 category: tx.category,
                 type: tx.type,
                 amount: tx.amount,
                 description: `${baseDescription}${suffix}`,
                 date: newDate
             };
         });

         // Batch upsert
         const { error } = await supabase.from('transactions').upsert(updates);
         if (error) throw error;

    } else {
        // Simple update
        const { error } = await supabase
            .from('transactions')
            .update({
                amount: tx.amount,
                type: tx.type,
                category: tx.category,
                description: tx.description,
                date: tx.date
            })
            .eq('id', tx.id);
        if (error) throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // Fixed Expenses
  getFixedExpenses: async (): Promise<FixedExpense[]> => {
    const { data, error } = await supabase.from('fixed_expenses').select('*');
    if (error) return [];
    return data as FixedExpense[];
  },

  addFixedExpense: async (expense: Omit<FixedExpense, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from('fixed_expenses').insert([{
        user_id: user.id,
        ...expense
    }]);
    if (error) throw error;
  },

  deleteFixedExpense: async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) throw error;
  },

  generateFixedTransactions: async (month: number, year: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Get Fixed Expenses
    const { data: fixedExpenses } = await supabase.from('fixed_expenses').select('*');
    if (!fixedExpenses || fixedExpenses.length === 0) return 0;

    // 2. Check existing for this month
    // We need to fetch transactions for this month/year that have a fixedExpenseId
    // Construct start/end dates for query
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();

    const { data: existing } = await supabase
        .from('transactions')
        .select('fixedExpenseId')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('fixedExpenseId', 'is', null);
    
    const existingIds = new Set(existing?.map((t: any) => t.fixedExpenseId));
    
    const newTxs: any[] = [];

    fixedExpenses.forEach((fe: FixedExpense) => {
        if (!existingIds.has(fe.id)) {
             const date = new Date(year, month, fe.dayOfMonth);
             // Converte para ISO preservando o dia
             const yearStr = String(date.getFullYear()).padStart(4, '0');
             const monthStr = String(date.getMonth() + 1).padStart(2, '0');
             const dayStr = String(date.getDate()).padStart(2, '0');
             const dateISO = `${yearStr}-${monthStr}-${dayStr}T00:00:00.000Z`;
             
             newTxs.push({
                user_id: user.id,
                type: 'expense',
                amount: fe.amount,
                category: fe.category,
                description: fe.description,
                date: dateISO,
                fixedExpenseId: fe.id
             });
        }
    });

    if (newTxs.length > 0) {
        const { error } = await supabase.from('transactions').insert(newTxs);
        if (error) throw error;
    }

    return newTxs.length;
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from('budgets').select('*');
    if (error) return [];
    return data as Budget[];
  },

  updateBudget: async (budget: Budget) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (budget.id) {
        // Update
        const { error } = await supabase
            .from('budgets')
            .update({ category: budget.category, limit: budget.limit })
            .eq('id', budget.id);
        if (error) throw error;
    } else {
        // Insert
        const { error } = await supabase
            .from('budgets')
            .insert([{ user_id: user.id, category: budget.category, limit: budget.limit }]);
        if (error) throw error;
    }
  }
};