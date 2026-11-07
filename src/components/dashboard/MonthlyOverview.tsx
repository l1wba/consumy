import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Wallet } from "lucide-react";
import type { Transaction } from "../../data/types";
import { formatCurrency } from "../../utils/format";

interface MonthlyOverviewProps {
  monthLabel: string;
  transactions: Transaction[];
  income: number;
  expenses: number;
  expensesByCategory: [string, number][];
}

export function MonthlyOverview({
  monthLabel,
  transactions,
  income,
  expenses,
  expensesByCategory,
}: MonthlyOverviewProps) {
  const maxCategoryAmount = expensesByCategory[0]?.[1] ?? 1;
  const total = income + expenses;

  return (
    <>
      <section className="metric-grid" aria-label="Resumo do mês">
        <article className="metric-card balance-card">
          <div className="metric-top"><span className="metric-label">Saldo do período</span><span className="metric-icon balance-icon"><Wallet size={19} /></span></div>
          <strong className="metric-value">{formatCurrency(income - expenses)}</strong>
          <span className="metric-footnote">Entradas menos saídas em {monthLabel}</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">Total de entradas</span><span className="metric-icon income-icon"><ArrowDownLeft size={19} /></span></div>
          <strong className="metric-value">{formatCurrency(income)}</strong>
          <span className="metric-footnote">Dinheiro que entrou no período</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">Total de saídas</span><span className="metric-icon expense-icon"><ArrowUpRight size={19} /></span></div>
          <strong className="metric-value">{formatCurrency(expenses)}</strong>
          <span className="metric-footnote">Dinheiro que saiu no período</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">Lançamentos</span><span className="metric-icon count-icon"><ChartNoAxesCombined size={19} /></span></div>
          <strong className="metric-value">{transactions.length}</strong>
          <span className="metric-footnote">Registros neste período</span>
        </article>
      </section>

      <section className="insights-grid">
        <article className="panel category-panel" id="categorias">
          <div className="panel-heading">
            <div><h2>Despesas por categoria</h2><p>Onde você mais gastou neste período</p></div>
            <span className="panel-menu" aria-hidden="true">···</span>
          </div>
          {expensesByCategory.length ? (
            <div className="category-list">
              {expensesByCategory.map(([name, value], index) => (
                <div className="category-row" key={name}>
                  <div className="category-details"><span className={`category-dot category-color-${index}`} /><span>{name}</span><strong>{formatCurrency(value)}</strong></div>
                  <div className="bar-track"><span className={`bar-fill bar-color-${index}`} style={{ width: `${Math.max(4, (value / maxCategoryAmount) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chart"><span className="empty-chart-icon"><ChartNoAxesCombined size={22} /></span><strong>Nenhuma despesa por aqui</strong><span>Os gastos do período aparecerão nesta área.</span></div>
          )}
        </article>
        <article className="panel period-panel">
          <div className="panel-heading"><div><h2>Resumo do período</h2><p>Comparativo de entradas e saídas</p></div></div>
          <div className="period-summary">
            <div className="summary-line"><span><i className="legend-dot income-legend" /> Entradas</span><strong>{formatCurrency(income)}</strong></div>
            <div className="summary-line"><span><i className="legend-dot expense-legend" /> Saídas</span><strong>{formatCurrency(expenses)}</strong></div>
            <div className="comparison-track"><span className="comparison-income" style={{ width: `${total ? (income / total) * 100 : 50}%` }} /><span className="comparison-expense" /></div>
            <div className="period-result"><span>Resultado</span><strong className={income >= expenses ? "positive-value" : "negative-value"}>{formatCurrency(income - expenses)}</strong></div>
          </div>
          <div className="period-tip"><span>✦</span> Se acompanhe seus lançamentos regularmente para manter tudo sob controle.</div>
        </article>
      </section>
    </>
  );
}
