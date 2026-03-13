# Test Case Catalog

This file contains all 20 test cases organized into 5 categories. Each test case specifies the query to run, what a good result looks like, and which scoring dimensions are most relevant.

## How to Use These Test Cases

1. Run every test case on both tools being evaluated
2. For each test, use the tool's most appropriate subcommand (e.g., `search` for conceptual queries, `code-search` for code queries)
3. Score each applicable dimension using the 1–5 scale from SKILL.md
4. Record raw output as evidence

## Category A: Conceptual / Architectural Queries

These test whether the tool can explain "what" and "why" — service overviews, architecture patterns, decision guides.

**Primary dimensions:** D1 (Search Convenience), D2 (Relevance), D3 (Depth), D6 (Coverage)

| ID | Query | What a Good Result Looks Like |
|----|-------|-------------------------------|
| A1 | `Azure Functions triggers and bindings` | Explains triggers vs bindings, gives a table of example scenarios, mentions supported binding types |
| A2 | `Azure App Service deployment slots` | Explains slot swapping, warm-up, traffic routing, when to use slots |
| A3 | `Bicep vs ARM templates` | Compares syntax, tooling, migration path, pros/cons |
| A4 | `Microsoft Entra ID vs Azure AD B2C` | Clarifies naming, use cases for workforce vs consumer identity |
| A5 | `Azure Service Bus vs Event Grid vs Event Hubs` | Differentiates messaging patterns: queue vs pub/sub vs streaming |

### Running Category A

```bash
# Single-step tools (e.g., mslearn)
<tool> search "<query>"

# Two-step tools (e.g., ctx7) — first resolve, then query
<tool> library "<topic>" "<query>"
# Use the returned ID:
<tool> docs <library-id> "<query>"
```

---

## Category B: Code Sample Queries

These test whether the tool returns practical, copy-paste-ready code. Always specify the target language.

**Primary dimensions:** D1 (Search Convenience), D2 (Relevance), D4 (Code Quality), D5 (Multi-Language)

| ID | Query | Language | What a Good Result Looks Like |
|----|-------|----------|-------------------------------|
| B1 | `Azure Functions HTTP trigger` | C# | Complete function class with attributes, DI, request/response handling |
| B2 | `Entity Framework Core migrations` | C# | CLI commands + model class + migration file structure |
| B3 | `Azure Blob Storage upload file` | Python | SDK client setup, authentication, upload call with error handling |
| B4 | `Microsoft Graph API get user profile` | TypeScript | Auth setup, Graph client initialization, API call |
| B5 | `Bicep deploy storage account` | Bicep | Complete `.bicep` file with resource definition, parameters, outputs |

### Running Category B

```bash
# Tools with code-specific search (e.g., mslearn)
<tool> code-search "<query>" --language <lang>

# General-purpose tools
<tool> library "<topic>" "<query>"
<tool> docs <library-id> "<query>"
```

---

## Category C: Troubleshooting / How-To Queries

These test whether the tool helps solve specific problems — error messages, migration guides, configuration issues.

**Primary dimensions:** D2 (Relevance), D3 (Depth), D4 (Code Quality), D8 (Fetch)

| ID | Query | What a Good Result Looks Like |
|----|-------|-------------------------------|
| C1 | `migrate Azure Functions v3 to v4` | Step-by-step migration guide with breaking changes, package updates, code changes |
| C2 | `ASP.NET Core CORS configuration` | Middleware setup, policy configuration, common pitfalls |
| C3 | `Azure Key Vault access from App Service managed identity` | Enable managed identity, grant RBAC, SDK code to read secrets |
| C4 | `EF Core connection string Azure SQL` | Connection string format, where to store it, how to configure in `Program.cs` |
| C5 | `fix Azure DevOps pipeline YAML syntax error` | YAML structure reference, common mistakes, validation approach |

### Running Category C

Same as Category A.

---

## Category D: Niche / Edge-Case Queries

These test coverage boundaries — topics that may not be in every index. Niche queries are especially revealing because they expose whether a tool has broad coverage or only indexes popular topics.

