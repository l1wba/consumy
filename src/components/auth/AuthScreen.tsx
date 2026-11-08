import { useState, type FormEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getSupabaseClient, isSupabaseConfigured } from "../../supabase/client";

type AuthMode = "sign-in" | "sign-up";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const client = getSupabaseClient();
      if (mode === "sign-in") {
        const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: isTauri() ? undefined : { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Confira seu e-mail para confirmar a conta e depois entre no consumy.");
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="eyebrow">CONTA E SINCRONIZAÇÃO</p>
          <h1 id="auth-title">Configure o Supabase</h1>
          <p className="auth-description">Adicione a URL do projeto e a chave publicável ao arquivo local `.env.local` e reinicie o aplicativo.</p>
          <div className="error-banner" role="alert">
            Variáveis necessárias: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">CONTA E SINCRONIZAÇÃO</p>
        <h1 id="auth-title">{mode === "sign-in" ? "Entrar no consumy" : "Criar sua conta"}</h1>
        <p className="auth-description">Acesse seus lançamentos e mantenha seus dispositivos sincronizados.</p>
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>E-mail</span>
            <input
              autoComplete="email"
              autoFocus
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <div className="error-banner" role="alert">{error}</div>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Aguarde..." : mode === "sign-in" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button
          className="text-button auth-mode-toggle"
          type="button"
          onClick={() => {
            setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
            setError("");
            setNotice("");
          }}
        >
          {mode === "sign-in" ? "Ainda não tem uma conta? Criar conta" : "Já tem uma conta? Entrar"}
        </button>
      </section>
    </main>
  );
}
