import { Search, Trash2 } from "lucide-react";
import type { Transaction, TransactionId, TransactionKind } from "../../data/types";
import { formatCurrency, formatDate } from "../../utils/format";

interface TransactionTableProps {
  monthLabel: string;
  transactions: Transaction[];
  loading: boolean;
  search: string;
  kindFilter: "all" | TransactionKind;
  onSearchChange: (search: string) => void;
  onKindFilterChange: (kind: "all" | TransactionKind) => void;
  onDelete: (id: TransactionId, description: string) => void;
}

export function TransactionTable({
  monthLabel,
  transactions,
  loading,
  search,
  kindFilter,
  onSearchChange,
  onKindFilterChange,
  onDelete,
}: TransactionTableProps) {
  return (
    <section className="panel transactions-panel" id="transacoes">
      <div className="panel-heading transaction-heading">
        <div><h2>Lançamentos recentes</h2><p>Confira as movimentações de {monthLabel}</p></div>
        <div className="table-actions">
          <label className="search-field"><Search size={16} /><input placeholder="Buscar lançamento" aria-label="Buscar lançamento" value={search} onChange={(event) => onSearchChange(event.target.value)} /></label>
          <select className="filter-select" aria-label="Filtrar por tipo" value={kindFilter} onChange={(event) => onKindFilterChange(event.target.value as "all" | TransactionKind)}>
            <option value="all">Todos</option><option value="income">Entradas</option><option value="expense">Saídas</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>DATA</th><th>TIPO</th><th className="amount-column">VALOR</th><th aria-label="Ações" /></tr></thead>
          <tbody>
            {loading ? <tr><td className="table-message" colSpan={6}>Carregando lançamentos...</td></tr>
              : transactions.length ? transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td><span className="transaction-name">{transaction.description}</span></td>
                  <td><span className="category-pill">{transaction.category}</span></td>
                  <td className="date-cell">{formatDate(transaction.date)}</td>
                  <td><span className={`type-badge ${transaction.kind}`}><i />{transaction.kind === "income" ? "Entrada" : "Saída"}</span></td>
                  <td className={`amount-cell ${transaction.kind}`}>{transaction.kind === "income" ? "+" : "−"} {formatCurrency(transaction.amount)}</td>
                  <td><button className="delete-button" type="button" aria-label={`Excluir ${transaction.description}`} onClick={() => onDelete(transaction.id, transaction.description)}><Trash2 size={16} /></button></td>
                </tr>
              )) : <tr><td className="table-message" colSpan={6}>{search || kindFilter !== "all" ? "Nenhum lançamento corresponde a essa busca." : "Nenhum lançamento neste mês. Adicione uma entrada ou despesa para começar."}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span>{transactions.length} {transactions.length === 1 ? "lançamento" : "lançamentos"}</span><span>Armazenado localmente no seu computador</span></div>
    </section>
  );
}
