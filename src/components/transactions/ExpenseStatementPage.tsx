import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, Trash2 } from "lucide-react";
import { listExpenses, type Category, type Transaction, type TransactionId } from "../../db";
import { formatCurrency, formatDate } from "../../utils/format";

interface ExpenseStatementPageProps {
  categories: Category[];
  syncVersion: number;
  onDelete: (id: TransactionId, description: string) => void;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function amountInCents(value: string): number | null {
  if (!value) return null;
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export function ExpenseStatementPage({ categories, syncVersion, onDelete }: ExpenseStatementPageProps) {
  const [startDate, setStartDate] = useState(`${currentMonth()}-01`);
  const [endDate, setEndDate] = useState(currentDate);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    setExpenses([]);
    listExpenses(startDate, endDate)
      .then((result) => {
        if (active) setExpenses(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setExpenses([]);
          setError(`Não foi possível carregar o extrato. ${String(cause)}`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [startDate, endDate, syncVersion]);

  const filteredExpenses = useMemo(() => {
    const query = name.trim().toLocaleLowerCase("pt-BR");
    const minimum = amountInCents(minimumAmount);
    const maximum = amountInCents(maximumAmount);
    return expenses.filter((expense) => (
      (!query || expense.description.toLocaleLowerCase("pt-BR").includes(query))
      && (!category || expense.category === category)
      && (minimum === null || expense.amount >= minimum)
      && (maximum === null || expense.amount <= maximum)
    ));
  }, [expenses, name, category, minimumAmount, maximumAmount]);

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const invalidDateRange = !startDate || !endDate || startDate > endDate;
  const minimum = amountInCents(minimumAmount);
  const maximum = amountInCents(maximumAmount);
  const invalidAmountRange = minimum !== null && maximum !== null && minimum > maximum;

  function clearFilters() {
    setStartDate(`${currentMonth()}-01`);
    setEndDate(currentDate());
    setName("");
    setCategory("");
    setMinimumAmount("");
    setMaximumAmount("");
  }

  return (
    <section className="expense-statement">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">CONSULTA DE DESPESAS</p>
          <h1>Extrato</h1>
          <p className="subtitle">Encontre despesas combinando período, nome, categoria e valor.</p>
        </div>
      </div>

      <section className="panel statement-filters" aria-label="Filtros do extrato">
        <div className="panel-heading">
          <div><h2>Filtros</h2><p>Os critérios são aplicados em conjunto.</p></div>
          <button className="statement-reset" type="button" onClick={clearFilters}>
            <RotateCcw size={14} /> Limpar filtros
          </button>
        </div>
        <div className="statement-filter-groups">
          <section className="statement-filter-group">
            <h3>Busca e categoria</h3>
            <div className="statement-filter-fields">
              <label className="statement-field">
                <span>Nome da despesa</span>
                <span className="statement-search"><Search size={15} /><input type="search" placeholder="Ex.: supermercado" value={name} onChange={(event) => setName(event.target.value)} /></span>
              </label>
              <label className="statement-field">
                <span>Categoria</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categories.filter((item) => item.kind === "expense").map((item) => (
                    <option key={item.name} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="statement-filter-group">
            <h3>Período</h3>
            <div className="statement-filter-fields">
              <label className="statement-field">
                <span>Data inicial</span>
                <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="statement-field">
                <span>Data final</span>
                <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
          </section>
          <section className="statement-filter-group">
            <h3>Faixa de valor</h3>
            <div className="statement-filter-fields">
              <label className="statement-field">
                <span>Valor mínimo (R$)</span>
                <input type="number" min="0" step="0.01" value={minimumAmount} onChange={(event) => setMinimumAmount(event.target.value)} />
              </label>
              <label className="statement-field">
                <span>Valor máximo (R$)</span>
                <input type="number" min="0" step="0.01" value={maximumAmount} onChange={(event) => setMaximumAmount(event.target.value)} />
              </label>
            </div>
          </section>
        </div>
        {invalidDateRange && <p className="statement-validation" role="alert">{!startDate || !endDate ? "Informe as datas inicial e final." : "A data inicial deve ser anterior à data final."}</p>}
        {invalidAmountRange && <p className="statement-validation" role="alert">O valor mínimo não pode ser maior que o máximo.</p>}
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className="panel transactions-panel statement-results">
        <div className="panel-heading transaction-heading">
          <div><h2>Despesas encontradas</h2><p>{filteredExpenses.length} {filteredExpenses.length === 1 ? "despesa" : "despesas"} · Total {formatCurrency(total)}</p></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>DATA</th><th className="amount-column">VALOR</th><th aria-label="Ações" /></tr></thead>
            <tbody>
              {loading ? <tr><td className="table-message" colSpan={5}>Carregando despesas...</td></tr>
                : invalidDateRange || invalidAmountRange ? <tr><td className="table-message" colSpan={5}>Ajuste os filtros para consultar o extrato.</td></tr>
                  : filteredExpenses.length ? filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td><span className="transaction-name">{expense.description}</span></td>
                      <td><span className="category-pill">{expense.category}</span></td>
                      <td className="date-cell">{formatDate(expense.date)}</td>
                      <td className="amount-cell expense">{formatCurrency(expense.amount)}</td>
                      <td><button className="delete-button" type="button" aria-label={`Excluir ${expense.description}`} onClick={() => onDelete(expense.id, expense.description)}><Trash2 size={16} /></button></td>
                    </tr>
                  )) : <tr><td className="table-message" colSpan={5}>{error ? "O extrato não pôde ser carregado." : "Nenhuma despesa corresponde aos filtros selecionados."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
