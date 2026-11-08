import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesCombined,
  CircleCheck,
  Cloud,
  Fingerprint,
  Tags,
  Wallet,
} from "lucide-react";

export function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="consumy, início">
          <img src="/consumy-horizontal.png" alt="consumy" />
        </a>
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#privacidade">Privacidade</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="landing-header-actions">
          <a className="landing-login-link" href="/app">Entrar</a>
          <a className="landing-button landing-button-small" href="/app?signup=1">Criar conta</a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><span /> FINANÇAS MAIS CLARAS, NO SEU RITMO</span>
          <h1>Seu dinheiro,<br />mais <span>bem cuidado.</span></h1>
          <p>
            Organize entradas e despesas em um só lugar. Acompanhe seu mês com
            clareza e mantenha seus dispositivos em sintonia.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-button" href="/app?signup=1">
              Começar agora <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="landing-secondary-link" href="#recursos">
              Conhecer o consumy <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="landing-trust-note">
            <CircleCheck size={16} aria-hidden="true" />
            Seus dados ficam associados à sua conta e sincronizados entre dispositivos.
          </div>
        </div>

        <div className="landing-preview-wrap" role="img" aria-label="Prévia ilustrativa do painel do consumy">
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="landing-preview">
            <div className="preview-topbar">
              <img src="/consumy-mark.png" alt="" />
              <div><strong>Visão geral</strong><small>Seu resumo financeiro</small></div>
              <span className="preview-month">Este mês⌄</span>
            </div>
            <div className="preview-greeting">
              <span>SEU RESUMO</span>
              <strong>Olá! Veja como está seu mês.</strong>
            </div>
            <div className="preview-metrics">
              <div className="preview-metric preview-balance">
                <span>Saldo do mês</span><strong>R$ 3.240,00</strong>
                <small><i /> Visão geral das movimentações</small>
              </div>
              <div className="preview-metric">
                <span>Entradas</span><strong>R$ 5.800,00</strong><small>Receitas registradas</small>
              </div>
              <div className="preview-metric">
                <span>Despesas</span><strong>R$ 2.560,00</strong><small>Gastos registrados</small>
              </div>
            </div>
            <div className="preview-chart">
              <div className="preview-chart-heading"><strong>Despesas por categoria</strong><span>Este mês</span></div>
              <div className="preview-chart-content">
                <div className="preview-donut"><span>Gastos<br />do mês</span></div>
                <div className="preview-legend">
                  <span><i className="legend-home" />Moradia <b>42%</b></span>
                  <span><i className="legend-food" />Alimentação <b>28%</b></span>
                  <span><i className="legend-other" />Outros <b>30%</b></span>
                </div>
              </div>
            </div>
            <div className="preview-bottom">
              <span><i /> Atualizado entre seus dispositivos</span>
              <Cloud size={15} aria-hidden="true" />
            </div>
          </div>
          <div className="preview-float-card">
            <span className="preview-float-icon"><ChartNoAxesCombined size={17} /></span>
            <span><strong>Mais clareza</strong><small>um mês de cada vez</small></span>
          </div>
        </div>
      </section>

      <section className="landing-benefits" aria-label="Destaques">
        <div><strong>01</strong><span>Organização simples<br />para sua rotina</span></div>
        <div><strong>02</strong><span>Informações atualizadas<br />em tempo real</span></div>
        <div><strong>03</strong><span>Privacidade com acesso<br />por conta</span></div>
      </section>

      <section className="landing-features" id="recursos">
        <div className="landing-section-heading">
          <span className="landing-kicker">FEITO PARA A VIDA REAL</span>
          <h2>O essencial para cuidar<br />melhor do seu dinheiro.</h2>
          <p>Sem complicar: acompanhe suas movimentações e entenda para onde seu dinheiro está indo.</p>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <span className="landing-feature-icon"><Wallet size={21} /></span>
            <h3>Entradas e despesas</h3>
            <p>Registre suas movimentações e consulte o saldo do mês em uma visão direta.</p>
          </article>
          <article className="landing-feature-card">
            <span className="landing-feature-icon"><Tags size={21} /></span>
            <h3>Do seu jeito</h3>
            <p>Organize os lançamentos por categorias que fazem sentido para sua rotina.</p>
          </article>
          <article className="landing-feature-card">
            <span className="landing-feature-icon"><Cloud size={21} /></span>
            <h3>Em sintonia</h3>
            <p>Acesse os mesmos dados no computador e em outros dispositivos conectados.</p>
          </article>
        </div>
      </section>

      <section className="landing-privacy" id="privacidade">
        <div className="landing-privacy-icon"><Fingerprint size={27} /></div>
        <div>
          <span className="landing-kicker">SEUS DADOS, SUA CONTA</span>
          <h2>Privacidade faz parte do cuidado.</h2>
          <p>O acesso aos seus dados exige autenticação. As políticas do banco restringem cada conta às próprias informações.</p>
        </div>
        <a className="landing-secondary-link" href="/app">
          Acessar com segurança <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>

      <section className="landing-cta" id="sobre">
        <img src="/consumy-mark.png" alt="" />
        <div>
          <span className="landing-kicker">CONHEÇA O CONSUMY</span>
          <h2>Um passo de cada vez. Um mês mais claro.</h2>
          <p>Entre para acompanhar suas finanças onde estiver.</p>
        </div>
        <a className="landing-button" href="/app">Entrar no consumy <ArrowRight size={17} /></a>
      </section>

      <footer className="landing-footer">
        <a className="landing-footer-brand" href="/" aria-label="consumy, início">
          <img src="/consumy-horizontal.png" alt="consumy" />
        </a>
        <span>© {new Date().getFullYear()} consumy · Suas finanças, com mais clareza.</span>
        <a href="#recursos">Voltar ao início ↑</a>
      </footer>
    </main>
  );
}
