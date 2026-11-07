import type { FormEventHandler } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category, TransactionKind } from "../../data/types";

interface CategoryDialogProps {
  dialog: "manage" | "edit";
  busy: boolean;
  error: string;
  kind: TransactionKind;
  categories: Category[];
  hasEditableCategory: boolean;
  draft: string;
  editingCategoryName: string;
  editedCategoryName: string;
  onClose: () => void;
  onChangeKind: (kind: TransactionKind) => void;
  onDraftChange: (draft: string) => void;
  onEditingCategoryChange: (name: string) => void;
  onEditedCategoryNameChange: (name: string) => void;
  onClearError: () => void;
  onAddCategory: FormEventHandler<HTMLFormElement>;
  onEditCategory: FormEventHandler<HTMLFormElement>;
  onRemoveCategory: (category: Category) => void;
}

export function CategoryDialog({
  dialog,
  busy,
  error,
  kind,
  categories,
  hasEditableCategory,
  draft,
  editingCategoryName,
  editedCategoryName,
  onClose,
  onChangeKind,
  onDraftChange,
  onEditingCategoryChange,
  onEditedCategoryNameChange,
  onClearError,
  onAddCategory,
  onEditCategory,
  onRemoveCategory,
}: CategoryDialogProps) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="category-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-dialog-title"
      >
        <header className="category-dialog-header">
          <div>
            <p className="dialog-eyebrow">CONFIGURAÇÕES / CATEGORIAS</p>
            <h2 id="category-dialog-title">
              {dialog === "manage" ? "Adicionar/remover categorias" : "Editar categoria"}
            </h2>
            <p>{dialog === "manage"
              ? "Organize as categorias disponíveis nos lançamentos."
              : "Renomeie uma categoria usada nos próximos lançamentos."}</p>
          </div>
          <button className="dialog-close" type="button" aria-label="Fechar janela" disabled={busy} onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className="category-dialog-body">
          {error && <div className="dialog-error" role="alert">{error}</div>}
          <div className="category-dialog-type-switch" role="group" aria-label="Tipo de categoria">
            <button
              type="button"
              className={kind === "expense" ? "selected expense-choice" : ""}
              aria-pressed={kind === "expense"}
              disabled={busy}
              onClick={() => onChangeKind("expense")}
            >Despesas</button>
            <button
              type="button"
              className={kind === "income" ? "selected income-choice" : ""}
              aria-pressed={kind === "income"}
              disabled={busy}
              onClick={() => onChangeKind("income")}
            >Entradas</button>
          </div>
          {dialog === "manage" ? (
            <>
              <form className="dialog-add-form" onSubmit={onAddCategory}>
                <label className="dialog-field">
                  <span>Nova categoria de {kind === "expense" ? "despesa" : "entrada"}</span>
                  <input
                    autoFocus
                    aria-label="Nome da nova categoria"
                    maxLength={40}
                    placeholder="Ex.: Assinaturas"
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                  />
                </label>
                <button className="dialog-primary-button" type="submit" disabled={busy || !draft.trim()}>
                  <Plus size={16} /> Adicionar
                </button>
              </form>
              <div className="dialog-list-heading">
                <h3>Categorias de {kind === "expense" ? "despesa" : "entrada"}</h3>
                <span>{categories.length}</span>
              </div>
              <ul className="dialog-category-list">
                {categories.map((item) => (
                  <li key={`${item.kind}-${item.name}`}>
                    <span className={`dialog-category-dot ${item.kind}`} />
                    <span className="dialog-category-name">{item.name}</span>
                    <button
                      className="dialog-icon-button danger"
                      type="button"
                      aria-label={`Remover categoria ${item.name}`}
                      title={categories.length === 1 ? "Mantenha ao menos uma categoria" : "Remover categoria"}
                      disabled={busy || categories.length === 1}
                      onClick={() => onRemoveCategory(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="dialog-note">Lançamentos antigos continuam exibindo a categoria original.</p>
            </>
          ) : (
            <form className="dialog-edit-form" onSubmit={onEditCategory}>
              <label className="dialog-field">
                <span>Categoria</span>
                <select
                  value={editingCategoryName}
                  disabled={busy}
                  onChange={(event) => {
                    onEditingCategoryChange(event.target.value);
                    onEditedCategoryNameChange(event.target.value);
                    onClearError();
                  }}
                >
                  {categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="dialog-field">
                <span>Novo nome</span>
                <input
                  autoFocus
                  maxLength={40}
                  placeholder="Digite o novo nome"
                  disabled={busy}
                  value={editedCategoryName}
                  onChange={(event) => onEditedCategoryNameChange(event.target.value)}
                />
              </label>
              <p className="dialog-note">A alteração vale para novos lançamentos; registros antigos preservam o nome usado na época.</p>
              <footer className="category-dialog-footer">
                <button className="dialog-secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
                <button className="dialog-primary-button" type="submit" disabled={busy || !hasEditableCategory || !editedCategoryName.trim()}>
                  <Pencil size={15} /> {busy ? "Salvando..." : "Salvar alterações"}
                </button>
              </footer>
            </form>
          )}
        </div>
        {dialog === "manage" && (
          <footer className="category-dialog-footer">
            <button className="dialog-secondary-button" type="button" disabled={busy} onClick={onClose}>Fechar</button>
          </footer>
        )}
      </section>
    </div>
  );
}
