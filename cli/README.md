# Microsoft Learn Companion CLI

`mslearn` is a thin companion CLI for the public Microsoft Learn MCP server. It dynamically discovers the available Learn tools at runtime and exposes shell-friendly commands for docs search, docs fetch, code sample search, and environment diagnostics.

## Commands

```bash
mslearn search "azure functions timeout"
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions#function-app-timeout-duration" --section "Function app timeout duration"
mslearn code-search "cosmos db change feed processor" --language csharp
mslearn doctor
```

By default, the CLI connects to the public Microsoft Learn MCP endpoint:

```text
https://learn.microsoft.com/api/mcp
```

## Development

```bash
npm install
npm run build
npm test
node dist/index.js --help
```
