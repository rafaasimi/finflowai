import { GoogleGenAI } from "@google/genai";
import { Transaction, Budget } from '../types';

export const getFinancialAdvice = async (transactions: Transaction[], budgets: Budget[]) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare data summary for the model to reduce token usage
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const categoryBreakdown: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    const prompt = `
      Você é um assistente pessoal de finanças. Analise o resumo financeiro mensal abaixo em formato JSON.
      
      Dados do Usuário:
      - Receita Total: ${income}
      - Despesas Totais: ${expenses}
      - Saldo Líquido: ${income - expenses}
      - Despesas por Categoria: ${JSON.stringify(categoryBreakdown)}
      - Orçamentos Definidos: ${JSON.stringify(budgets)}

      Tarefa:
      1. Forneça um resumo curto da saúde financeira (Boa, Razoável, Atenção).
      2. Identifique a categoria com maior gasto.
      3. Dê 2 dicas acionáveis e específicas para economizar dinheiro com base nesses dados.
      4. Se alguma categoria exceder o orçamento, sinalize especificamente.

      Mantenha o tom encorajador, mas profissional. A saída deve ser em texto simples, formatada com markdown para legibilidade. Responda inteiramente em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar conselhos financeiros no momento. Por favor verifique sua chave de API.";
  }
};