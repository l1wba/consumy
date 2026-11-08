import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Info,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Pencil,
  Settings,
  Sun,
  Tags,
  Wallet,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AboutDialog } from "./components/dialogs/AboutDialog";
import { CategoryDialog } from "./components/dialogs/CategoryDialog";
import { MonthlyOverview } from "./components/dashboard/MonthlyOverview";
import { NewTransactionForm } from "./components/transactions/NewTransactionForm";
import { TransactionTable } from "./components/transactions/TransactionTable";
import { AuthScreen } from "./components/auth/AuthScreen";
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
} from "./db";
import { formatMonth } from "./utils/format";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import type { Session } from "@supabase/supabase-js";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    const client = getSupabaseClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setAuthError("");
        setAuthLoading(false);
      }
    });

    void client.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (active) {
          setSession(data.session);
          setAuthLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setAuthError(cause instanceof Error ? cause.message : String(cause));
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  if (authLoading) {
    return <main className="auth-page"><p role="status">Conectando à sua conta...</p></main>;
  }
  if (!session) {
    return (
      <>
        {authError && <p className="auth-global-error" role="alert">{authError}</p>}
        <AuthScreen />
      </>
    );
  }
  return (
    <FinanceApp
      userEmail={session.user.email ?? "Conta"}
      authError={authError}
      onSignOut={() => void signOut()}
    />
  );
}

function FinanceApp({
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
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="consumy, início">
          <picture className="brand-image">
            <source media="(max-width: 900px)" srcSet="/consumy-mark.png" />
            <img src="/consumy-horizontal.png" alt="" />
          </picture>
        </a>
        <div className="workspace-label">ESPAÇO PESSOAL</div>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className="nav-item active" href="#dashboard"><LayoutDashboard size={18} /> Visão geral</a>
          <a className="nav-item" href="#transacoes"><Wallet size={18} /> Lançamentos</a>
          <a className="nav-item" href="#categorias"><ChartNoAxesCombined size={18} /> Categorias</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="local-note-icon"><CircleHelp size={17} /></span>
            <div><strong>Seus dados sincronizados</strong><p>Privados para sua conta.</p></div>
          </div>
          <section className={`settings-menu${settingsOpen ? " open" : ""}`}>
            <button
              className="settings-trigger"
              type="button"
              aria-expanded={settingsOpen}
              aria-controls="settings-options"
              onClick={() => {
                setSettingsOpen((open) => {
                  if (open) setCategorySubmenuOpen(false);
                  return !open;
                });
              }}
            >
              <Settings size={17} />
              <span>Configurações</span>
              <ChevronDown size={15} className="settings-chevron" />
            </button>
            <div className={`settings-collapse${settingsOpen ? " open" : ""}`} id="settings-options" aria-hidden={!settingsOpen}>
              <div className="settings-options">
                <div className="theme-setting">
                  <div className="theme-setting-copy">
                    <span className="theme-current-icon" aria-hidden="true">
                      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                    </span>
                    <span className="theme-setting-label">
                      <strong>{theme === "dark" ? "Modo escuro" : "Modo claro"}</strong>
                      <small>Tema atual</small>
                    </span>
                  </div>
                  <button
                    className="theme-switch"
                    type="button"
                    role="switch"
                    aria-checked={theme === "dark"}
                    aria-label="Modo escuro"
                    tabIndex={settingsOpen ? 0 : -1}
                    onClick={() => void toggleTheme()}
                  >
                    <span className="theme-switch-thumb">
                      {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                    </span>
                  </button>
                </div>
                <button
                  className="category-folder-trigger"
                  type="button"
                  aria-expanded={categorySubmenuOpen}
                  aria-controls="category-submenu"
                  tabIndex={settingsOpen ? 0 : -1}
                  onClick={() => setCategorySubmenuOpen((open) => !open)}
                >
                  <Tags size={16} />
                  <span>Categorias</span>
                  <ChevronDown size={14} className="category-folder-chevron" />
                </button>
                <div
                  className={`category-submenu-collapse${categorySubmenuOpen ? " open" : ""}`}
                  id="category-submenu"
                  aria-hidden={!categorySubmenuOpen}
                >
                  <div className="category-submenu">
                    <button className="category-submenu-item" type="button" tabIndex={categorySubmenuOpen ? 0 : -1} onClick={() => openCategoryDialog("manage")}>
                      <svg className="category-manage-icons" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 3.5v6M2 6.5h6M5 20.5 20.5 5M15.5 19h6" />
                      </svg>
                      <span>Adicionar/remover categorias</span>
                      <ChevronDown size={13} className="submenu-item-chevron" />
                    </button>
                    <button className="category-submenu-item" type="button" tabIndex={categorySubmenuOpen ? 0 : -1} onClick={() => openCategoryDialog("edit")}>
                      <Pencil size={15} />
                      <span>Editar categorias</span>
                      <ChevronDown size={13} className="submenu-item-chevron" />
                    </button>
                  </div>
                </div>
                <button
                  className="category-folder-trigger about-trigger"
                  type="button"
                  tabIndex={settingsOpen ? 0 : -1}
                  onClick={() => {
                    setSettingsOpen(false);
                    setCategorySubmenuOpen(false);
                    setAboutOpen(true);
                  }}
                >
                  <Info size={16} />
                  <span>Sobre</span>
                </button>
              </div>
            </div>
          </section>
          <button className="profile-button" type="button" aria-label={`Sair da conta ${userEmail}`} onClick={onSignOut}>
            <span className="avatar">{userEmail.slice(0, 1).toLocaleUpperCase("pt-BR")}</span>
            <span className="profile-copy"><strong>{userEmail}</strong><small>Sair da conta</small></span>
            <LogOut size={17} className="profile-settings" />
          </button>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">Painel <span>/</span> <strong>Visão geral</strong></div>
          <div className="topbar-actions">
            <label className="month-picker">
              <CalendarDays size={16} />
              <input aria-label="Mês dos lançamentos" type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} />
              <ChevronDown size={14} className="month-chevron" />
            </label>
            <button className="primary-button" onClick={() => setFormOpen((open) => !open)} type="button">
              <Plus size={17} /> Novo lançamento
            </button>
          </div>
        </header>

        <div className="page-content">
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
