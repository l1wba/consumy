import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "./AuthScreen";
import { FinanceWorkspace } from "../app/FinanceWorkspace";
import { getSupabaseClient, isSupabaseConfigured } from "../../supabase/client";

export function AuthenticatedApp() {
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
    <FinanceWorkspace
      userEmail={session.user.email ?? "Conta"}
      authError={authError}
      onSignOut={() => void signOut()}
    />
  );
}
