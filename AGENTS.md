# AGENTS.md

This repo is the community-facing repo for **Microsoft Learn MCP Server** — a remote MCP endpoint (`https://learn.microsoft.com/api/mcp`) that gives AI agents access to official Microsoft documentation. The repo also contains a CLI (`cli/`), agent skills (`skills/`), and plugin manifests for three ecosystems.

## Plugin ecosystems

The repo publishes plugin metadata for three ecosystems. `.claude-plugin/plugin.json` is the **source of truth** for shared plugin fields (name, description, version, author, etc.).

**Shared assets** used across ecosystems:
- `skills/` — agent skill packages (each subfolder has a `SKILL.md`)
- `.mcp.json` — MCP server endpoint config

**Claude** — `.claude-plugin/plugin.json` (source of truth) + `.claude-plugin/marketplace.json`

**GitHub Copilot** — `.github/plugin/plugin.json` — must be an **exact copy** of `.claude-plugin/plugin.json`.

**Codex** — `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json`. The plugin.json shares fields with Claude but adds Codex-only fields (`skills`, `mcpServers`, `interface`, `license`) that wire it to the shared assets. Keep asset paths relative to repo root (`./skills/`, `./.mcp.json`) — never use `..` paths. The marketplace file must point at `./`.

## Sync rules

When editing shared plugin metadata, edit `.claude-plugin/plugin.json` first, then copy it verbatim to `.github/plugin/plugin.json` and update shared fields in `.codex-plugin/plugin.json` to match.

## CLI

Source is in `cli/src/`, built output is checked into `cli/dist/`. If you change CLI behavior, run `npm run build && npm test` from `cli/`. Targets Node.js 22+. Keep `cli/README.md` aligned with the actual command surface.

## Validation

Run the repo validator after any plugin, skill, layout, or doc changes:

```powershell
pwsh -File scripts/validate-repo.ps1
```

It enforces sync rules, skill structure, file existence, and marketplace wiring. Treat it as the authoritative checklist.

## General principles

- `README.md` is the primary user-facing document. Update it in the same change whenever install steps, plugin layout, skills, or CLI behavior change.
- Make the smallest synchronized set of edits that keeps all three ecosystems coherent.
- Do not reintroduce a nested `plugins/microsoft-docs` copy for Codex packaging.
- Prefer fixing drift immediately over documenting known inconsistency.
