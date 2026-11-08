import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarClock, Check, CircleAlert, Plus, X } from "lucide-react";
import {
  cancelRecurringItem,
  createRecurringItem,
  listRecurringItems,
  listRecurringPayments,
  markRecurringItemPaid,
  type Category,
  type NewRecurringItem,
  type RecurrenceFrequency,
  type RecurringItem,
  type RecurringPayment,
  type RecurringItemType,
} from "../../db";

interface RecurringPaymentsPageProps {
  itemType: RecurringItemType;
  month: string;
  categories: Category[];
  syncVersion: number;
  onPaymentComplete: () => void;
}

interface DueOccurrence {
  item: RecurringItem;
  dueDate: string;
  payment?: RecurringPayment;
  status: "paid" | "cancelled" | "overdue" | "today" | "upcoming";
  daysUntilDue: number;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function periodDueDates(item: RecurringItem, throughMonth: string): string[] {
  const [targetYear, targetMonth] = throughMonth.split("-").map(Number);
  const [startYear, startMonth] = item.start_date.slice(0, 7).split("-").map(Number);
  const firstMonthIndex = startYear * 12 + startMonth - 1;
  const lastMonthIndex = targetYear * 12 + targetMonth - 1;
  const dueDates: string[] = [];

  for (let monthIndex = firstMonthIndex; monthIndex <= lastMonthIndex; monthIndex += 1) {
    const year = Math.floor(monthIndex / 12);
    const monthNumber = (monthIndex % 12) + 1;
    if (item.frequency === "yearly" && monthNumber !== item.due_month) continue;
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const day = Math.min(item.due_day, lastDay);
    const dueDate = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dueDate < item.start_date || (item.end_date && dueDate > item.end_date)) continue;
    dueDates.push(dueDate);
  }
  return dueDates;
}

