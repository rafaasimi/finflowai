import { mockApi } from './mockDb';
import { supabaseService } from './supabaseService';
import { Transaction, Budget, FixedExpense, User } from '../types';

type ApiProvider = 'mock' | 'supabase';

// Global state to track provider. In a real app, this might be in Context,
// but for simple switching based on login event, a module variable works.
let currentProvider: ApiProvider = 'mock';

export const setApiProvider = (provider: ApiProvider) => {
    currentProvider = provider;
    // Persist choice to allow refresh (basic handling)
    localStorage.setItem('finflow_provider', provider);
};

// Initialize from storage or default
const storedProvider = localStorage.getItem('finflow_provider') as ApiProvider;
if (storedProvider) currentProvider = storedProvider;

// The unified API interface
export const api = {
    // Auth-related helpers
    getProvider: () => currentProvider,
    
    // Methods delegating to the current provider
    getTransactions: () => currentProvider === 'supabase' ? supabaseService.getTransactions() : mockApi.getTransactions(),
    addTransaction: (tx: Omit<Transaction, 'id'>, installments?: number) => currentProvider === 'supabase' ? supabaseService.addTransaction(tx, installments) : mockApi.addTransaction(tx, installments),
    updateTransaction: (tx: Transaction) => currentProvider === 'supabase' ? supabaseService.updateTransaction(tx) : mockApi.updateTransaction(tx),
    deleteTransaction: (id: string) => currentProvider === 'supabase' ? supabaseService.deleteTransaction(id) : mockApi.deleteTransaction(id),
    
    getFixedExpenses: () => currentProvider === 'supabase' ? supabaseService.getFixedExpenses() : mockApi.getFixedExpenses(),
    addFixedExpense: (ex: Omit<FixedExpense, 'id'>) => currentProvider === 'supabase' ? supabaseService.addFixedExpense(ex) : mockApi.addFixedExpense(ex),
    deleteFixedExpense: (id: string) => currentProvider === 'supabase' ? supabaseService.deleteFixedExpense(id) : mockApi.deleteFixedExpense(id),
    generateFixedTransactions: (m: number, y: number) => currentProvider === 'supabase' ? supabaseService.generateFixedTransactions(m, y) : mockApi.generateFixedTransactions(m, y),
    
    getBudgets: () => currentProvider === 'supabase' ? supabaseService.getBudgets() : mockApi.getBudgets(),
    updateBudget: (b: Budget) => currentProvider === 'supabase' ? supabaseService.updateBudget(b) : mockApi.updateBudget(b),
};