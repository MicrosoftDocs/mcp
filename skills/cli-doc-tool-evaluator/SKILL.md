---
name: cli-doc-tool-evaluator
description: Evaluate and compare CLI documentation tools by running structured test cases, scoring on multiple dimensions, and generating a comparison report. Use when comparing any two doc-lookup CLIs (like mslearn vs ctx7) for developer knowledge retrieval quality. Covers search convenience, relevance, depth, code quality, multi-language support, coverage, platform compatibility, and deep-dive capability. Use this skill whenever the user wants to benchmark, compare, or evaluate documentation CLI tools, even if they don't use the word "evaluate" — phrases like "which doc tool is better", "test these CLIs", or "compare mslearn and ctx7" should trigger this skill.
context: fork
---

# CLI Documentation Tool Evaluator

Conduct a rigorous, structured comparison of two CLI tools that retrieve developer documentation. Run categorized test cases, score results on 8 dimensions, and produce a quantitative report with weighted totals and recommendations.

## Overview

This skill walks you through a complete evaluation:
1. **Discover** each tool's capabilities via `--help`
2. **Run** 20 test cases across 5 categories
3. **Score** each result on 8 dimensions (1–5 scale)
4. **Calculate** weighted totals
5. **Generate** a structured comparison report

The full test case catalog and scoring rubrics are in [test-cases.md](references/test-cases.md).

## Step 1: Discover Tool Capabilities

Before running any test, understand what each tool can do. Run `--help` on the tool itself and every subcommand. Document for each tool:

- Available subcommands and their purpose
- Required vs optional arguments
- Output format options (plain text, JSON, markdown)
- Any flags for filtering (e.g., `--language`, `--section`)

This step matters because the evaluation must use each tool optimally — comparing a tool's worst usage to another tool's best would produce misleading results.

### If a Tool Can't Be Executed

Sometimes a tool is installed but can't run — sandbox restrictions, missing dependencies, permission issues. When this happens, don't just give up and score everything 1. Try these fallbacks in order:

1. **Alternative invocation**: Try `npx <package-name>`, the full path (e.g., `~/.npm/bin/<tool>`), or a different shell (`cmd /c <tool> --help`, `powershell -c "<tool> --help"`)
2. **Alternative help commands**: Some tools respond to `<tool> help`, `<tool> -h`, or `<tool> --version` even when `--help` fails
3. **Look for local docs**: Check if the tool has a README, man page, or package.json with a description (`npm info <package>` or `pip show <package>`)
4. **Document the failure**: If nothing works, record exactly what you tried, the error messages, and score D7 (Platform Compatibility) accordingly. But still attempt to run actual test queries — sometimes `--help` fails but the tool's core commands work fine

The discovery step is critical. If you skip it or can't complete it for one tool, the comparison will be lopsided. Make a genuine effort to get both tools running before moving on.

### Platform Check

If running on Windows with Git Bash, test whether `/`-prefixed arguments get silently rewritten to Windows paths. If so, note it and use `MSYS_NO_PATHCONV=1` as a workaround. This itself is a finding for the Platform Compatibility dimension (D7).

## Step 2: Run Test Cases

See [test-cases.md](references/test-cases.md) for the full catalog of 20 test cases across 5 categories. Read that file before proceeding.

For each test case in categories A–D:

1. Run the query on **both** tools using the tool's optimal command
2. Capture the full output — either quote it in notes or pipe to a file
3. Score each applicable dimension (D1–D8) using the rubric below
4. Note any failures, errors, platform quirks, or surprising results

For category E (ergonomics), run each test and record pass/fail plus notes.

### Execution Tips

- **Parallelize when possible.** Categories A–D are independent of each other. If you can run multiple queries at once, do so to save time.
- **Use `time` for timing.** Wrap commands in `time` to capture wall-clock duration for the Speed tests (E3).
- **Pipe to files for evidence.** Use `> output.txt 2>&1` to capture output you can quote in the report.
- **Test the happy path first.** Run each tool's most natural command for the query before trying alternative approaches.

## Step 3: Score

### Scoring Scale

| Score | Meaning |
|-------|---------|
| 1 | Fails or returns nothing useful |
| 2 | Partially works — results are poor, misleading, or require significant extra work |
| 3 | Adequate — relevant content but with notable gaps or friction |
| 4 | Good — accurate, relevant, usable content |
| 5 | Excellent — comprehensive, well-structured, immediately actionable |

### The 8 Dimensions

