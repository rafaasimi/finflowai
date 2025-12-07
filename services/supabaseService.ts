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
        const baseDate = new Date(tx.date);
        const originalId = crypto.randomUUID();

        for (let i = 0; i < installments; i++) {
            const nextDate = new Date(baseDate);
            nextDate.setMonth(baseDate.getMonth() + i);
            
            newTxs.push({
                user_id: user.id,
                amount: amountPerInstallment,
                type: tx.type,
                category: tx.category,
                description: `${tx.description} (${i + 1}/${installments})`,
                date: nextDate.toISOString(),
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
             newTxs.push({
                user_id: user.id,
                type: 'expense',
                amount: fe.amount,
                category: fe.category,
                description: fe.description,
                date: date.toISOString(),
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