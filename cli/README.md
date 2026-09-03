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

## Agent discovery

The standalone CLI can install a CLI-first skill for the same agent ecosystems supported by this
repository's plugins: GitHub Copilot, Claude Code, and Codex. The skill teaches the agent to invoke
`npx @microsoft/learn-cli@latest` when Microsoft Learn MCP tools are unavailable.

Install discovery for detected agents in the current user profile:

```bash
mslearn setup --cli
```

Or detect agents in the current repository and install discovery there:

```bash
mslearn setup --cli --project
```

Override auto-detection by selecting one or more agents explicitly:

```bash
mslearn setup --cli --copilot
mslearn setup --cli --claude
mslearn setup --cli --codex
```

Or install it only in the current repository:

```bash
mslearn setup --cli --copilot --project
mslearn setup --cli --claude --project
mslearn setup --cli --codex --project
```

Target flags can be combined:

```bash
mslearn setup --cli --copilot --claude --codex
```

Remove the managed files without changing unrelated agent configuration:

```bash
mslearn remove --cli
mslearn remove --cli --copilot
mslearn remove --cli --claude --codex --project
```

| Agent | Scope | Skill |
|-------|-------|-------|
| GitHub Copilot | User | `~/.copilot/skills/microsoft-learn-cli/SKILL.md` |
| GitHub Copilot | Project | `.github/skills/microsoft-learn-cli/SKILL.md` |
| Claude Code | User | `~/.claude/skills/microsoft-learn-cli/SKILL.md` |
| Claude Code | Project | `.claude/skills/microsoft-learn-cli/SKILL.md` |
| Codex | User | `~/.agents/skills/microsoft-learn-cli/SKILL.md` |
| Codex | Project | `.agents/skills/microsoft-learn-cli/SKILL.md` |

`--cli` is required. Without an agent target, setup detects installed agents from their well-known
user or project directories, while removal detects only Microsoft Learn CLI-managed discovery
artifacts. Explicit targets (`--copilot`, `--claude`, or `--codex`) override detection and can be
combined. Agents outside the plugin ecosystems, including Cursor, are not installed by this
workflow. Re-running setup refreshes managed content; explicitly targeted removal succeeds when
discovery is already absent.

### CLI-first versus MCP-first

| Mode | Installation | Agent behavior |
|------|--------------|----------------|
| Standalone CLI-first | Install/run this npm package, then use `mslearn setup --cli [agent-target]` | Detected or selected agents invoke the standalone CLI through `npx` when Learn MCP tools are unavailable; no MCP configuration is added |
| Repository plugin, MCP-first | Install the repository plugin for GitHub Copilot, Claude Code, or Codex | The plugin supplies the Microsoft Learn MCP endpoint and MCP-oriented skills |

When both integrations are installed, agents should prefer the Microsoft Learn MCP tools and use
the standalone CLI skill only as a fallback.

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
mslearn setup --cli
mslearn setup --cli --project
mslearn setup --cli --copilot
mslearn setup --cli --copilot --project
mslearn setup --cli --claude
mslearn setup --cli --codex
mslearn remove --cli
mslearn remove --cli --copilot
mslearn remove --cli --copilot --project
mslearn remove --cli --claude
mslearn remove --cli --codex
```

Available commands:

- `search <query>` searches official Microsoft documentation.
- `fetch <url>` fetches a Learn page as markdown-friendly output.
- `fetch <url> --section <heading>` returns a single section.
- `fetch <url> --max-chars <number>` truncates output.
- `code-search <query> --language <name>` searches official code samples.
- `doctor [--format text|json]` checks runtime and connectivity.
- `setup --cli [--copilot|--claude|--codex] [--project]` detects agents or installs discovery for explicit targets.
- `remove --cli [--copilot|--claude|--codex] [--project]` detects and removes only managed discovery content.

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
