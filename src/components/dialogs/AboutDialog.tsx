import { ChartNoAxesCombined, Github, Linkedin, X } from "lucide-react";

declare const __APP_VERSION__: string;

interface AboutDialogProps {
  error: string;
  onClose: () => void;
  onOpenCreatorLink: (url: string) => void;
}

export function AboutDialog({ error, onClose, onOpenCreatorLink }: AboutDialogProps) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="category-dialog about-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
      >
        <header className="category-dialog-header">
          <div>
            <p className="dialog-eyebrow">INFORMAÇÕES DO APLICATIVO</p>
            <h2 id="about-dialog-title">Sobre o consumy</h2>
            <p>Controle financeiro pessoal, simples e sincronizado.</p>
          </div>
          <button className="dialog-close" type="button" aria-label="Fechar janela" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className="category-dialog-body about-dialog-body">
          <div className="about-app-mark"><ChartNoAxesCombined size={22} /></div>
          <div className="about-app-details">
            <strong>consumy</strong>
            <span>Versão {__APP_VERSION__}</span>
            <p>Organize entradas, despesas e categorias, com seus dados sincronizados entre dispositivos.</p>
          </div>
          <div className="about-creator">
            <span className="about-section-label">CRIADO POR</span>
            <strong>Luciano Rocha</strong>
            <div className="about-links">
              <button type="button" onClick={() => onOpenCreatorLink("https://github.com/l1wba")}>
                <Github size={16} /> GitHub
              </button>
              <button type="button" onClick={() => onOpenCreatorLink("https://www.linkedin.com/in/luciano-rocha31/")}>
                <Linkedin size={16} /> LinkedIn
              </button>
            </div>
            {error && <p className="about-link-error" role="alert">{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
