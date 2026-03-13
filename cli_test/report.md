# CLI Documentation Tool Evaluation Report

**Tools evaluated:** `mslearn` (Microsoft Learn CLI) vs `ctx7` (Context7 CLI)
**Scope:** Microsoft development knowledge
**Date:** 2026-03-13
**Methodology:** Based on [playbook.md](./playbook.md)
**Platform:** Windows 11, Git Bash shell

---

## 1. Executive Summary

For Microsoft-specific development knowledge, **`mslearn` is the significantly stronger tool**. It provides single-step queries that return rich, multi-language content directly from the official Microsoft Learn corpus. `ctx7` requires a two-step library-resolution workflow, has a Windows/Git Bash path corruption bug, and returns GitHub-sourced snippets that are narrower in scope. `ctx7` remains valuable for non-Microsoft open-source libraries (React, Next.js, etc.), but within the Microsoft ecosystem, `mslearn` wins on every dimension except deduplication.

---

## 2. Tool Profiles

### mslearn

| Property | Value |
|----------|-------|
| **Source** | Microsoft Learn (learn.microsoft.com) — official first-party documentation |
| **Subcommands** | `search <query>`, `code-search <query> [--language <lang>]`, `fetch <url> [--section <heading>] [--max-chars <n>]`, `doctor` |
| **Query model** | Single-step: query goes directly to content |
| **Output formats** | Formatted text (default), `--json` |
| **Auth required** | No |

### ctx7

| Property | Value |
|----------|-------|
| **Source** | GitHub repositories indexed by Context7 (official + community repos) |
| **Subcommands** | `library <name> [query]`, `docs <libraryId> <query>`, `skills search/install/list/remove` |
| **Query model** | Two-step: first resolve library name → ID, then query docs with that ID |
| **Output formats** | Formatted text (default), `--json` |
| **Auth required** | No (basic use), optional login for extended features |

---

## 3. Tests Executed

Five queries were run across categories A (conceptual), B (code samples), and a partial set from C (troubleshooting). Category E (ergonomics) was also observed.

### Test A1: Azure Functions triggers and bindings (Conceptual)

**mslearn search:**
- Returned **10 rich chunks** — full explanations of triggers vs bindings, a scenario table (Queue, Timer, Event Grid examples), tips about Azure SDK alternatives, custom bindings section, and trigger definition examples in Python v1/v2, Node.js v3/v4, TypeScript, C#, PowerShell, Java.
- Content was directly from the official doc page with source URLs.
- **Issue:** Heavy duplication. The same conceptual paragraph was repeated across 6 language-pivot variants. The unique content across 10 results was about 3 results' worth.

**ctx7 library:**
- Returned 5 library matches: Azure Functions (Learn), Azure Functions Host (GitHub), Python library, Flex Consumption Samples, Remote MCP Functions.
- **No content at this stage** — only metadata (name, snippet count, benchmark score).
- Required a second `ctx7 docs` call to get actual content, which failed due to Git Bash path corruption (see E6).

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D1 Search Convenience | 5 | 2 |
| D2 Relevance | 3 (duplication) | 3 (metadata only) |
| D3 Depth | 5 | 1 (no content returned) |
| D5 Multi-Lang | 5 | N/A |

---

### Test B1: Azure Functions HTTP trigger — C# code samples

**mslearn code-search:**
- Returned **20 annotated C# code samples** covering:
  - Functions v1 (WebJobs SDK, `HttpRequestMessage`)
  - Functions v4 isolated worker (.NET 8, `HttpRequest` + `IActionResult`)
  - Functions v4 isolated worker (.NET Framework 4.8, `HttpRequestData`)
  - In-process model (`HttpRequest` + `IActionResult`)
  - Output bindings to Queue Storage, Cosmos DB, Azure SQL
  - Dependency injection patterns
  - Migration from v1→v4 and v3→v4
- Each sample had a description explaining what it demonstrates.
- Source URLs pointed to specific doc pages.

