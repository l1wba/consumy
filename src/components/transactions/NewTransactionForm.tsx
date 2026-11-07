import type { FormEventHandler } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Category, TransactionKind } from "../../data/types";

interface NewTransactionFormProps {
  kind: TransactionKind;
  description: string;
  amount: string;
  category: string;
  date: string;
  categories: Category[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onKindChange: (kind: TransactionKind) => void;
  onDescriptionChange: (description: string) => void;
  onAmountChange: (amount: string) => void;
  onCategoryChange: (category: string) => void;
  onDateChange: (date: string) => void;
}

export function NewTransactionForm({
  kind,
  description,
  amount,
  category,
  date,
  categories,
  saving,
  onCancel,
  onSubmit,
  onKindChange,
  onDescriptionChange,
  onAmountChange,
  onCategoryChange,
  onDateChange,
}: NewTransactionFormProps) {
  return (
    <section className="form-card" aria-labelledby="form-title">
      <div className="form-heading">
        <div><p className="eyebrow">NOVO REGISTRO</p><h2 id="form-title">Adicionar lançamento</h2></div>
        <button className="text-button" type="button" onClick={onCancel}>Cancelar</button>
      </div>
      <form className="transaction-form" onSubmit={onSubmit}>
        <div className="kind-switch" role="group" aria-label="Tipo de lançamento">
          <button className={kind === "expense" ? "selected expense-choice" : ""} type="button" aria-pressed={kind === "expense"} onClick={() => onKindChange("expense")}><ArrowUpRight size={16} /> Despesa</button>
          <button className={kind === "income" ? "selected income-choice" : ""} type="button" aria-pressed={kind === "income"} onClick={() => onKindChange("income")}><ArrowDownLeft size={16} /> Entrada</button>
        </div>
        <label className="field"><span>Descrição</span><input autoFocus required maxLength={100} placeholder="Ex.: Conta de luz" value={description} onChange={(event) => onDescriptionChange(event.target.value)} /></label>
        <label className="field"><span>Valor (R$)</span><input required inputMode="decimal" placeholder="0,00" value={amount} onChange={(event) => onAmountChange(event.target.value)} /></label>
        <label className="field"><span>Categoria</span><select required value={category} onChange={(event) => onCategoryChange(event.target.value)}>{categories.length ? categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>) : <option value="">Adicione uma categoria em Configurações</option>}</select></label>
        <label className="field"><span>Data</span><input required type="date" value={date} onChange={(event) => onDateChange(event.target.value)} /></label>
        <div className="form-submit"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar lançamento"}</button></div>
      </form>
    </section>
  );
}