function dateDistance(from: string, to: string): number {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  return Math.round((toTime - fromTime) / 86_400_000);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function RecurringPaymentsPage({
  itemType,
  month,
  categories,
  syncVersion,
  onPaymentComplete,
}: RecurringPaymentsPageProps) {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyOccurrence, setBusyOccurrence] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [dueDay, setDueDay] = useState(String(new Date().getDate()));
  const [dueMonth, setDueMonth] = useState(String(new Date().getMonth() + 1));
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState("");

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.kind === "expense"),
    [categories],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextItems, nextPayments] = await Promise.all([
        listRecurringItems(),
        listRecurringPayments(month),
      ]);
      setItems(nextItems);
      setPayments(nextPayments);
    } catch (cause) {
      setError(`Não foi possível carregar as contas recorrentes. ${String(cause)}`);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void refresh();
  }, [refresh, syncVersion]);

  useEffect(() => {
    if (!category && expenseCategories.length > 0) setCategory(expenseCategories[0].name);
  }, [category, expenseCategories]);

  const occurrences = useMemo(() => {
    const paymentMap = new Map(payments.map((payment) => [
      `${payment.recurring_item_id}:${payment.due_date}`,
      payment,
    ]));
    const today = todayIso();

    return items
      .filter((item) => item.item_type === itemType)
      .flatMap((item): DueOccurrence[] => {
        return periodDueDates(item, month).flatMap((dueDate): DueOccurrence[] => {
          const payment = paymentMap.get(`${item.id}:${dueDate}`);
          const isSelectedMonth = dueDate.slice(0, 7) === month;
          const isCancelled = Boolean(item.cancelled_at && dueDate >= item.cancelled_at);
          if (!isSelectedMonth && (payment || isCancelled)) return [];

          const daysUntilDue = dateDistance(today, dueDate);
          let status: DueOccurrence["status"];
          if (payment) status = "paid";
          else if (isCancelled) status = "cancelled";
          else if (daysUntilDue < 0) status = "overdue";
          else if (daysUntilDue === 0) status = "today";
          else status = "upcoming";
          return [{ item, dueDate, payment, status, daysUntilDue }];
        });
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.item.name.localeCompare(b.item.name, "pt-BR"));
  }, [items, itemType, month, payments]);

  const summary = useMemo(() => ({
    overdue: occurrences.filter((item) => item.status === "overdue").length,
    upcoming: occurrences.filter((item) => item.status === "today" || item.status === "upcoming").length,
    paid: occurrences.filter((item) => item.status === "paid").length,
  }), [occurrences]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountInCents = Math.round(Number(amount.replace(",", ".")) * 100);
    const day = Number(dueDay);
    const monthNumber = Number(dueMonth);
    if (!name.trim() || !Number.isSafeInteger(amountInCents) || amountInCents <= 0
      || !category || !startDate || !Number.isInteger(day) || day < 1 || day > 31
      || (frequency === "yearly" && (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12))
      || (endDate && endDate < startDate)) {
      setError("Confira o nome, valor, categoria, vencimento e período da recorrência.");
      return;
    }

    const item: NewRecurringItem = {
      name: name.trim(),
      amount: amountInCents,
      category,
      item_type: itemType,
      frequency,
      due_day: day,
      due_month: frequency === "yearly" ? monthNumber : null,
      start_date: startDate,
      end_date: endDate || null,
    };

    setSaving(true);
    setError("");
    try {
      await createRecurringItem(item);
      setName("");
      setAmount("");
      setEndDate("");
      setShowForm(false);
      await refresh();
    } catch (cause) {
      setError(`Não foi possível cadastrar a recorrência. ${String(cause)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(occurrence: DueOccurrence) {
    const { item, dueDate } = occurrence;
    const key = `${item.id}:${dueDate}`;
    setBusyOccurrence(key);
    setError("");
    try {
      await markRecurringItemPaid(item.id, dueDate, todayIso());
      await refresh();
      onPaymentComplete();
    } catch (cause) {
      setError(`Não foi possível registrar o pagamento. ${String(cause)}`);
    } finally {
      setBusyOccurrence("");
    }
  }

  async function handleCancel(item: RecurringItem) {
    if (!window.confirm(`Cancelar "${item.name}"? Os vencimentos futuros deixarão de ser cobrados.`)) return;
    setError("");
    try {
      await cancelRecurringItem(item.id);
      await refresh();
    } catch (cause) {
      setError(`Não foi possível cancelar a recorrência. ${String(cause)}`);
    }
  }

  const title = itemType === "subscription" ? "Assinaturas" : "Contas fixas";
  const description = itemType === "subscription"
    ? "Acompanhe serviços recorrentes, valores e próximas cobranças."
    : "Organize contas mensais e anuais com vencimentos em um só lugar.";

  return (
    <section className="recurring-page">
      <header className="recurring-heading">
        <div>
          <p className="eyebrow">{itemType === "subscription" ? "SERVIÇOS RECORRENTES" : "DESPESAS PROGRAMADAS"}</p>
          <h1>{title}</h1>
          <p className="subtitle">{description}</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((open) => !open)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Fechar" : itemType === "subscription" ? "Nova assinatura" : "Nova conta"}
        </button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="recurring-summary">
        <article className="recurring-summary-card overdue"><CircleAlert size={18} /><span><strong>{summary.overdue}</strong><small>Em atraso</small></span></article>
        <article className="recurring-summary-card upcoming"><CalendarClock size={18} /><span><strong>{summary.upcoming}</strong><small>A vencer</small></span></article>
        <article className="recurring-summary-card paid"><Check size={18} /><span><strong>{summary.paid}</strong><small>Pagas neste período</small></span></article>
      </div>

      {showForm && (
        <form className="recurring-form-card" onSubmit={(event) => void handleCreate(event)}>
          <h2>{itemType === "subscription" ? "Cadastrar assinatura" : "Cadastrar conta recorrente"}</h2>
          <div className="recurring-form-grid">
            <label className="recurring-field recurring-field-wide">
              <span>Nome</span>
              <input required maxLength={100} placeholder={itemType === "subscription" ? "Ex.: Serviço de streaming" : "Ex.: Energia elétrica"} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="recurring-field">
              <span>Valor (R$)</span>
              <input required type="number" min="0.01" step="0.01" placeholder="0,00" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className="recurring-field">
              <span>Categoria</span>
              <select required value={category} onChange={(event) => setCategory(event.target.value)}>
                {expenseCategories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="recurring-field">
              <span>Frequência</span>
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </label>
            {frequency === "yearly" && (
              <label className="recurring-field">
                <span>Mês do vencimento</span>
                <select value={dueMonth} onChange={(event) => setDueMonth(event.target.value)}>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {new Date(2026, index, 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="recurring-field">
              <span>Dia do vencimento</span>
              <input required type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} />
            </label>
            <label className="recurring-field">
              <span>Início da recorrência</span>
              <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="recurring-field">
              <span>Data final (opcional)</span>
              <input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
          <p className="recurring-form-note">Meses sem o dia escolhido vencem no último dia do mês. Recorrências anuais usam o mês e o dia informados.</p>
          <div className="recurring-form-actions">
            <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || expenseCategories.length === 0}>
              {saving ? "Salvando..." : "Salvar recorrência"}
            </button>
          </div>
        </form>
      )}

      <div className="recurring-list-heading">
        <div><h2>Vencimentos do período</h2><span>{occurrences.length}</span></div>
        <small>{new Date(`${month}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</small>
      </div>
      <p className="recurring-payment-note">Ao marcar uma conta como paga, o consumy registra a despesa na data do pagamento. Vencimentos anteriores ainda não pagos permanecem em atraso até a baixa.</p>

      {loading ? (
        <div className="recurring-empty" role="status">Carregando vencimentos...</div>
      ) : occurrences.length === 0 ? (
        <div className="recurring-empty">
          <CalendarClock size={25} />
          <strong>Nenhum vencimento neste período</strong>
          <span>Cadastre uma conta ou assinatura para acompanhar as próximas cobranças.</span>
        </div>
      ) : (
        <div className="recurring-list">
          {occurrences.map((occurrence) => {
            const { item, dueDate, status, daysUntilDue } = occurrence;
            const key = `${item.id}:${dueDate}`;
            const statusLabel = status === "paid"
              ? "Pago"
              : status === "cancelled"
                ? "Cancelada"
                : status === "overdue"
                  ? `Atrasado há ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? "dia" : "dias"}`
                  : status === "today"
                    ? "Vence hoje"
                    : `Vencerá em ${daysUntilDue} ${daysUntilDue === 1 ? "dia" : "dias"}`;
            return (
              <article className="recurring-row" key={key}>
                <div className={`recurring-date-icon ${status}`}><CalendarClock size={17} /></div>
                <div className="recurring-item-copy">
                  <strong>{item.name}</strong>
                  <span>{formatDate(dueDate)} · {item.category} · {item.frequency === "monthly" ? "Mensal" : "Anual"}</span>
                </div>
                <strong className="recurring-amount">{formatCurrency(item.amount)}</strong>
                <span className={`recurring-status ${status}`}>{statusLabel}</span>
                <div className="recurring-row-actions">
                  {status !== "paid" && status !== "cancelled" && (
                    <button className="recurring-pay-button" type="button" disabled={busyOccurrence === key} onClick={() => void handleMarkPaid(occurrence)}>
                      <Check size={14} /> {busyOccurrence === key ? "Salvando..." : "Marcar paga"}
                    </button>
                  )}
                  {item.cancelled_at === null && (
                    <button className="recurring-cancel-button" type="button" aria-label={`Cancelar ${item.name}`} onClick={() => void handleCancel(item)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
