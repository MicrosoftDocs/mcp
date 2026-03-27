# Microsoft Learn CLI `preview`

`mslearn` is a terminal CLI for the public Microsoft Learn MCP server.

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

## Installation

### Option A: Run instantly with `npx` (no install)

```bash
npx @microsoft/learn-cli search "azure functions timeout"
```

### Option B: Install globally

```bash
npm install -g @microsoft/learn-cli
mslearn search "azure functions timeout"
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

The `search` and `code-search` commands output human-readable formatted text by
default. Pass `--json` to get the raw JSON response, which is useful for piping
to other tools:

```bash
mslearn search "azure functions" --json | jq '.results[].title'
mslearn code-search "BlobServiceClient" --language python --json
```

## Endpoint configuration

To override the default endpoint, set `MSLEARN_ENDPOINT` or pass `--endpoint <url>` for a single command.

Example in PowerShell:

```powershell
$env:MSLEARN_ENDPOINT = "https://learn.microsoft.com/api/mcp"
mslearn doctor
```

## Development

To build and test from source:

```bash
cd cli
npm install
npm run build
npm test
node dist/index.js --help
```
