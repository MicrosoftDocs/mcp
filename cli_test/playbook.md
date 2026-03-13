# CLI Documentation Tool Evaluation Playbook

## Purpose

This playbook provides a structured, repeatable methodology for evaluating and comparing CLI tools that retrieve developer documentation. It was designed for comparing `mslearn` (Microsoft Learn CLI) and `ctx7` (Context7 CLI) in the scope of Microsoft development knowledge, but the framework generalizes to any pair of doc-lookup CLIs.

Any AI agent or human evaluator can follow this playbook end-to-end and produce a quantitative comparison report.

---

## Prerequisites

Before starting, confirm both CLIs are installed and reachable:

```bash
# Verify installation
which ctx7 && ctx7 --version
which mslearn && mslearn --version

# Read help for each tool to understand available subcommands and flags
ctx7 --help
mslearn --help

# Check subcommand help for all relevant commands
mslearn search --help
mslearn code-search --help
mslearn fetch --help
ctx7 library --help
ctx7 docs --help
```

**Platform note (Windows / Git Bash):** `ctx7` library IDs start with `/` (e.g., `/dotnet/entityframework.docs`). Git Bash on Windows rewrites these to Windows paths. Use `MSYS_NO_PATHCONV=1` before ctx7 commands that take a library ID argument, or test in PowerShell/cmd.

---

## Evaluation Dimensions

Score each dimension on a **1–5 scale** per tool:

| Score | Meaning |
|-------|---------|
| 1 | Fails or returns nothing useful |
| 2 | Partially works but results are poor or misleading |
| 3 | Adequate — returns relevant content but with notable gaps |
| 4 | Good — returns accurate, relevant, usable content |
| 5 | Excellent — returns comprehensive, well-structured, immediately actionable content |

### Dimension Definitions

| # | Dimension | What to evaluate |
|---|-----------|------------------|
| D1 | **Search Convenience** | How many steps/commands are needed to go from a question to usable content? Is the query interface intuitive? |
| D2 | **Result Relevance** | Are the top results directly relevant to the query, or do they contain noise/duplicates? |
| D3 | **Content Depth** | Does the tool return enough context to understand and act on the topic (explanations, prerequisites, caveats)? |
| D4 | **Code Sample Quality** | Are code samples complete, runnable, well-annotated, and up-to-date? Do they cover relevant language/framework versions? |
| D5 | **Multi-Language Support** | Does the tool return results for multiple programming languages when the topic is polyglot? |
| D6 | **Coverage Breadth** | Does the tool cover the full range of Microsoft technologies (Azure, .NET, M365, Bicep, Entra ID, Power Platform, etc.)? |
| D7 | **Platform Compatibility** | Does the tool work correctly across shells (bash, PowerShell, cmd) and OS platforms without workarounds? |
| D8 | **Fetch / Deep-Dive Capability** | Can the tool retrieve a full document or article when a search result is promising but truncated? |

---

## Test Cases

### Category A: Conceptual / Architectural Queries

These test whether the tool can explain "what" and "why" — service overviews, architecture patterns, decision guides.

| ID | Query | What a good result looks like |
|----|-------|-------------------------------|
| A1 | `Azure Functions triggers and bindings` | Explains triggers vs bindings, gives a table of example scenarios, mentions supported binding types |
| A2 | `Azure App Service deployment slots` | Explains slot swapping, warm-up, traffic routing, when to use slots |
| A3 | `Bicep vs ARM templates` | Compares syntax, tooling, migration path, pros/cons |
| A4 | `Microsoft Entra ID vs Azure AD B2C` | Clarifies naming, use cases for workforce vs consumer identity |
| A5 | `Azure Service Bus vs Event Grid vs Event Hubs` | Differentiates messaging patterns: queue vs pub/sub vs streaming |

**How to run:**

```bash
# mslearn — single step
mslearn search "<query>"

# ctx7 — two steps
ctx7 library "<topic>" "<query>"
# then use the returned library ID:
MSYS_NO_PATHCONV=1 ctx7 docs <library-id> "<query>"
```

### Category B: Code Sample Queries

These test whether the tool returns practical, copy-paste-ready code. Specify a language where applicable.

| ID | Query | Language | What a good result looks like |
|----|-------|----------|-------------------------------|
| B1 | `Azure Functions HTTP trigger` | C# | Complete function class with attributes, DI, request/response handling |
| B2 | `Entity Framework Core migrations` | C# | CLI commands + model class + migration file structure |
| B3 | `Azure Blob Storage upload file` | Python | SDK client setup, authentication, upload call with error handling |
| B4 | `Microsoft Graph API get user profile` | TypeScript | Auth setup, Graph client initialization, API call |
| B5 | `Bicep deploy storage account` | Bicep | Complete `.bicep` file with resource definition, parameters, outputs |

**How to run:**

```bash
# mslearn — dedicated code search with language filter
mslearn code-search "<query>" --language <lang>

# ctx7 — docs query (code comes from GitHub repos)
ctx7 library "<topic>" "<query>"
MSYS_NO_PATHCONV=1 ctx7 docs <library-id> "<query>"
```

### Category C: Troubleshooting / How-To Queries

These test whether the tool helps solve specific problems — error messages, migration guides, configuration issues.