| ID | Dimension | What to Evaluate |
|----|-----------|------------------|
| D1 | **Search Convenience** | Steps from question to usable content. One command = high score. Two-step resolution = lower. |
| D2 | **Result Relevance** | Top results directly answer the query. Penalize noise, duplicates, off-topic results. |
| D3 | **Content Depth** | Enough context to understand and act — explanations, prerequisites, caveats, not just titles. |
| D4 | **Code Sample Quality** | Complete, runnable, annotated, up-to-date code. Covers relevant versions and frameworks. |
| D5 | **Multi-Language Support** | Returns results for multiple languages when the topic is polyglot (C#, Python, JS, etc.). |
| D6 | **Coverage Breadth** | Covers the full range of technologies in scope (for Microsoft: Azure, .NET, M365, Bicep, Power Platform, etc.). |
| D7 | **Platform Compatibility** | Works across shells (bash, PowerShell, cmd) and OS platforms without workarounds. |
| D8 | **Fetch / Deep-Dive** | Can retrieve a full document when a search result is truncated or promising. |

### Scoring Rules

- **Not every dimension applies to every test case.** Only score dimensions that the test case can meaningfully evaluate. For instance, a conceptual query (Category A) may not produce code samples, so skip D4 for that test.
- **Score what the tool returns, not what you know.** Be impartial — if a tool returns wrong information confidently, that's a 1 or 2, not a pass.
- **Distinguish tool failures from content failures.** If a tool runs but returns no useful results, score it 1. If a tool *can't run at all* due to environment issues (sandbox, permissions, missing runtime), score D7 (Platform Compatibility) as 1 and note the blocker — but don't score content dimensions (D2, D3, D4) since you have no evidence either way. Mark those as "untestable" in your scorecard and exclude them from averages. This prevents a temporary environment issue from distorting the comparison.
- **Deduplication matters.** If 10 results are essentially the same content repeated for different language variants, penalize D2 (Relevance).
- **The two-step tax is real.** Tools requiring library resolution before querying should score lower on D1 than single-step tools, because developer time has value.

## Step 4: Calculate Weighted Totals

After scoring all test cases, calculate per-dimension averages for each tool, then compute a weighted total:

```
Weighted Total = (D1 × 0.15) + (D2 × 0.20) + (D3 × 0.15) + (D4 × 0.20)
              + (D5 × 0.05) + (D6 × 0.10) + (D7 × 0.05) + (D8 × 0.10)
```

**Why these weights:**
- D2 (Relevance) and D4 (Code Quality) at 0.20 each — a doc tool lives or dies by returning the right, usable answer
- D1 (Search Convenience) and D3 (Content Depth) at 0.15 each — important for developer velocity
- D6 (Coverage) and D8 (Fetch) at 0.10 each — coverage gaps and lack of deep-dive hurt but are not deal-breakers
- D5 (Multi-Lang) and D7 (Platform) at 0.05 each — convenience factors, not core functionality

If your evaluation priorities differ (e.g., platform compatibility is critical for your team), adjust the weights and document why.

## Step 5: Generate the Report

Use this exact structure for your final report:

```
# CLI Documentation Tool Evaluation Report

## 1. Executive Summary
One paragraph: which tool wins, by how much, and the single most important reason.

## 2. Methodology
Reference this skill/playbook. State how many test cases ran, on what platform, and any deviations.

## 3. Tool Profiles
Table for each tool: source, subcommands, query model, output formats, auth requirements.

## 4. Test Results by Category
For each category (A–E):
- Table of scores per test case per dimension
- Commentary on notable results, failures, or surprises
- Raw CLI output quotes as evidence

## 5. Dimension Comparison
Side-by-side table of per-dimension averages and weighted totals.

## 6. Strengths & Weaknesses
Bullet list for each tool — what it does well, what it does poorly.

## 7. Recommendations
Table: use case → recommended tool. Cover at least 5 common scenarios.
```

## Impartiality Guidelines

These matter because the whole point of a structured evaluation is to produce trustworthy results.

- **Score what the tool actually returns.** Do not score based on what you expect, hope, or know from training data.
- **Quote raw output.** Every score should have evidence — the actual CLI output that earned it.
- **Acknowledge your own limitations.** If you can't run a tool (platform issue, auth required), say so rather than guessing.
- **Test each tool at its best.** Use the optimal subcommand and flags. Don't compare Tool A's best against Tool B's worst.
- **Note when dimensions don't apply.** Skip scoring rather than giving a default 3.
- **Consider the end user.** A developer wants to go from question → working code as fast as possible. That's the lens for every score.
