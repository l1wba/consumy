import { Sparkles } from "lucide-react";

export function DevelopmentNotice() {
  return (
    <main className="development-page">
      <header className="development-header">
        <img className="development-wordmark" src="/consumy-horizontal.png" alt="consumy" />
        <span className="development-status"><i /> Em desenvolvimento</span>
      </header>

      <section className="development-content" aria-labelledby="development-title">
        <div className="development-copy">
          <span className="development-eyebrow"><Sparkles size={14} aria-hidden="true" /> UM NOVO JEITO DE CUIDAR DAS FINANÇAS</span>
          <h1 id="development-title">Estamos preparando algo <span>para você.</span></h1>
          <p>
            O consumy está em desenvolvimento para ajudar a organizar entradas e
            despesas e acompanhar suas finanças com mais clareza.
          </p>
          <p className="development-availability">
            O acesso será disponibilizado futuramente, quando o produto estiver
            em um estágio mais avançado.
          </p>
        </div>

        <div className="development-art" aria-hidden="true">
          <div className="development-ring development-ring-outer" />
          <div className="development-ring development-ring-inner" />
          <div className="development-mark-wrap">
            <img src="/consumy-mark.png" alt="" />
          </div>
          <span className="development-art-dot development-art-dot-one" />
          <span className="development-art-dot development-art-dot-two" />
          <span className="development-art-cross">+</span>
        </div>
      </section>

      <footer className="development-footer">
        <span>consumy</span>
        <span>Suas finanças, com mais clareza.</span>
      </footer>
    </main>
  );
}
