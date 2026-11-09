import {
  CalendarClock,
  ChevronDown,
  Info,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  ReceiptText,
  Settings,
  Sun,
  Tags,
} from "lucide-react";
import type { RecurringItemType, ThemePreference } from "../../db";

interface FinanceSidebarProps {
  userEmail: string;
  theme: ThemePreference;
  recurringView: RecurringItemType | null;
  recurringMenuOpen: boolean;
  statementOpen: boolean;
  settingsOpen: boolean;
  categorySubmenuOpen: boolean;
  onSignOut: () => void;
  onShowOverview: () => void;
  onShowStatement: () => void;
  onToggleRecurringMenu: () => void;
  onSelectRecurringView: (view: RecurringItemType) => void;
  onToggleSettings: () => void;
  onToggleCategorySubmenu: () => void;
  onToggleTheme: () => void;
  onOpenCategoryDialog: (dialog: "manage" | "edit") => void;
  onOpenAbout: () => void;
}

export function FinanceSidebar({
  userEmail,
  theme,
  recurringView,
  recurringMenuOpen,
  statementOpen,
  settingsOpen,
  categorySubmenuOpen,
  onSignOut,
  onShowOverview,
  onShowStatement,
  onToggleRecurringMenu,
  onSelectRecurringView,
  onToggleSettings,
  onToggleCategorySubmenu,
  onToggleTheme,
  onOpenCategoryDialog,
  onOpenAbout,
}: FinanceSidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="consumy, início">
        <picture className="brand-image">
          <source media="(max-width: 900px)" srcSet="/consumy-mark.png" />
          <img src="/consumy-horizontal.png" alt="" />
        </picture>
      </a>
      <div className="workspace-label">ESPAÇO PESSOAL</div>
      <nav className="main-nav" aria-label="Navegação principal">
        <a className={`nav-item${recurringView === null && !statementOpen ? " active" : ""}`} href="#dashboard" aria-label="Resumo geral" onClick={onShowOverview}>
          <LayoutDashboard size={18} /> Resumo geral
        </a>
        <div className={`recurring-nav-group${recurringMenuOpen ? " open" : ""}`}>
          <button
            className={`nav-item recurring-nav-trigger${recurringView ? " active" : ""}`}
            type="button"
            aria-expanded={recurringMenuOpen}
            aria-controls="recurring-nav-submenu"
            onClick={onToggleRecurringMenu}
          >
            <CalendarClock size={18} />
            <span>Contas a pagar</span>
            <ChevronDown size={14} className="recurring-nav-chevron" />
          </button>
          <div className="recurring-nav-submenu" id="recurring-nav-submenu" aria-hidden={!recurringMenuOpen}>
            <button className={recurringView === "bill" ? "selected" : ""} type="button" tabIndex={recurringMenuOpen ? 0 : -1} onClick={() => onSelectRecurringView("bill")}>Contas fixas</button>
            <button className={recurringView === "subscription" ? "selected" : ""} type="button" tabIndex={recurringMenuOpen ? 0 : -1} onClick={() => onSelectRecurringView("subscription")}>Assinaturas</button>
          </div>
        </div>
        <button className={`nav-item statement-nav-item${statementOpen ? " active" : ""}`} type="button" onClick={onShowStatement}>
          <ReceiptText size={18} /> Extrato
        </button>
      </nav>
      <div className="sidebar-bottom">
        <section className={`settings-menu${settingsOpen ? " open" : ""}`}>
          <button
            className="settings-trigger"
            type="button"
            aria-expanded={settingsOpen}
            aria-controls="settings-options"
            onClick={onToggleSettings}
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
                  onClick={onToggleTheme}
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
                onClick={onToggleCategorySubmenu}
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
                  <button className="category-submenu-item" type="button" tabIndex={categorySubmenuOpen ? 0 : -1} onClick={() => onOpenCategoryDialog("manage")}>
                    <svg className="category-manage-icons" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 3.5v6M2 6.5h6M5 20.5 20.5 5M15.5 19h6" />
                    </svg>
                    <span>Adicionar/remover categorias</span>
                  </button>
                  <button className="category-submenu-item" type="button" tabIndex={categorySubmenuOpen ? 0 : -1} onClick={() => onOpenCategoryDialog("edit")}>
                    <Pencil size={15} />
                    <span>Editar categorias</span>
                  </button>
                </div>
              </div>
              <button className="category-folder-trigger about-trigger" type="button" tabIndex={settingsOpen ? 0 : -1} onClick={onOpenAbout}>
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
  );
}