| ID | Query | What a good result looks like |
|----|-------|-------------------------------|
| C1 | `migrate Azure Functions v3 to v4` | Step-by-step migration guide with breaking changes, package updates, code changes |
| C2 | `ASP.NET Core CORS configuration` | Middleware setup, policy configuration, common pitfalls |
| C3 | `Azure Key Vault access from App Service managed identity` | Enable managed identity, grant RBAC, SDK code to read secrets |
| C4 | `EF Core connection string Azure SQL` | Connection string format, where to store it, how to configure in `Program.cs` |
| C5 | `fix Azure DevOps pipeline YAML syntax error` | YAML structure reference, common mistakes, validation approach |

**How to run:** Same as Category A.

### Category D: Niche / Edge-Case Queries

These test coverage boundaries — topics that may not be in every index.

| ID | Query | What a good result looks like |
|----|-------|-------------------------------|
| D1 | `Power Automate custom connector authentication` | OAuth setup, custom connector wizard, API key configuration |
| D2 | `Azure Cosmos DB change feed processor` | Lease container, processor setup, scaling, error handling |
| D3 | `MAUI Blazor Hybrid app` | Project structure, platform-specific code, WebView configuration |
| D4 | `Dapr integration with Azure Container Apps` | Sidecar setup, state store, pub/sub component YAML |
| D5 | `Microsoft Teams bot with AI` | Bot Framework + Teams, adaptive cards, AI integration |

**How to run:** Same as Category A.

### Category E: Workflow / Ergonomics Tests

These are not query-content tests — they evaluate the tool's usability as a CLI.

| ID | Test | Pass criteria |
|----|------|---------------|
| E1 | Run a search with no arguments | Shows helpful usage message, not a crash |
| E2 | Run a search with a nonsensical query (e.g., `"xyzzy foobar"`) | Returns empty results gracefully, not an error |
| E3 | Measure wall-clock time for a typical search | Record time in seconds |
| E4 | Test `--json` output flag (if available) | Returns valid, parseable JSON |
| E5 | Test page/doc fetch from a URL (mslearn) or library ID (ctx7) | Returns full markdown content |
| E6 | Test on Windows Git Bash with `/`-prefixed arguments | Works without `MSYS_NO_PATHCONV` workaround |

---

## Execution Procedure

### Step 1: Discover tool capabilities

Run `--help` on every command and subcommand. Document:
- Available subcommands
- Available flags and options
- Required vs optional arguments
- Output format options (plain text, JSON)

### Step 2: Run all test cases

For each test case in categories A–D:

1. Run the query on **both tools**
2. Capture the **full output** (pipe to a file or use `--json` if available)
3. Score each dimension (D1–D8) for this test case on the 1–5 scale
4. Note any **failures, errors, or quirks**

For category E, run each ergonomics test on both tools and record pass/fail + notes.

### Step 3: Score

Fill in the scorecard below. Calculate per-dimension averages across all test cases, then compute a weighted total.

```
Scorecard Template
==================

Tool: _______________

| Test ID | D1 Search Conv. | D2 Relevance | D3 Depth | D4 Code Quality | D5 Multi-Lang | D6 Coverage | D7 Platform | D8 Fetch |
|---------|-----------------|--------------|----------|-----------------|---------------|-------------|-------------|----------|
| A1      |                 |              |          |                 |               |             |             |          |
| A2      |                 |              |          |                 |               |             |             |          |
| ...     |                 |              |          |                 |               |             |             |          |
| Avg     |                 |              |          |                 |               |             |             |          |

Weighted Total = (D1 × 0.15) + (D2 × 0.20) + (D3 × 0.15) + (D4 × 0.20) + (D5 × 0.05) + (D6 × 0.10) + (D7 × 0.05) + (D8 × 0.10)
```

**Weight rationale:**
- D2 (Relevance) and D4 (Code Quality) are weighted highest because developer tools live or die by returning the right, usable answer.
- D5 (Multi-Lang) and D7 (Platform) are weighted lower because they are convenience factors, not core functionality.
- Adjust weights if your evaluation priorities differ.

### Step 4: Write the report

Use this structure:

```
1. Executive Summary (1 paragraph: which tool wins and why)
2. Methodology (reference this playbook)
3. Tool Profiles (capabilities of each tool)
4. Test Results by Category (A–E, with scores and commentary)
5. Dimension Comparison (table with per-dimension averages)
6. Strengths & Weaknesses (bullet lists per tool)
7. Recommendations (when to use which tool)
```

---

## Tips for AI Evaluators

- **Be impartial.** Score based on what the tool actually returns, not what you expect or hope.
- **Capture raw output.** Quote actual CLI output in the report — it's evidence.
- **Note failures explicitly.** If a tool errors out or returns no results, that's a score of 1, not "N/A".
- **Time your queries.** Use `time <command>` or note wall-clock duration. Speed matters for developer workflows.
- **Test the two-step tax.** For tools that require library resolution before querying (like ctx7), count that as part of the search convenience score.
- **Watch for deduplication.** If a tool returns 10 results that are essentially the same content with different language pivots, penalize relevance (D2) accordingly.
- **Consider the end user.** A developer wants to go from question to working code as fast as possible. Score accordingly.
