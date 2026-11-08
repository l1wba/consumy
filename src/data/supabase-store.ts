import type { RealtimeChannel } from "@supabase/supabase-js";
import type { FinanceStore } from "./finance-store";
import {
  DEFAULT_CATEGORIES,
  type Category,
  type NewTransaction,
  NewRecurringItem,
  RecurringItem,
  RecurringPayment,
  type ThemePreference,
  type Transaction,
  type TransactionId,
} from "./types";
import { getSupabaseClient } from "../supabase/client";

interface StoredTransaction extends Omit<Transaction, "id"> {
  id: string;
}

export class SupabaseFinanceStore implements FinanceStore {
  private readonly client = getSupabaseClient();

  private async getUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Entre na sua conta para acessar os dados financeiros.");
    return data.user.id;
  }

  async listCategories(): Promise<Category[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from("categories")
      .select("name, kind")
      .order("kind")
      .order("name");
    if (error) throw error;
    if (data.length > 0) return data as Category[];

    const defaults = DEFAULT_CATEGORIES.map((category) => ({ ...category, user_id: userId }));
    const { error: insertError } = await this.client
      .from("categories")
      .upsert(defaults, { onConflict: "user_id,kind,name", ignoreDuplicates: true });
    if (insertError) throw insertError;

    const { data: seededCategories, error: listError } = await this.client
      .from("categories")
      .select("name, kind")
      .order("kind")
      .order("name");
    if (listError) throw listError;
    return seededCategories as Category[];
  }

  async createCategory(category: Category): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from("categories")
      .insert({ ...category, user_id: userId });
    if (error) throw error;
  }

  async removeCategory(category: Category): Promise<void> {
    const { count, error: countError } = await this.client
      .from("categories")
      .select("name", { count: "exact", head: true })
      .eq("kind", category.kind);
    if (countError) throw countError;
    if ((count ?? 0) <= 1) {
      throw new Error("Mantenha ao menos uma categoria para esse tipo de lançamento.");
    }

    const { error } = await this.client
      .from("categories")
      .delete()
      .eq("name", category.name)
      .eq("kind", category.kind);
    if (error) throw error;
  }

  async renameCategory(category: Category, newName: string): Promise<void> {
    const { data: existing, error: lookupError } = await this.client
      .from("categories")
      .select("name")
      .eq("kind", category.kind)
      .ilike("name", newName)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && existing.name !== category.name) {
      throw new Error("Já existe uma categoria com esse nome para esse tipo de lançamento.");
    }

    const { error } = await this.client
      .from("categories")
      .update({ name: newName })
      .eq("name", category.name)
      .eq("kind", category.kind);
    if (error) throw error;
  }

  async getThemePreference(): Promise<ThemePreference | null> {
    const { data, error } = await this.client
      .from("user_settings")
      .select("value")
      .eq("key", "theme")
      .maybeSingle();
    if (error) throw error;
    return data?.value === "light" || data?.value === "dark" ? data.value : null;
  }

  async saveThemePreference(theme: ThemePreference): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from("user_settings")
      .upsert({ user_id: userId, key: "theme", value: theme }, { onConflict: "user_id,key" });
    if (error) throw error;
  }

  async listTransactions(month: string): Promise<Transaction[]> {
    const [year, monthNumber] = month.split("-").map(Number);
    const nextMonth = new Date(year, monthNumber, 1);
    const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const { data, error } = await this.client
      .from("transactions")
      .select("id, description, amount, kind, category, date")
      .gte("date", `${month}-01`)
      .lt("date", endDate)
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    return data as StoredTransaction[];
  }

  async createTransaction(transaction: NewTransaction): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from("transactions")
      .insert({ ...transaction, user_id: userId });
    if (error) throw error;
  }

  async removeTransaction(id: TransactionId): Promise<void> {
    const { error } = await this.client
      .from("transactions")
      .delete()
      .eq("id", String(id));
    if (error) throw error;
  }

  async listRecurringItems(): Promise<RecurringItem[]> {
    const { data, error } = await this.client
      .from("recurring_items")
      .select("id, name, amount, category, item_type, frequency, due_day, due_month, start_date, end_date, cancelled_at")
      .order("name");
    if (error) throw error;
    return data as RecurringItem[];
  }

  async createRecurringItem(item: NewRecurringItem): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from("recurring_items")
      .insert({ ...item, user_id: userId });
    if (error) throw error;
  }

  async cancelRecurringItem(id: string): Promise<void> {
    const now = new Date();
    const cancelledAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { error } = await this.client
      .from("recurring_items")
      .update({ cancelled_at: cancelledAt })
      .eq("id", id)
      .is("cancelled_at", null);
    if (error) throw error;
  }

  async listRecurringPayments(month: string): Promise<RecurringPayment[]> {
    const [year, monthNumber] = month.split("-").map(Number);
    const nextMonth = new Date(year, monthNumber, 1);
    const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const { data, error } = await this.client
      .from("recurring_payments")
      .select("recurring_item_id, due_date, transaction_id, paid_at")
      .lt("due_date", endDate);
    if (error) throw error;
    return data as RecurringPayment[];
  }

  async markRecurringItemPaid(id: string, dueDate: string, paidDate: string): Promise<void> {
    const { error } = await this.client.rpc("mark_recurring_item_paid", {
      p_item_id: id,
      p_due_date: dueDate,
      p_paid_date: paidDate,
    });
    if (error) throw error;
  }

  subscribeToChanges(onChange: () => void, onError: (error: Error) => void): () => void {
    let channel: RealtimeChannel = this.client.channel("finance-changes");
    for (const table of ["categories", "transactions", "user_settings", "recurring_items", "recurring_payments"] as const) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        onChange,
      );
    }
    channel.subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError(error instanceof Error ? error : new Error(`Realtime subscription ${status.toLowerCase()}.`));
      }
    });
    return () => {
      void channel.unsubscribe();
    };
  }
}
