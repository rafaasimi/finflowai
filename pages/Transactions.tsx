import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, Label } from '../components/ui';
import { formatCurrency, formatDate, dateToISO, dateToInputFormat, cn, CATEGORY_STYLES } from '../lib/utils';
import { Transaction, Category, TransactionType, FixedExpense } from '../types';
import { Plus, Trash2, Calendar, Repeat, CheckCircle, ArrowRightCircle, Pencil, ChevronLeft, ChevronRight, Filter, Calculator } from 'lucide-react';

export function Transactions() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFixedExpensesOpen, setIsFixedExpensesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination & Filtering States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filterPeriod, setFilterPeriod] = useState<'current' | 'next' | 'all'>('current');

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleEdit = (tx: Transaction) => {
      setEditingTransaction(tx);
      setIsFormOpen(true);
  };

  const closeForm = () => {
      setIsFormOpen(false);
      setEditingTransaction(null);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, searchTerm, itemsPerPage]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = transactions;
    const now = new Date();
    
    // 1. Filter by Period
    if (filterPeriod === 'current') {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        result = result.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    } else if (filterPeriod === 'next') {
        // Handle Month Overflow
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = nextMonthDate.getMonth();
        const nextYear = nextMonthDate.getFullYear();
        result = result.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === nextMonth && d.getFullYear() === nextYear;
        });
    }

    // 2. Filter by Search
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(t => 
            t.description.toLowerCase().includes(lowerTerm) ||
            (CATEGORY_STYLES[t.category]?.label || t.category).toLowerCase().includes(lowerTerm)
        );
    }

    // 3. Sort by Date
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterPeriod, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Transações</h1>
        <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => setIsFixedExpensesOpen(true)} variant="outline" className="gap-2 flex-1 md:flex-none">
                <Repeat size={16} /> Despesas Fixas
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 flex-1 md:flex-none">
                <Plus size={16} /> Nova Transação
            </Button>
        </div>
      </div>

      {isFormOpen && (
          <TransactionForm 
            onClose={closeForm} 
            initialData={editingTransaction}
          />
      )}

      {isFixedExpensesOpen && (
          <FixedExpensesModal onClose={() => setIsFixedExpensesOpen(false)} />
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <span className="text-sm font-medium text-muted-foreground mr-2 flex items-center gap-1">
                <Filter size={14} /> Filtro:
            </span>
            <div className="flex bg-muted p-1 rounded-md">
                <button
                    onClick={() => setFilterPeriod('current')}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
                        filterPeriod === 'current' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Mês Atual
                </button>
                <button
                    onClick={() => setFilterPeriod('next')}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
                        filterPeriod === 'next' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Próximo Mês
                </button>
                <button
                    onClick={() => setFilterPeriod('all')}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
                        filterPeriod === 'all' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Todos
                </button>
            </div>
        </div>

        <div className="relative flex-1 max-w-sm w-full">
            <input
                placeholder="Buscar descrição ou categoria..."
                className="pl-8 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                    <th className="h-12 px-4 align-middle">Data</th>
                    <th className="h-12 px-4 align-middle">Descrição</th>
                    <th className="h-12 px-4 align-middle">Categoria</th>
                    <th className="h-12 px-4 align-middle text-right">Valor</th>
                    <th className="h-12 px-4 align-middle w-[100px] text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                {paginatedTransactions.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada para este período.</td></tr>
                ) : (
                    paginatedTransactions.map(tx => (
                        <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="p-4 align-middle w-[150px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar size={14} /> {formatDate(tx.date)}
                                </div>
                            </td>
                            <td className="p-4 align-middle font-medium text-foreground">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span>{tx.description}</span>
                                        {tx.fixedExpenseId && (
                                            <span title="Despesa Fixa Recorrente">
                                                <Repeat size={12} className="text-blue-500" />
                                            </span>
                                        )}
                                    </div>
                                    {tx.installments && (
                                        <span className="text-xs text-muted-foreground">
                                            Parcela {tx.installments.current}/{tx.installments.total}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    CATEGORY_STYLES[tx.category]?.badge || "bg-secondary text-secondary-foreground"
                                )}>
                                    {CATEGORY_STYLES[tx.category]?.label || tx.category}
                                </span>
                            </td>
                            <td className={cn(
                                "p-4 align-middle text-right font-bold",
                                tx.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="p-4 align-middle text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleEdit(tx)}
                                        className="text-muted-foreground hover:text-blue-500 transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => deleteMutation.mutate(tx.id)}
                                        className="text-muted-foreground hover:text-red-500 transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        {filteredTransactions.length > 0 && (
            <div className="border-t border-border bg-muted/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Exibindo</span>
                    <select 
                        className="border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>por página</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">
                        Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

function FixedExpensesModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dayOfMonth, setDayOfMonth] = useState('5');
    const [category, setCategory] = useState<Category>('Housing');
    const [generateLoading, setGenerateLoading] = useState(false);

    const { data: fixedExpenses } = useQuery({
        queryKey: ['fixedExpenses'],
        queryFn: api.getFixedExpenses
    });

    const addMutation = useMutation({
        mutationFn: api.addFixedExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });
            setDescription('');
            setAmount('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteFixedExpense,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] })
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate({
            description,
            amount: parseFloat(amount),
            dayOfMonth: parseInt(dayOfMonth),
            category
        });
    };

    const handleGenerate = async (target: 'current' | 'next') => {
        setGenerateLoading(true);
        const now = new Date();
        const year = now.getFullYear();
        const month = target === 'current' ? now.getMonth() : now.getMonth() + 1;
        
        // Handle year overflow for next month
        const finalDate = new Date(year, month, 1);
        
        await api.generateFixedTransactions(finalDate.getMonth(), finalDate.getFullYear());
        await queryClient.invalidateQueries({ queryKey: ['transactions'] });
        setGenerateLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-4xl bg-card relative animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row overflow-hidden max-h-[90vh] border-border">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground md:hidden z-10"><Plus className="rotate-45" /></button>
                
                {/* Left: Add Form */}
                <div className="p-6 md:w-1/3 bg-muted/30 border-r border-border flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h2 className="text-xl font-bold mb-1 text-foreground">Cadastrar Fixa</h2>
                        <p className="text-sm text-muted-foreground">Adicione contas recorrentes como internet, aluguel, etc.</p>
                    </div>

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="ex: Internet Fibra" />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Dia do Vencimento</Label>
                            <Input type="number" min="1" max="31" required value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={category} onChange={e => setCategory(e.target.value as Category)}>
                                <option value="Housing">Moradia</option>
                                <option value="Transport">Transporte</option>
                                <option value="Food">Alimentação</option>
                                <option value="Entertainment">Entretenimento</option>
                                <option value="Health">Saúde</option>
                                <option value="Education">Educação</option>
                                <option value="Pets">Animais de Estimação</option>
                                <option value="Clothing">Roupas</option>
                                <option value="Other">Outros</option>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" isLoading={addMutation.isPending}>
                            <Plus size={16} className="mr-2" /> Adicionar
                        </Button>
                    </form>

                    <div className="mt-auto pt-6 border-t border-border">
                         <h3 className="font-medium mb-3 text-sm text-muted-foreground">Ações Rápidas</h3>
                         <div className="space-y-2">
                             <Button 
                                variant="outline" 
                                className="w-full justify-start text-left h-auto py-3 border-blue-200/50 hover:bg-blue-50/50 text-blue-700 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/20"
                                onClick={() => handleGenerate('current')}
                                isLoading={generateLoading}
                             >
                                <div className="flex flex-col items-start">
                                    <span className="flex items-center gap-2 font-bold"><CheckCircle size={14}/> Lançar neste Mês</span>
                                    <span className="text-xs opacity-70 font-normal">Gera as contas que faltam para o mês atual.</span>
                                </div>
                             </Button>
                             <Button 
                                variant="outline" 
                                className="w-full justify-start text-left h-auto py-3 border-green-200/50 hover:bg-green-50/50 text-green-700 dark:text-green-400 dark:border-green-900/50 dark:hover:bg-green-900/20"
                                onClick={() => handleGenerate('next')}
                                isLoading={generateLoading}
                             >
                                <div className="flex flex-col items-start">
                                    <span className="flex items-center gap-2 font-bold"><ArrowRightCircle size={14}/> Previsão Próximo Mês</span>
                                    <span className="text-xs opacity-70 font-normal">Lança todas as fixas no mês que vem.</span>
                                </div>
                             </Button>
                         </div>
                    </div>
                </div>

                {/* Right: List */}
                <div className="p-6 md:w-2/3 flex flex-col h-full bg-card overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-foreground">Minhas Despesas Fixas</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground hidden md:block"><Plus className="rotate-45" /></button>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-2">
                        {fixedExpenses?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                <Repeat size={48} className="mb-4 opacity-20" />
                                <p>Nenhuma despesa fixa cadastrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fixedExpenses?.map(fe => (
                                    <div key={fe.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all bg-card">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                                {fe.dayOfMonth}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{fe.description}</p>
                                                <p className="text-xs text-muted-foreground">{CATEGORY_STYLES[fe.category]?.label || fe.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-foreground">{formatCurrency(fe.amount)}</span>
                                            <button 
                                                onClick={() => deleteMutation.mutate(fe.id)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

function TransactionForm({ onClose, initialData }: { onClose: () => void, initialData?: Transaction | null }) {
    const queryClient = useQueryClient();
    
    // Helper to strip installment suffix for editing base name
    const getInitialDescription = (desc: string) => {
        return desc.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    };

    const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState<Category>(initialData?.category || 'Food');
    const getTodayInputFormat = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [date, setDate] = useState(initialData?.date ? dateToInputFormat(initialData.date) : getTodayInputFormat());
    const [description, setDescription] = useState(initialData ? getInitialDescription(initialData.description) : '');
    const [installments, setInstallments] = useState(1);
    
    // New state for calculation mode: 'total' (Total Value) or 'installment' (Value per Month)
    const [calculationMode, setCalculationMode] = useState<'total' | 'installment'>('total');
    
    // Logic: if editing, check if it's an installment to warn/disable
    const isEditing = !!initialData;
    const isInstallment = !!initialData?.installments;

    const addMutation = useMutation({
        mutationFn: (data: any) => api.addTransaction(data.tx, data.installments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        }
    });

    const updateMutation = useMutation({
        mutationFn: api.updateTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalAmount = parseFloat(amount);

        // If in 'installment' mode and creating a new expense, calculate the total amount
        if (!isEditing && type === 'expense' && calculationMode === 'installment' && installments > 1) {
            finalAmount = finalAmount * installments;
        }
        
        if (isEditing && initialData) {
            updateMutation.mutate({
                ...initialData,
                type,
                amount: finalAmount,
                category,
                date: dateToISO(date),
                description 
            });
        } else {
            addMutation.mutate({
                tx: {
                    type,
                    amount: finalAmount,
                    category,
                    date: dateToISO(date),
                    description
                },
                installments: type === 'expense' ? installments : 1
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg bg-card relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><Plus className="rotate-45" /></button>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Editar Transação' : 'Nova Transação'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isEditing && isInstallment && (
                            <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 p-3 rounded-md text-sm mb-2 flex items-start gap-2">
                                <span className="font-bold">Nota:</span> 
                                Editando uma parcela ({(initialData?.installments?.current || 0)}/{(initialData?.installments?.total || 0)}). 
                                Alterações no valor e descrição serão aplicadas a todas as parcelas desta série.
                            </div>
                        )}

                        {/* Type Selection */}
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setType('expense')}
                                    className={cn("flex-1 px-4 py-2 text-sm font-medium rounded-l-md border transition-colors", type === 'expense' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800" : "bg-card text-foreground border-input")}
                                >Despesa</button>
                                <button
                                    type="button"
                                    onClick={() => setType('income')}
                                    className={cn("flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r transition-colors", type === 'income' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800" : "bg-card text-foreground border-input")}
                                >Receita</button>
                            </div>
                        </div>

                        {/* Calculation Mode Toggle (Only for new expenses with installments > 1 logic visually) */}
                        {!isEditing && type === 'expense' && installments > 1 && (
                             <div className="bg-muted p-3 rounded-md border border-border mb-2">
                                <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Modo de Cálculo</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                                        <input 
                                            type="radio" 
                                            name="calcMode" 
                                            checked={calculationMode === 'total'} 
                                            onChange={() => setCalculationMode('total')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        Valor Total
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                                        <input 
                                            type="radio" 
                                            name="calcMode" 
                                            checked={calculationMode === 'installment'} 
                                            onChange={() => setCalculationMode('installment')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        Valor da Parcela
                                    </label>
                                </div>
                             </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    {/* Dynamic Label */}
                                    {!isEditing && type === 'expense' && installments > 1 && calculationMode === 'installment' 
                                        ? 'Valor da Parcela (R$)' 
                                        : 'Valor Total (R$)'}
                                </Label>
                                <Input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                            </div>
                             {type === 'expense' && !isEditing ? (
                                <div className="space-y-2">
                                    <Label>Parcelas (Meses)</Label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        max="360" // Limit changed to 360 months (30 years)
                                        value={installments} 
                                        onChange={e => setInstallments(parseInt(e.target.value) || 1)} 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {/* Calculation Feedback */}
                        {!isEditing && type === 'expense' && installments > 1 && amount && (
                            <div className="text-sm bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 p-2 rounded flex items-center gap-2">
                                <Calculator size={14} />
                                {calculationMode === 'total' ? (
                                    <span>
                                        Sua parcela será de: <strong>{formatCurrency(parseFloat(amount) / installments)}</strong>
                                    </span>
                                ) : (
                                    <span>
                                        Valor total da compra: <strong>{formatCurrency(parseFloat(amount) * installments)}</strong>
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="ex: Compra do Apartamento" />
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={category} onChange={e => setCategory(e.target.value as Category)}>
                                <option value="Housing">Moradia</option>
                                <option value="Food">Alimentação</option>
                                <option value="Transport">Transporte</option>
                                <option value="Entertainment">Entretenimento</option>
                                <option value="Health">Saúde</option>
                                <option value="Education">Educação</option>
                                <option value="Pets">Animais de Estimação</option>
                                <option value="Clothing">Roupas</option>
                                <option value="Other">Outros</option>
                                {type === 'income' && (
                                    <>
                                        <option value="Salary">Salário</option>
                                        <option value="Investment">Investimento</option>
                                    </>
                                )}
                            </Select>
                        </div>
                        
                        {type === 'expense' && !isEditing && (
                            <div className="space-y-2">
                                <Label>Data da 1ª Parcela</Label>
                                <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" isLoading={addMutation.isPending || updateMutation.isPending}>
                                {isEditing ? 'Salvar Alterações' : 'Salvar'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}