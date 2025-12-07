import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, Select } from '../components/ui';
import { formatCurrency, cn, CATEGORY_STYLES } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

export function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(currentYear);

  // Generate a range of years: 2 years back and 10 years forward to support future installments
  const availableYears = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => currentYear - 2 + i);
  }, [currentYear]);

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
  }, [transactions, filterMonth, filterYear]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    
    // Transform to array and SORT DESCENDING by value
    return Object.entries(data)
        .map(([name, value]) => ({ 
            name: CATEGORY_STYLES[name]?.label || name, 
            originalKey: name,
            value,
            color: CATEGORY_STYLES[name]?.color || '#999'
        }))
        .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const flowData = [
    { name: 'Receitas', amount: summary.income },
    { name: 'Despesas', amount: summary.expense },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel</h1>
        <div className="flex gap-2">
            <Select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="w-[160px]"
            >
                {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                        {new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).slice(1)}
                    </option>
                ))}
            </Select>
            <Select 
                value={filterYear} 
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="w-[100px]"
            >
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.expense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", summary.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--foreground)'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} tick={{fill: 'var(--foreground)'}} />
                    <Tooltip 
                        formatter={(value: number) => formatCurrency(value)} 
                        cursor={{fill: 'var(--muted)'}} 
                        contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={50}>
                        {flowData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'Receitas' ? '#10b981' : '#ef4444'} 
                            />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-[350px]">
                {categoryData.length > 0 ? (
                    <>
                        {/* Chart Top */}
                        <div className="h-[200px] w-full shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)} 
                                        contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* List Bottom with Dotted Lines */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-4 space-y-2">
                            {categoryData.map((item) => (
                                <div key={item.name} className="flex items-end justify-between text-sm group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div 
                                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                                            style={{ backgroundColor: item.color }} 
                                        />
                                        <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors truncate max-w-[120px]" title={item.name}>
                                            {item.name}
                                        </span>
                                    </div>
                                    
                                    {/* Dotted Line Spacer */}
                                    <div className="flex-1 border-b border-dotted border-muted-foreground/30 mx-2 mb-1.5 relative"></div>
                                    
                                    <span className="font-semibold tabular-nums text-foreground mb-1">
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-lg bg-muted/10">
                        <Wallet className="h-8 w-8 mb-2 opacity-50" />
                        <p>Sem despesas este mês</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}