**Primary dimensions:** D2 (Relevance), D3 (Depth), D6 (Coverage)

| ID | Query | What a Good Result Looks Like |
|----|-------|-------------------------------|
| D1 | `Power Automate custom connector authentication` | OAuth setup, custom connector wizard, API key configuration |
| D2 | `Azure Cosmos DB change feed processor` | Lease container, processor setup, scaling, error handling |
| D3 | `MAUI Blazor Hybrid app` | Project structure, platform-specific code, WebView configuration |
| D4 | `Dapr integration with Azure Container Apps` | Sidecar setup, state store, pub/sub component YAML |
| D5 | `Microsoft Teams bot with AI` | Bot Framework + Teams, adaptive cards, AI integration |

### Running Category D

Same as Category A.

---

## Category E: Workflow / Ergonomics Tests

These are not content queries — they evaluate the tool's behavior as a CLI application. Score pass/fail plus notes.

| ID | Test | How to Run | Pass Criteria |
|----|------|-----------|---------------|
| E1 | No-argument behavior | Run the search subcommand with no arguments | Shows helpful usage message, does not crash or throw stack trace |
| E2 | Nonsensical query | `<tool> search "xyzzy foobar blargh"` | Returns empty results gracefully with a clear "no results" message, not an unhandled error |
| E3 | Speed | `time <tool> search "Azure Functions"` | Record wall-clock seconds. Under 5s is good, under 2s is excellent, over 10s is poor |
| E4 | JSON output | `<tool> search "Azure Functions" --json` | Returns valid, parseable JSON. Test with `| python -m json.tool` or `| jq .` |
| E5 | Full document fetch | `<tool> fetch <url>` or `<tool> docs <id> <query>` | Returns full markdown content of an article, not just a snippet |
| E6 | Path handling (Windows) | Run a command with `/`-prefixed arguments in Git Bash | Arguments are not corrupted by MSYS path conversion |

### Running Category E

Run each test on both tools. For E3, run the same query 3 times and take the median to reduce variance from network latency.

---

## Scorecard Template

Copy this table for each tool and fill in scores after running all tests:

```
Tool: _______________

| Test | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | Notes |
|------|----|----|----|----|----|----|----|----|-------|
| A1   |    |    |    |  — |    |    |    |    |       |
| A2   |    |    |    |  — |    |    |    |    |       |
| A3   |    |    |    |  — |    |    |    |    |       |
| A4   |    |    |    |  — |    |    |    |    |       |
| A5   |    |    |    |  — |    |    |    |    |       |
| B1   |    |    |    |    |    |    |    |    |       |
| B2   |    |    |    |    |    |    |    |    |       |
| B3   |    |    |    |    |    |    |    |    |       |
| B4   |    |    |    |    |    |    |    |    |       |
| B5   |    |    |    |    |    |    |    |    |       |
| C1   |    |    |    |    |  — |    |    |    |       |
| C2   |    |    |    |    |  — |    |    |    |       |
| C3   |    |    |    |    |  — |    |    |    |       |
| C4   |    |    |    |    |  — |    |    |    |       |
| C5   |    |    |    |    |  — |    |    |    |       |
| D1   |    |    |    |  — |  — |    |    |    |       |
| D2   |    |    |    |    |  — |    |    |    |       |
| D3   |    |    |    |    |  — |    |    |    |       |
| D4   |    |    |    |  — |  — |    |    |    |       |
| D5   |    |    |    |  — |  — |    |    |    |       |
| Avg  |    |    |    |    |    |    |    |    |       |

D4 is marked "—" for conceptual queries (A1–A5) and niche queries where code
isn't expected (D1, D4, D5) because those tests don't produce code samples.
Similarly D5 is "—" for single-language troubleshooting queries.
Adjust based on what the tool actually returns — if it surprises you with code
on a conceptual query, score it.

Weighted Total = (D1 × 0.15) + (D2 × 0.20) + (D3 × 0.15) + (D4 × 0.20)
              + (D5 × 0.05) + (D6 × 0.10) + (D7 × 0.05) + (D8 × 0.10)
```
