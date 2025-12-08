import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatCurrency, cn, CATEGORY_STYLES } from "../lib/utils";
import { Category } from "../types";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Progress } from "@/components/progress";
import { Label } from "@/components/label";
import { Select } from "@/components/select";
import { Input } from "@/components/input";

export function Budgets() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState<string | null>(null);

  const { data: budgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: api.getBudgets,
  });
  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: api.getTransactions,
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    if (!transactions) return spending;

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (
        t.type === "expense" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    });
    return spending;
  }, [transactions, currentMonth, currentYear]);

  const updateBudgetMutation = useMutation({
    mutationFn: api.updateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setIsEditing(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Orçamentos Mensais
        </h1>
        <Button onClick={() => setIsEditing("new")} className="gap-2">
          <Plus size={16} /> Definir Meta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets?.map((budget) => {
          const spent = spendingByCategory[budget.category] || 0;
          const percentage = (spent / budget.limit) * 100;
          const isOver = spent > budget.limit;

          return (
            <Card
              key={budget.id}
              className={cn(
                "relative overflow-hidden",
                isOver ? "border-red-500/50 bg-destructive/10" : ""
              )}
            >
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-lg font-medium">
                  {CATEGORY_STYLES[budget.category]?.label || budget.category}
                </CardTitle>
                <span className="text-sm font-bold text-muted-foreground">
                  Limite {formatCurrency(budget.limit)}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span
                    className={
                      isOver
                        ? "text-red-600 dark:text-red-400 font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {formatCurrency(spent)} gastos
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <Progress
                  value={spent}
                  max={budget.limit}
                  className="h-2"
                  indicatorClassName={
                    isOver
                      ? "bg-red-500"
                      : percentage > 80
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }
                />
                {isOver && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium animate-pulse">
                    <AlertTriangle size={16} />
                    Orçamento excedido em {formatCurrency(spent - budget.limit)}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setIsEditing(budget.id)}
                >
                  Editar Meta
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isEditing && (
        <BudgetForm
          existingBudget={budgets?.find((b) => b.id === isEditing)}
          onClose={() => setIsEditing(null)}
          onSave={(b) => updateBudgetMutation.mutate(b)}
        />
      )}
    </div>
  );
}

function BudgetForm({
  existingBudget,
  onClose,
  onSave,
}: {
  existingBudget?: any;
  onClose: () => void;
  onSave: (b: any) => void;
}) {
  const [category, setCategory] = React.useState<Category>(
    existingBudget?.category || "Food"
  );
  const [limit, setLimit] = React.useState(existingBudget?.limit || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: existingBudget?.id,
      category,
      limit: parseFloat(limit),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-card">
        <CardHeader>
          <CardTitle>
            {existingBudget ? "Editar Orçamento" : "Novo Orçamento"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={!!existingBudget} // Disable changing category on edit for simplicity
              >
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
            <div className="space-y-2">
              <Label>Limite Mensal (R$)</Label>
              <Input
                type="number"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Meta</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
