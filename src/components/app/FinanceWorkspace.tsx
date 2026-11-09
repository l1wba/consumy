import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronDown,
  Plus,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AboutDialog } from "../dialogs/AboutDialog";
import { CategoryDialog } from "../dialogs/CategoryDialog";
import { MonthlyOverview } from "../dashboard/MonthlyOverview";
import { NewTransactionForm } from "../transactions/NewTransactionForm";
import { TransactionTable } from "../transactions/TransactionTable";
import { ExpenseStatementPage } from "../transactions/ExpenseStatementPage";
import { RecurringPaymentsPage } from "../recurring/RecurringPaymentsPage";
import { FinanceSidebar } from "./FinanceSidebar";
import {
  createCategory,
  createTransaction,
  DEFAULT_CATEGORIES,
  getThemePreference,
  listCategories,
  listTransactions,
  removeCategory,
  removeTransaction,
  renameCategory,
  saveThemePreference,
  subscribeToFinanceChanges,
  type Category,
  type Transaction,
  type TransactionId,
  type TransactionKind,
  type ThemePreference,
  type RecurringItemType,
} from "../../db";
import { formatMonth } from "../../utils/format";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function FinanceWorkspace({
  userEmail,
  authError,
  onSignOut,
}: {
  userEmail: string;
  authError: string;
  onSignOut: () => void;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kindFilter, setKindFilter] = useState<"all" | TransactionKind>("all");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Moradia");
  const [date, setDate] = useState(currentDate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categorySubmenuOpen, setCategorySubmenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutLinkError, setAboutLinkError] = useState("");
  const [categoryKind, setCategoryKind] = useState<TransactionKind>("expense");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryDialog, setCategoryDialog] = useState<"manage" | "edit" | null>(null);
  const [categoryDialogError, setCategoryDialogError] = useState("");
  const [categoryDialogBusy, setCategoryDialogBusy] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [recurringView, setRecurringView] = useState<RecurringItemType | null>(null);
  const [recurringMenuOpen, setRecurringMenuOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [financeRevision, setFinanceRevision] = useState(0);

  const categoriesForKind = useMemo(
    () => categories.filter((item) => item.kind === kind),
    [categories, kind],
  );
  const settingsCategories = useMemo(
    () => categories.filter((item) => item.kind === categoryKind),
    [categories, categoryKind],
  );
  const editableCategory = settingsCategories.find((item) => item.name === editingCategoryName);

  async function openCreatorLink(url: string) {
    setAboutLinkError("");
    try {
      await openUrl(url);
    } catch (cause) {
      setAboutLinkError(`Não foi possível abrir o link no navegador. ${String(cause)}`);
    }
  }

  useEffect(() => {
    if (!categoryDialog && !aboutOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (aboutOpen) setAboutOpen(false);
      if (categoryDialog && !categoryDialogBusy) setCategoryDialog(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aboutOpen, categoryDialog, categoryDialogBusy]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTransactions(await listTransactions(month));
    } catch (cause) {
      setError(`Não foi possível acessar os dados sincronizados. ${String(cause)}`);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    getThemePreference()
      .then((preference) => {
        if (preference) setTheme(preference);
      })
      .catch((cause: unknown) => {
        setError(`Não foi possível carregar a preferência de tema. ${String(cause)}`);
      });
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      setCategories(await listCategories());
    } catch (cause) {
      setError(`Não foi possível atualizar as categorias sincronizadas. ${String(cause)}`);
    }
  }, []);

  const refreshTheme = useCallback(async () => {
    try {
      const preference = await getThemePreference();
      if (preference) setTheme(preference);
    } catch (cause) {
      setError(`Não foi possível atualizar a preferência de tema. ${String(cause)}`);
    }
  }, []);

  useEffect(() => subscribeToFinanceChanges(
    () => {
      setFinanceRevision((revision) => revision + 1);
      void refresh();
      void refreshCategories();
      void refreshTheme();
    },
    (cause) => setError(`A sincronização em tempo real foi interrompida. ${cause.message}`),
  ), [refresh, refreshCategories, refreshTheme]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((cause: unknown) => {
        setError(`Não foi possível carregar as categorias. ${String(cause)}`);
      });
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return transactions.filter((transaction) => {
      const matchesKind = kindFilter === "all" || transaction.kind === kindFilter;
      const matchesSearch = !query
        || transaction.description.toLocaleLowerCase("pt-BR").includes(query)
        || transaction.category.toLocaleLowerCase("pt-BR").includes(query);
      return matchesKind && matchesSearch;
    });
  }, [transactions, kindFilter, search]);

  const totals = useMemo(() => {
    return transactions.reduce((result, transaction) => {
      result[transaction.kind] += transaction.amount;
      return result;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const totalsByCategory = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.kind === "expense") {
        totalsByCategory.set(
          transaction.category,
          (totalsByCategory.get(transaction.category) ?? 0) + transaction.amount,
        );
      }
    }
    return [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountInCents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!description.trim() || !Number.isSafeInteger(amountInCents) || amountInCents <= 0 || !date || !category) {
      setError("Preencha a descrição, um valor válido, uma categoria e a data do lançamento.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createTransaction({
        description: description.trim(),
        amount: amountInCents,
        kind,
        category,
        date,
      });
      setDescription("");
      setAmount("");
      setFormOpen(false);
      if (date.slice(0, 7) === month) {
        await refresh();
      } else {
        setMonth(date.slice(0, 7));
      }
    } catch (cause) {
      setError(`Não foi possível salvar o lançamento. ${String(cause)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: TransactionId, description: string) {
    if (!window.confirm(`Excluir o lançamento "${description}"?`)) return;
    setError("");
    try {
      await removeTransaction(id);
      await refresh();
      setFinanceRevision((revision) => revision + 1);
    } catch (cause) {
      setError(`Não foi possível excluir o lançamento. ${String(cause)}`);
    }
  }

  async function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryDraft.trim();
    if (!name) return;
    if (categories.some((item) => item.kind === categoryKind
      && item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      setCategoryDialogError("Já existe uma categoria com esse nome para esse tipo de lançamento.");
      return;
    }

    setCategoryDialogError("");
    setCategoryDialogBusy(true);
    try {
      const newCategory = { name, kind: categoryKind };
      await createCategory(newCategory);
      setCategories((current) => [...current, newCategory].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setCategoryDraft("");
      if (kind === categoryKind && !categoriesForKind.some((item) => item.name === category)) {
        setCategory(name);
      }
    } catch (cause) {
      setCategoryDialogError(`Não foi possível adicionar a categoria. ${String(cause)}`);
    } finally {
      setCategoryDialogBusy(false);
    }
  }

  async function handleRemoveCategory(item: Category) {
    if (!window.confirm(
      `Remover a categoria "${item.name}"? Lançamentos antigos continuarão exibindo esse nome.`,
    )) return;

    setCategoryDialogError("");
    setCategoryDialogBusy(true);
    try {
      await removeCategory(item);
      const updatedCategories = categories.filter(
        (categoryItem) => categoryItem.kind !== item.kind || categoryItem.name !== item.name,
      );
      setCategories(updatedCategories);
      if (kind === item.kind && category === item.name) {
        setCategory(updatedCategories.find((categoryItem) => categoryItem.kind === kind)?.name ?? "");
      }
    } catch (cause) {
      setCategoryDialogError(`Não foi possível remover a categoria. ${String(cause)}`);
    } finally {
      setCategoryDialogBusy(false);
    }
  }

  function changeCategoryKind(nextKind: TransactionKind) {
    setCategoryKind(nextKind);
    setCategoryDraft("");
    const firstCategory = categories.find((item) => item.kind === nextKind);
    setEditingCategoryName(firstCategory?.name ?? "");
    setEditedCategoryName(firstCategory?.name ?? "");
  }

  function openCategoryDialog(dialog: "manage" | "edit") {
    setCategoryDialogError("");
    setCategoryDraft("");
    setCategoryKind("expense");
    const firstCategory = categories.find((item) => item.kind === "expense");
    setEditingCategoryName(firstCategory?.name ?? "");
    setEditedCategoryName(firstCategory?.name ?? "");
    setSettingsOpen(false);
    setCategorySubmenuOpen(false);
    setCategoryDialog(dialog);
  }

  async function handleEditCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = editedCategoryName.trim();
    if (!editableCategory || !name) return;
    if (name.toLocaleLowerCase("pt-BR") === editableCategory.name.toLocaleLowerCase("pt-BR")) {
      setCategoryDialogError("Informe um nome diferente para a categoria.");
      return;
    }

    setCategoryDialogError("");
    setCategoryDialogBusy(true);
    try {
      const previousName = editableCategory.name;
      const updatedCategory = { ...editableCategory, name };
      await renameCategory(editableCategory, name);
      setCategories((current) => current.map((item) => (
        item.kind === editableCategory.kind && item.name === previousName ? updatedCategory : item
      )).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      if (kind === updatedCategory.kind && category === previousName) setCategory(name);
      setEditingCategoryName(name);
      setEditedCategoryName(name);
      setCategoryDialog(null);
    } catch (cause) {
      setCategoryDialogError(`Não foi possível editar a categoria. ${String(cause)}`);
    } finally {
      setCategoryDialogBusy(false);
    }
  }

  function changeKind(nextKind: TransactionKind) {
    setKind(nextKind);
    setCategory(categories.find((item) => item.kind === nextKind)?.name ?? "");
  }

  async function toggleTheme() {
    const nextTheme: ThemePreference = theme === "light" ? "dark" : "light";
    setError("");
    try {
      await saveThemePreference(nextTheme);
      setTheme(nextTheme);
    } catch (cause) {
      setError(`Não foi possível salvar a preferência de tema. ${String(cause)}`);
    }
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <FinanceSidebar
        userEmail={userEmail}
        theme={theme}
        recurringView={recurringView}
        recurringMenuOpen={recurringMenuOpen}
        statementOpen={statementOpen}
        settingsOpen={settingsOpen}
        categorySubmenuOpen={categorySubmenuOpen}
        onSignOut={onSignOut}
        onShowOverview={() => {
          setRecurringView(null);
          setStatementOpen(false);
        }}
        onShowStatement={() => {
          setRecurringView(null);
          setStatementOpen(true);
        }}
        onToggleRecurringMenu={() => setRecurringMenuOpen((open) => !open)}
        onSelectRecurringView={(view) => {
          setStatementOpen(false);
          setRecurringView(view);
          setRecurringMenuOpen(false);
        }}
        onToggleSettings={() => {
          setSettingsOpen((open) => {
            if (open) setCategorySubmenuOpen(false);
            return !open;
          });
        }}
        onToggleCategorySubmenu={() => setCategorySubmenuOpen((open) => !open)}
        onToggleTheme={() => void toggleTheme()}
        onOpenCategoryDialog={openCategoryDialog}
        onOpenAbout={() => {
          setSettingsOpen(false);
          setCategorySubmenuOpen(false);
          setAboutOpen(true);
        }}
      />

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">Painel <span>/</span> <strong>{statementOpen ? "Extrato" : recurringView === "bill" ? "Contas fixas" : recurringView === "subscription" ? "Assinaturas" : "Resumo geral"}</strong></div>
          <div className="topbar-actions">
            {!statementOpen && (
              <label className="month-picker">
                <CalendarDays size={16} />
                <input aria-label={recurringView ? "Mês dos vencimentos" : "Mês dos lançamentos"} type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} />
                <ChevronDown size={14} className="month-chevron" />
              </label>
            )}
            {!recurringView && !statementOpen && (
              <button className="primary-button" onClick={() => setFormOpen((open) => !open)} type="button">
                <Plus size={17} /> Novo lançamento
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          {statementOpen ? (
            <ExpenseStatementPage
              categories={categories}
              syncVersion={financeRevision}
              onDelete={(id, description) => void handleDelete(id, description)}
            />
          ) : recurringView ? (
            <RecurringPaymentsPage
              itemType={recurringView}
              month={month}
              categories={categories}
              syncVersion={financeRevision}
              onPaymentComplete={() => void refresh()}
            />
          ) : (
            <>
          <section className="welcome-row">
            <div>
              <p className="eyebrow">SEU RESUMO FINANCEIRO</p>
              <h1>Visão geral</h1>
              <p className="subtitle">Acompanhe de perto a saúde das suas finanças.</p>
            </div>
            <span className="period-label">{formatMonth(month)}</span>
          </section>

          {(error || authError) && <div className="error-banner" role="alert">{error || authError}</div>}

          {formOpen && (
            <NewTransactionForm
              kind={kind}
              description={description}
              amount={amount}
              category={category}
              date={date}
              categories={categoriesForKind}
              saving={saving}
              onCancel={() => setFormOpen(false)}
              onSubmit={(event) => void handleSubmit(event)}
              onKindChange={changeKind}
              onDescriptionChange={setDescription}
              onAmountChange={setAmount}
              onCategoryChange={setCategory}
              onDateChange={setDate}
            />
          )}

          <MonthlyOverview
            monthLabel={formatMonth(month)}
            transactions={transactions}
            income={totals.income}
            expenses={totals.expense}
            expensesByCategory={expensesByCategory}
          />

          <TransactionTable
            monthLabel={formatMonth(month)}
            transactions={filteredTransactions}
            loading={loading}
            search={search}
            kindFilter={kindFilter}
            onSearchChange={setSearch}
            onKindFilterChange={setKindFilter}
            onDelete={(id, description) => void handleDelete(id, description)}
          />
          <footer className="page-footer">Finanças pessoais <span>•</span> Sincronizado com segurança</footer>
            </>
          )}
        </div>
      </main>
      {categoryDialog && (
        <CategoryDialog
          dialog={categoryDialog}
          busy={categoryDialogBusy}
          error={categoryDialogError}
          kind={categoryKind}
          categories={settingsCategories}
          hasEditableCategory={Boolean(editableCategory)}
          draft={categoryDraft}
          editingCategoryName={editingCategoryName}
          editedCategoryName={editedCategoryName}
          onClose={() => setCategoryDialog(null)}
          onChangeKind={changeCategoryKind}
          onDraftChange={setCategoryDraft}
          onEditingCategoryChange={setEditingCategoryName}
          onEditedCategoryNameChange={setEditedCategoryName}
          onClearError={() => setCategoryDialogError("")}
          onAddCategory={(event) => void handleAddCategory(event)}
          onEditCategory={(event) => void handleEditCategory(event)}
          onRemoveCategory={(item) => void handleRemoveCategory(item)}
        />
      )}
      {aboutOpen && (
        <AboutDialog
          error={aboutLinkError}
          onClose={() => setAboutOpen(false)}
          onOpenCreatorLink={(url) => void openCreatorLink(url)}
        />
      )}
    </div>
  );
}
