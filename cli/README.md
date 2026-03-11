# Microsoft Learn Companion CLI

`mslearn` is a thin companion CLI for the public Microsoft Learn MCP server.

It gives you terminal-friendly commands for docs search, docs fetch, code sample search, and environment diagnostics.

By default, it connects to:

```text
https://learn.microsoft.com/api/mcp
```

## Requirements

This project requires Node.js 22 or later.

```bash
node --version
```

## Quick Start

From the `cli` directory:

```bash
npm install
npm run build
npm test
node dist/index.js --help
```

After building, you can run the CLI in three ways.

### Option A: Run with Node directly

```bash
node dist/index.js search "azure functions timeout"
```

### Option B: Run with `npx`

```bash
npx . search "azure functions timeout"
```

### Option C: Use `npm link` for local CLI-style usage

```bash
npm link
mslearn search "azure functions timeout"
```

After `npm link`, you can use the CLI like a normal command:

```bash
mslearn search "azure functions timeout"
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions" --section "Function app timeout duration"
mslearn code-search "cosmos db change feed processor" --language csharp
mslearn doctor
```

## Commands

```bash
mslearn search "azure functions timeout"
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions"
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions" --section "Function app timeout duration"
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions" --max-chars 3000
mslearn code-search "cosmos db change feed processor"
mslearn code-search "cosmos db change feed processor" --language csharp
mslearn doctor
mslearn doctor --format json
```

Available commands:

- `search <query>` searches official Microsoft documentation.
- `fetch <url>` fetches a Learn page as markdown-friendly output.
- `fetch <url> --section <heading>` returns a single section.
- `fetch <url> --max-chars <number>` truncates output.
- `code-search <query> --language <name>` searches official code samples.
- `doctor [--format text|json]` checks runtime and connectivity.

## Endpoint configuration

To override the default endpoint, set `MSLEARN_ENDPOINT` or pass `--endpoint <url>` for a single command.

Example in PowerShell:

```powershell
$env:MSLEARN_ENDPOINT = "https://learn.microsoft.com/api/mcp"
mslearn doctor
```
