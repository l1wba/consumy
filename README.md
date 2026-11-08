# consumy

Aplicativo de finanças pessoais feito com React, TypeScript e Tauri. O app usa Supabase para autenticação e armazenamento sincronizado entre dispositivos.

## Versões

O número da versão é mantido em `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` e `src-tauri/tauri.conf.json`; mantenha esses valores sincronizados. O Vite obtém a versão do `package.json` e a exibe na janela "Sobre". A versão também define o nome dos instaladores.

Seguimos o formato `MAJOR.MINOR.PATCH`: aumente `PATCH` para correções e ajustes pequenos, `MINOR` para funcionalidades compatíveis e `MAJOR` para mudanças incompatíveis. Como o app ainda está na série `0.x`, a versão `0.6.4` aplica a identidade visual consumy à interface.

## Requisitos

- Node.js LTS e npm
- Rust com a toolchain estável
- Dependências de sistema do Tauri 2 para a plataforma usada

No Windows, instale o Visual Studio 2022 Build Tools com a carga **Desenvolvimento para desktop com C++**, incluindo o MSVC v143 (x64/x86) e um Windows 10/11 SDK. Esses componentes fornecem o `link.exe` exigido para compilar o alvo Rust MSVC. Instale também o WebView2 Runtime.
Consulte [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) para a lista de pré-requisitos e comandos no Windows.

## Desenvolvimento

```powershell
npm.cmd install
npm.cmd run tauri dev
```

No PowerShell, use `npm.cmd` se a política de execução bloquear `npm.ps1`. Isso evita alterar as configurações de segurança do sistema.

Se o Rust informar `linker link.exe not found`, abra o **Developer PowerShell for VS 2022** (ou o **x64 Native Tools Command Prompt for VS 2022**) e execute os comandos de desenvolvimento nesse terminal. Verifique primeiro se `where.exe link.exe` encontra o linker. Se não encontrar, abra o Visual Studio Installer, modifique a instalação do Build Tools e confira a carga e os componentes C++ acima. O VS Code, sozinho, não inclui o compilador nem o linker.

O comando abre o aplicativo desktop e inicia o Vite como servidor de desenvolvimento local temporário. Esse servidor só atende a interface enquanto o modo de desenvolvimento está aberto; não é necessário hospedar nem administrar um servidor. O Vite ignora `src-tauri/target`, pois o Cargo modifica esses arquivos durante a compilação. O perfil Rust de desenvolvimento desativa símbolos de depuração para reduzir o espaço usado pelos artefatos locais.

## Gerar aplicativo

```powershell
npm.cmd run tauri build
```

O instalador/artefato da plataforma será gerado em `src-tauri/target/release/bundle`.

## Ícones

Os ícones do aplicativo são gerados pelo Tauri a partir da logo quadrada com transparência em `src-tauri/icons/logo-transparent.png`. Para regenerá-los após atualizar a logo, execute `npm.cmd run tauri -- icon src-tauri/icons/logo-transparent.png -o src-tauri/icons`.

## Armazenamento

Lançamentos, categorias e preferências são armazenados no Supabase e associados à conta autenticada. O app requer conexão com a internet para acessar esses dados. Uma eventual base `financas.db` de versões antigas não é mais acessada nem removida automaticamente.

## Supabase e sincronização

O aplicativo usa o Supabase para autenticação por e-mail/senha, dados remotos e atualizações em tempo real. Crie `.env.local` na raiz a partir de `.env.example` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores do projeto Supabase. Esses valores são usados pelo frontend; nunca coloque a chave `service_role` nesse arquivo.

Execute a migração `supabase/migrations/20261107000000_initial_schema.sql` no projeto Supabase antes de usar os dados. As políticas RLS restringem cada tabela ao usuário autenticado. Para atualizações em tempo real, habilite as tabelas `categories`, `transactions` e `user_settings` na publicação `supabase_realtime` do projeto.

Em **Authentication > URL Configuration**, durante o desenvolvimento use `http://127.0.0.1:1420` como **Site URL** e adicione esse endereço à lista de redirecionamentos permitidos. Depois do deploy, atualize o **Site URL** para o domínio da Vercel e mantenha os endereços de desenvolvimento e produção permitidos. Faça o cadastro inicial pela interface web no navegador para confirmar o e-mail; depois entre com a mesma conta no desktop.

## Organização do código

- `src/components/dashboard/`: resumo mensal e indicadores financeiros.
- `src/components/transactions/`: formulário e tabela de lançamentos.
- `src/components/dialogs/`: gerenciamento de categorias e informações do aplicativo.
- `src/data/`: tipos compartilhados, contrato de dados e implementação Supabase.
- `src/styles/`: estilos específicos de componentes; `src/styles.css` mantém os estilos gerais da aplicação.
- `supabase/migrations/`: alterações versionadas do esquema futuro do banco remoto.
- `src-tauri/`: configuração e código do aplicativo desktop.
