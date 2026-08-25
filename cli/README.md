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

Installing the npm package alone does not install agent discovery.

## GitHub Copilot discovery

The standalone CLI can install a CLI-first skill plus an always-loaded GitHub Copilot instruction.
The instruction routes Microsoft technology questions to the skill, and the skill teaches Copilot
to invoke `npx @microsoft/learn-cli@latest`.

Install discovery for the current user:

```bash
mslearn setup --cli --copilot
```

Or install it only in the current repository:

```bash
mslearn setup --cli --copilot --project
```

Remove the managed files without changing unrelated Copilot configuration:

```bash
mslearn remove --cli --copilot
mslearn remove --cli --copilot --project
```

| Scope | Skill | Always-loaded instruction |
|-------|-------|---------------------------|
| User profile | `~/.copilot/skills/microsoft-learn-cli/SKILL.md` | `~/.copilot/instructions/microsoft-learn-cli.instructions.md` |
| Current repository | `.github/skills/microsoft-learn-cli/SKILL.md` | `.github/instructions/microsoft-learn-cli.instructions.md` |

Both `--cli` and `--copilot` are required. The CLI does not auto-detect agents or configure MCP,
and v1 does not install discovery for Claude or Codex. Re-running setup refreshes the two managed
files; re-running removal succeeds when they are already absent.

### CLI-first versus MCP-first

| Mode | Installation | Agent behavior |
|------|--------------|----------------|
| Standalone CLI-first | Install/run this npm package, then use `mslearn setup --cli --copilot` | GitHub Copilot invokes the standalone CLI through `npx`; no MCP configuration is added |
| Repository plugin, MCP-first | In GitHub Copilot CLI, run `/plugin install microsoftdocs/mcp` | The plugin supplies the Microsoft Learn MCP endpoint and MCP-oriented skills |

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
mslearn setup --cli --copilot
mslearn setup --cli --copilot --project
mslearn remove --cli --copilot
mslearn remove --cli --copilot --project
```

Available commands:

- `search <query>` searches official Microsoft documentation.
- `fetch <url>` fetches a Learn page as markdown-friendly output.
- `fetch <url> --section <heading>` returns a single section.
- `fetch <url> --max-chars <number>` truncates output.
- `code-search <query> --language <name>` searches official code samples.
- `doctor [--format text|json]` checks runtime and connectivity.
- `setup --cli --copilot [--project]` installs GitHub Copilot discovery.
- `remove --cli --copilot [--project]` removes only the managed discovery files.

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
npm.cmd run build
npm.cmd test
node dist/index.js --help
```
