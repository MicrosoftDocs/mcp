---
name: get-mslearn-docs
description: >
  Use this skill when you need documentation from Microsoft Learn before writing
  code — for example, "use Azure Functions", "configure Cosmos DB", "set up App
  Service", or any time the user asks you to work with a Microsoft technology
  and you need current reference material. Fetch the docs with mslearn before
  answering, rather than relying on training knowledge.
---

# Get Microsoft Learn Docs via mslearn

When you need documentation for a Microsoft technology, fetch it with the

`mslearn` CLI rather than guessing from training data. This gives you the

current, correct content straight from Microsoft Learn.

## Step 1 — Search for the right doc

```bash

mslearn search "<microsoft product or topic>"

```

Review the search results to find the most relevant document `contentUrl`. If nothing matches, try a broader term.

Pick the best-matching `id` from the results (e.g. `openai/chat`, `anthropic/sdk`,
`stripe/api`). If nothing matches, try a broader term.

## Step 2 — Fetch the doc

```bash

mslearn fetch <contentUrl>

```

To fetch only a specific section (saves tokens):


```bash

mslearn fetch "<contentUrl>" --section "<section name>"

```



To limit output length:



```bash

mslearn fetch "<contentUrl>" --max-chars 3000

```

## Step 3 — Use the docs

Read the fetched content and use it to write accurate code or answer the question.

Do not rely on memorized API shapes — use what the docs say.

## Step 4 — Search for code samples

If you need working code examples, search the official Microsoft code samples:



```bash

mslearn code-search "<microsoft product or topic>"

```



To filter by programming language:



```bash

mslearn code-search "<microsoft product or topic>" --language <programming language>

```

## Step 5 — Annotate what you learned

**ALWAYS perform this step before finishing.** Review what you learned and ask yourself:

1. Did the docs contain any surprising behavior, version-specific caveats, or
   non-obvious prerequisites?
2. Did you find that the docs were misleading, incomplete, or required combining
   multiple pages to get a working answer?
3. Is there project-specific context (e.g., "we use .NET 8, not 6") that would
   help future sessions?

If ANY of the above apply, save an annotation:

```bash
mslearn annotate "<contentUrl>" "<note text>"
```

Annotations are local, persist across sessions, and are keyed by URL. Keep notes
concise and actionable. Don't repeat what's already in the doc.

If none apply, explicitly state: "No annotation needed — docs were
straightforward."

To view an existing annotation:

```bash
mslearn annotate "<contentUrl>"
```

## Step 6 — Review and manage annotations

List all saved annotations:



```bash

mslearn annotate --list

```



Remove an annotation that is no longer relevant:



```bash

mslearn annotate "<contentUrl>" --clear

```

## Quick reference

| Goal | Command |

|------|---------|

| Search docs | `mslearn search "<microsoft product or topic>"` |

| Fetch a doc | `mslearn fetch "<contentUrl>"` |

| Fetch one section | `mslearn fetch "<contentUrl>" --section "<section name>"` |

| Limit output size | `mslearn fetch "<contentUrl>" --max-chars 3000` |

| Search code samples | `mslearn code-search "<microsoft product or topic>"` |

| Filter by language | `mslearn code-search "<microsoft product or topic>" --language <programming language>` |

| Save a note | `mslearn annotate "<contentUrl>" "<note text>"` |

| View a note | `mslearn annotate "<contentUrl>"` |

| List all notes | `mslearn annotate --list` |

| Remove a note | `mslearn annotate "<contentUrl>" --clear` |

| Check connectivity | `mslearn doctor` |

| Check (JSON output) | `mslearn doctor --format json` |



## Notes

- All docs are fetched from the Microsoft Learn MCP server at `https://learn.microsoft.com/api/mcp`
- The `<contentUrl>` argument must be a valid Microsoft Learn URL
- Use `--section` with `fetch` to reduce token usage when you only need part of a page
- Use `mslearn doctor` to verify that your environment and connectivity are working
- Override the endpoint with `MSLEARN_ENDPOINT` env var or `--endpoint <url>` flag



