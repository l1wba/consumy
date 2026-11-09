import { isTauri } from "@tauri-apps/api/core";
import { AuthenticatedApp } from "./components/auth/AuthenticatedApp";
import { DevelopmentNotice } from "./components/landing/DevelopmentNotice";
import { LandingPage } from "./components/landing/LandingPage";

export default function App() {
  if (!isTauri()) {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (import.meta.env.DEV) {
      if (path === "/app") return <AuthenticatedApp />;
      if (path === "/landing") return <LandingPage />;
      return <DevelopmentNotice />;
    }
    if (path === "/") return <DevelopmentNotice />;
    return <UnavailablePage />;
  }
  return <AuthenticatedApp />;
}

function UnavailablePage() {
  return (
    <main className="unavailable-page">
      <img src="/consumy-mark.png" alt="" />
      <h1>Esta página não está disponível.</h1>
    </main>
  );
}