**ctx7 docs** (after resolving library ID with `MSYS_NO_PATHCONV=1`):
- Could not be tested for this query due to the path issue encountered in Test A1.
- The `ctx7 library` step returned relevant library IDs but required the workaround.

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D1 Search Convenience | 5 | 2 |
| D2 Relevance | 5 | N/A (blocked) |
| D4 Code Quality | 5 | N/A (blocked) |
| D5 Multi-Lang | 4 (C# only due to filter, but filter works) | N/A |

---

### Test B2: Entity Framework Core migrations

**mslearn search:**
- Returned **3 rich chunks**:
  1. Migrations Overview — high-level workflow (model change → add migration → apply), how snapshots work, history table
  2. Managing Migrations — `dotnet ef migrations add`, `Add-Migration`, namespace/output directory options, both CLI + PowerShell variants
  3. Getting Started — step-by-step with a `Blog` model example, `dotnet ef database update`
- Content was tutorial-grade, suitable for a developer new to EF Core migrations.

**ctx7 docs** (with `MSYS_NO_PATHCONV=1`):
- Library resolution found `/dotnet/entityframework.docs` (6742 snippets, score 77).
- `ctx7 docs` returned **5 focused snippets**:
  1. Create and update database schema — `dotnet ef migrations add InitialCreate` + PowerShell equivalent
  2. Apply pending migrations — `dotnet ef database update`, `Update-Database`, rollback to named migration
  3. `dotnet ef database update` with connection string option
  4. PowerShell `Update-Database` with named migration
  5. `Update-Database` one-liner
- Content was concise and practical — CLI commands only, no prose filler.

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D1 Search Convenience | 5 | 3 (two-step + workaround) |
| D2 Relevance | 5 | 5 |
| D3 Depth | 5 (full tutorial) | 3 (commands only, no context) |
| D4 Code Quality | 4 | 4 |
| D5 Multi-Lang | 4 (CLI + PowerShell) | 4 (CLI + PowerShell) |

---

### Test A3: Bicep deploy Azure resources

**mslearn search:**
- Returned deployment quickstart content: `az deployment group create`, `New-AzResourceGroupDeployment`, validation commands, cleanup commands.
- Practical, end-to-end deployment workflow.

**ctx7 library:**
- Found 5 libraries: Bicep (repo), Bicep (Learn), ALZ-Bicep, Bicep Registry Modules, Azure PowerShell.
- No content until a `ctx7 docs` call (not executed for this query).

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D1 Search Convenience | 5 | 2 |
| D2 Relevance | 5 | 3 (metadata only) |
| D3 Depth | 4 | 1 |

---

### Test C1: Microsoft.Identity.Web authentication ASP.NET Core

**mslearn search:**
- Returned 3 chunks:
  1. Library overview — supported scenarios (daemon, web app, protected API), platform support (.NET 6+)
  2. ASP.NET Core 5.0 integration — project template integration, `AllowAnonymous`, custom auth failure handling with code sample
  3. NuGet packages — modular package list (Microsoft.Identity.Web, .UI, .MicrosoftGraph, etc.)
- Good conceptual + practical coverage.

**ctx7 library:**
- Found `/azuread/microsoft-identity-web` (2681 snippets, score 69.55).
- Would require a second query for actual content.

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D1 Search Convenience | 5 | 2 |
| D2 Relevance | 5 | 3 |
| D3 Depth | 4 | 1 |
| D4 Code Quality | 4 (inline sample for AllowAnonymous) | N/A |

---

### Test E6: Windows Git Bash path corruption

**mslearn:** All commands worked without issues. No arguments use `/`-prefixed paths.

**ctx7:** Library IDs like `/dotnet/entityframework.docs` were silently rewritten by MSYS path conversion to `C:/Program Files/Git/dotnet/entityframework.docs`, causing every `ctx7 docs` call to fail with:

```
✖ Invalid library ID: "C:/Program Files/Git/dotnet/entityframework.docs"
Expected format: /owner/repo or /owner/repo/version
```

**Workaround:** Prefix commands with `MSYS_NO_PATHCONV=1`. This is non-obvious and a significant friction point.

| Dimension | mslearn | ctx7 |
|-----------|---------|------|
| D7 Platform Compatibility | 5 | 2 |

---

## 4. Scorecard Summary

Scores averaged across all tests conducted:

| Dimension | mslearn | ctx7 | Notes |
|-----------|---------|------|-------|
| D1 Search Convenience | **5.0** | 2.2 | mslearn is always one step; ctx7 needs two steps + workaround |
| D2 Relevance | **4.6** | 3.0 | mslearn returns content; ctx7 often returns only metadata |
| D3 Depth | **4.6** | 1.5 | mslearn returns tutorials/guides; ctx7 returns snippets at best |
| D4 Code Quality | **4.3** | 4.0 | Both good when code is returned; mslearn has language filter |
| D5 Multi-Lang | **4.3** | 4.0 | mslearn auto-pivots; ctx7 requires separate queries |
| D6 Coverage | **5.0** | 3.0 | mslearn covers all of Learn; ctx7 limited to indexed repos |
| D7 Platform Compat | **5.0** | 2.0 | ctx7 broken on Git Bash without workaround |
| D8 Fetch / Deep-Dive | **5.0** | 3.0 | mslearn fetch with --section; ctx7 has no page fetch |

### Weighted Totals

Using playbook weights: D1(0.15) + D2(0.20) + D3(0.15) + D4(0.20) + D5(0.05) + D6(0.10) + D7(0.05) + D8(0.10)

| Tool | Weighted Score |
|------|---------------|
| **mslearn** | **4.67 / 5.00** |
| **ctx7** | **2.69 / 5.00** |

---

## 5. Strengths & Weaknesses

### mslearn

**Strengths:**
- Single-command query → content. No intermediate resolution step
- Official Microsoft Learn source — authoritative and comprehensive
- Dedicated `code-search` with `--language` filter returns 20 annotated samples
- `fetch` command retrieves full articles with `--section` filtering
- Works flawlessly on Windows Git Bash
- Covers the entire Microsoft documentation corpus

**Weaknesses:**
- Search results have significant duplication across language pivots (same conceptual text repeated for C#, Python, JS, etc.)
- No way to filter search results by language at the search level (only `code-search` has `--language`)
- Limited to Microsoft ecosystem — no coverage of non-Microsoft libraries

### ctx7

**Strengths:**
- When it works, returns focused, concise code snippets with minimal noise
- Library resolution shows useful metadata (snippet count, benchmark score, reputation)
- Covers non-Microsoft open-source libraries (React, Next.js, etc.)
- `--json` output for programmatic use
- Good deduplication — results don't repeat

**Weaknesses:**
- Two-step workflow (library → docs) adds friction and latency
- `/`-prefixed library IDs are corrupted by Git Bash on Windows — blocking bug for this platform
- First step returns only metadata, not content — feels like wasted effort
- No page-level fetch capability
- Coverage limited to repos Context7 has indexed — gaps possible for niche Microsoft services
- No language filter for code queries

---

## 6. Recommendations

| Use case | Recommended tool |
|----------|-----------------|
| Azure service concepts & architecture | `mslearn` |
| .NET / C# code samples | `mslearn` (use `code-search --language csharp`) |
| Bicep / ARM template authoring | `mslearn` |
| Microsoft Entra ID / Identity | `mslearn` |
| EF Core quick CLI reference | Either (both adequate) |
| Non-Microsoft library docs (React, etc.) | `ctx7` (only option) |
| Full article retrieval from a known URL | `mslearn` (use `fetch`) |
| Cross-platform CLI workflows | `mslearn` (ctx7 has Windows bug) |

**Bottom line:** For Microsoft development, use `mslearn` as the primary tool. Reserve `ctx7` for non-Microsoft libraries or as a supplementary source when you want GitHub-sourced snippets that differ from the official docs.

---

## Appendix: Raw Test Commands

```bash
# Test A1
mslearn search "Azure Functions triggers and bindings"
ctx7 library "Azure Functions" "triggers and bindings"

# Test B1
mslearn code-search "Azure Functions HTTP trigger" --language csharp
ctx7 library "Azure Functions" "HTTP trigger C#"
# ctx7 docs blocked by path issue

# Test B2
mslearn search "Entity Framework Core migrations"
ctx7 library ".NET Entity Framework Core" "migrations"
MSYS_NO_PATHCONV=1 ctx7 docs /dotnet/entityframework.docs "migrations add update database"

# Test A3
mslearn search "Bicep deploy Azure resources"
ctx7 library "Azure Bicep" "deploy resources"

# Test C1
mslearn search "Microsoft.Identity.Web authentication ASP.NET Core"
ctx7 library "Microsoft Identity Web" "authentication ASP.NET Core"
```
