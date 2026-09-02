# AGENTS.md

This repo is the community-facing repo for **Microsoft Learn MCP Server** — a remote MCP endpoint (`https://learn.microsoft.com/api/mcp`) that gives AI agents access to official Microsoft documentation. The repo also contains a CLI (`cli/`), agent skills, and plugin manifests for three ecosystems.

## Plugin ecosystems

The repo publishes plugin metadata for three ecosystems. The shared plugin package lives at `plugins/microsoft-docs/`; root-level files are marketplace catalogs or compatibility shims.

**Shared assets** used across ecosystems:
- `plugins/microsoft-docs/skills/` — agent skill packages (each subfolder has a `SKILL.md`)
- `plugins/microsoft-docs/.mcp.json` — MCP server endpoint config for Claude Code and GitHub Copilot CLI
- `plugins/microsoft-docs/.codex.mcp.json` — Codex MCP server endpoint config, using Codex's documented direct server map shape

**Claude** — `.claude-plugin/marketplace.json` points to `plugins/microsoft-docs/`; `plugins/microsoft-docs/.claude-plugin/plugin.json` defines the Claude package.

**GitHub Copilot** — `.github/plugin/marketplace.json` points to `plugins/microsoft-docs/`; `plugins/microsoft-docs/plugin.json` defines the marketplace package; `.github/plugin/plugin.json` is a direct-install shim for `/plugin install microsoftdocs/mcp` and points to the shared package assets.

**Codex** — `.agents/plugins/marketplace.json` points to `plugins/microsoft-docs/`; `plugins/microsoft-docs/.codex-plugin/plugin.json` defines the Codex package. Codex marketplace entries must point to a plugin subfolder such as `./plugins/microsoft-docs`; do not use `./`.

## Sync rules

When editing shared plugin metadata, keep identity fields aligned across all plugin manifests: `plugins/microsoft-docs/plugin.json`, `plugins/microsoft-docs/.claude-plugin/plugin.json`, `plugins/microsoft-docs/.codex-plugin/plugin.json`, and `.github/plugin/plugin.json`. The direct-install shim has repo-root-relative asset paths, so it must not be an exact copy of the package manifests.

## CLI

Source is in `cli/src/`, and built output is generated into `cli/dist/` during the build (locally and in CI) rather than checked into the repo. If you change CLI behavior, run `npm run build && npm test` from `cli/`. Targets Node.js 22+. Keep `cli/README.md` aligned with the actual command surface.

## Validation

Run the repo validator after any plugin, skill, layout, or doc changes:

```powershell
pwsh -File scripts/validate-repo.ps1
```

It enforces sync rules, skill structure, file existence, and marketplace wiring. Treat it as the authoritative checklist.

## General principles

- `README.md` is the primary user-facing document. Update it in the same change whenever install steps, plugin layout, skills, or CLI behavior change.
- Make the smallest synchronized set of edits that keeps all three ecosystems coherent.
- Keep plugin runtime assets under `plugins/microsoft-docs/`; root-level plugin files are marketplace catalogs or compatibility shims only.
- Prefer fixing drift immediately over documenting known inconsistency.
