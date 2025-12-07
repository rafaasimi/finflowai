import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { getFinancialAdvice } from '../services/geminiService';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function FinancialAdvisor() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: transactions } = useQuery({ queryKey: ['transactions'], queryFn: api.getTransactions });
  const { data: budgets } = useQuery({ queryKey: ['budgets'], queryFn: api.getBudgets });

  const handleGetAdvice = async () => {
    if (!transactions || !budgets) return;
    setLoading(true);
    const result = await getFinancialAdvice(transactions, budgets);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Sparkles className="text-yellow-500" /> Consultor Financeiro IA
        </h1>
        <p className="text-muted-foreground">
            Receba insights personalizados e dicas de economia baseadas nos seus hábitos de consumo e orçamentos.
        </p>
      </div>

      {!advice && !loading && (
        <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <Bot size={48} className="text-primary/50" />
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Pronto para analisar suas finanças?</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Nossa IA irá revisar suas transações deste mês, compará-las com seus orçamentos e sugerir formas acionáveis de economizar dinheiro.
                    </p>
                </div>
                <Button size="lg" onClick={handleGetAdvice} className="mt-4">
                    <Sparkles className="mr-2 h-4 w-4" /> Gerar Insights
                </Button>
            </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Analisando padrões de transação...</p>
            </CardContent>
        </Card>
      )}

      {advice && (
        <Card className="bg-card border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Bot size={20} /> Análise da IA
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-blue dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{advice}</ReactMarkdown>
                
                <div className="mt-8 pt-4 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={handleGetAdvice} disabled={loading}>
                        Atualizar Análise
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>
            <strong>Nota:</strong> Este conselho é gerado por um modelo de IA (Gemini) com base nos seus dados inseridos. 
            Não deve ser considerado aconselhamento financeiro profissional. Sempre verifique com um contador certificado.
        </p>
      </div>
    </div>
  );
}