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

The standalone CLI can install a CLI-first skill plus an always-loaded instruction for the same
agent ecosystems supported by this repository's plugins: GitHub Copilot, Claude Code, and Codex.
The instruction routes Microsoft technology questions to the skill, and the skill teaches the agent
to invoke `npx @microsoft/learn-cli@latest`.

Select one or more agents explicitly. Install discovery for the current user:

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
mslearn remove --cli --copilot
mslearn remove --cli --claude --codex --project
```

| Agent | Scope | Skill | Always-loaded instruction |
|-------|-------|-------|---------------------------|
| GitHub Copilot | User | `~/.copilot/skills/microsoft-learn-cli/SKILL.md` | `~/.copilot/instructions/microsoft-learn-cli.instructions.md` |
| GitHub Copilot | Project | `.github/skills/microsoft-learn-cli/SKILL.md` | `.github/instructions/microsoft-learn-cli.instructions.md` |
| Claude Code | User | `~/.claude/skills/microsoft-learn-cli/SKILL.md` | `~/.claude/rules/microsoft-learn-cli.md` |
| Claude Code | Project | `.claude/skills/microsoft-learn-cli/SKILL.md` | `.claude/rules/microsoft-learn-cli.md` |
| Codex | User | `~/.agents/skills/microsoft-learn-cli/SKILL.md` | `$CODEX_HOME/AGENTS.md` or `~/.codex/AGENTS.md` |
| Codex | Project | `.agents/skills/microsoft-learn-cli/SKILL.md` | `AGENTS.md` |

`--cli` and at least one agent target (`--copilot`, `--claude`, or `--codex`) are required. The CLI
does not auto-detect agents or configure MCP. Agents outside the plugin ecosystems, including
Cursor, are not installed by this workflow. Re-running setup refreshes managed content; re-running
removal succeeds when it is already absent.

For Codex, setup updates the active non-empty `AGENTS.override.md` when present; otherwise it uses
`AGENTS.md`. Only the marked Microsoft Learn CLI section is updated or removed, preserving all
unrelated instructions.

### CLI-first versus MCP-first

| Mode | Installation | Agent behavior |
|------|--------------|----------------|
| Standalone CLI-first | Install/run this npm package, then use `mslearn setup --cli <agent-target>` | The selected agent invokes the standalone CLI through `npx`; no MCP configuration is added |
| Repository plugin, MCP-first | Install the repository plugin for GitHub Copilot, Claude Code, or Codex | The plugin supplies the Microsoft Learn MCP endpoint and MCP-oriented skills |

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
mslearn setup --cli --claude
mslearn setup --cli --codex
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
- `setup --cli (--copilot|--claude|--codex) [--project]` installs discovery for one or more agents.
- `remove --cli (--copilot|--claude|--codex) [--project]` removes only managed discovery content.

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
