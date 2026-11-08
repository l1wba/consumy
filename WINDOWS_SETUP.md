# Configuração no Windows

## Pré-requisitos

- Node.js 20 LTS ou superior (npm vem com o Node.js)
- Rust stable via rustup
- Visual Studio 2022 Build Tools com a carga **Desenvolvimento para desktop com C++**
- MSVC v143 (x64/x86) e um Windows 10/11 SDK
- Microsoft Edge WebView2 Runtime

O MSVC fornece `link.exe`, necessário para compilar o alvo Rust MSVC.

## Comandos

Abra o **Developer PowerShell for VS 2022** (ou **x64 Native Tools Command Prompt for VS 2022**) para carregar o linker. Confirme que está disponível:

```powershell
where.exe link.exe
```

No PowerShell, use `npm.cmd` caso a política de execução bloqueie `npm.ps1`.
Na raiz do projeto, instale as dependências JavaScript:

```powershell
npm.cmd install
```

Inicie a aplicação desktop em modo de desenvolvimento:

```powershell
npm.cmd run tauri dev
```

Gere o aplicativo para distribuição:

```powershell
npm.cmd run tauri build
```

As dependências JavaScript são definidas em `package.json`; as dependências Rust, em `src-tauri/Cargo.toml`.
