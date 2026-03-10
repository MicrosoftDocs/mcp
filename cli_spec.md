## Microsoft Learn Companion CLI — v0.1 implementation spec

### 1. Product position

Build a **thin companion CLI** for the Microsoft Learn MCP server, not a second retrieval backend.

The CLI should:

- connect to the public Learn MCP endpoint over Streamable HTTP
- discover tools dynamically at runtime
- pass through the current Learn tool payloads with only minimal CLI-side text handling
- make common agent and terminal workflows easier without inventing an extra output contract

The CLI should **not**:

- reimplement search/fetch logic outside MCP
- hard-code tool schemas as a long-term contract
- invent metadata that the backend does not actually provide

### 2. Language and runtime

Use **TypeScript on Node.js**.

- support **Node 22+**
- test on the current active LTS line in CI
- publish as an npm package with a `bin` entry

This remains the best v0.1 choice because the CLI is mostly transport, normalization, formatting, and argument parsing.

### 3. Naming

Use:

- **npm package:** `@microsoft/learn-cli`
- **executable:** `mslearn`

Do **not** use `learn`, which is too generic and likely to collide with other tools.

### 4. Scope

#### v0.1 commands

Only expose the current Learn MCP capabilities plus CLI utility commands:

- `mslearn search "<query>"`
- `mslearn fetch <url>`
- `mslearn code-search "<query>"`
- `mslearn doctor`
- `mslearn --help`
- `mslearn --version`

#### v0.1 non-goals

These are explicitly out of scope for the first implementation:

- offline caching
- auth flows
- persistent local result history
- interactive TUI mode
- server-side stable document IDs
- adding new retrieval capabilities beyond the existing Learn MCP tools

### 5. Configuration

The CLI should target the public Learn MCP endpoint by default:

```text
https://learn.microsoft.com/api/mcp
```

Support these overrides:

- `--endpoint <url>` on every command
- `MSLEARN_ENDPOINT` environment variable

Optional runtime knobs are allowed if useful for implementation, but the CLI must work with no configuration in the default case.

### 6. CLI behavior contract

#### Global behavior

- write command results to `stdout`
- write diagnostics, warnings, and failures to `stderr`
- emit no ANSI color by default
- exit with:
  - `0` on success
  - `2` on usage or validation errors
  - `1` on operational failures

#### `mslearn search`

Example:

```bash
mslearn search "azure functions timeout"
```

Required behavior:

- return the raw payload text produced by the Learn docs search tool
- do not normalize or reshape the search response
- do not introduce CLI-specific formatting modes for search results

#### `mslearn fetch`

Example:

```bash
mslearn fetch "https://learn.microsoft.com/azure/azure-functions/functions-versions#function-app-timeout-duration"
```

Required behavior:

- accept a **documentation URL**
- output the raw fetched article content from the Learn fetch tool
- support:
  - `--section "<heading>"`
  - `--max-chars <n>`

Behavior notes:

- The current Learn fetch tool accepts URLs, not search-result IDs
- `--section` should extract the named heading from fetched markdown and fail clearly if the heading is not present
- `--max-chars` should truncate the final rendered output deterministically

#### `mslearn code-search`

Example:

```bash
mslearn code-search "cosmos db change feed processor c#" --language csharp
```

Required behavior:

- support optional `--language <name>`
- return the raw payload text produced by the Learn code search tool
- do not normalize or reshape the code search response
- do not introduce CLI-specific formatting modes for code search results

#### `mslearn doctor`

`doctor` should verify and report:

- Node.js runtime version
- configured endpoint
- endpoint reachability
- MCP client connection success
- dynamic tool discovery success
- required local command mapping for:
  - docs search
  - docs fetch
  - code sample search

Supported formats:

- default: `text`
- also support `json`

### 7. Internal architecture

The CLI should behave like a real MCP client, not a hard-coded REST wrapper.

Requirements:

- connect via Streamable HTTP to the configured endpoint
- persist a per-endpoint session/tool cache with a 24-hour expiration window
- perform `tools/list` discovery before executing a command
- map discovered tools to stable local commands by inspecting tool names and descriptions
- cache discovered tool definitions for the current process
- on a warm start, reuse the cached session ID and cached tool mapping as an optimistic fast path before falling back to fresh discovery
- when the cache is valid, the CLI may directly issue `tools/call` over HTTP with the cached session instead of paying full MCP initialization overhead first
- if a tool invocation fails because the tool is missing or the schema appears stale, refresh tool definitions and retry once
- if the cached session is rejected, clear the persisted session entry, reconnect, and continue with the cached mapping or refreshed tool list as needed
- support tool-list refresh cleanly if the server signals changes or if the client reconnects

Implementation note:

- The CLI may maintain an internal, local mapping such as `search -> discovered docs search tool`, but users should never need to know the remote tool names

### 8. Output behavior

- `search` should print the raw docs-search payload text returned by Learn
- `code-search` should print the raw code-search payload text returned by Learn
- `fetch` should preserve the fetched markdown as closely as practical after optional section filtering and truncation
- `doctor` may render either plain text or JSON because it is CLI-generated diagnostics, not passthrough Learn content

### 9. Error handling

Do not silently swallow backend or parsing failures.

Required behaviors:

- invalid flags or missing required arguments should return exit code `2`
- failed endpoint connection or MCP handshake should return exit code `1`
- unknown command mappings should report which expected capability could not be found
- `fetch --section` with a missing heading should return exit code `1` and a clear error message
- malformed MCP payloads should return exit code `1` and identify the failing command

### 10. Repo layout

The repository should include the CLI implementation directly:

```text
/cli
  /src
    /commands
      search.ts
      fetch.ts
      code-search.ts
      doctor.ts
    /mcp
      client.ts
      cache.ts
      tool-discovery.ts
    /utils
      contracts.ts
      errors.ts
      markdown.ts
      options.ts
      text.ts
    index.ts
    context.ts
  /test
    /unit
  package.json
  package-lock.json
  tsconfig.json
  README.md
```

The root repository documentation should also mention that the companion CLI lives in `/cli`.

### 11. Local development workflow

From the `cli/` directory:

```bash
npm install
npm run build
npm test
npm link
mslearn --help
```

Before publishing, verify the packed artifact:

```bash
npm pack
npm install -g ./microsoft-learn-cli-<version>.tgz
mslearn doctor
mslearn search "azure functions timeout"
```

### 12. Testing strategy

Use three layers of testing.

#### A. Deterministic CLI contract tests

Test:

- argument parsing
- stdout formatting
- stderr formatting
- exit codes
- `--help`
- `--version`
- invalid args
- JSON validity
- `fetch --section`
- retry-on-refresh behavior

#### B. Integration-oriented MCP client tests

Use mocked or fake MCP interactions to verify:

- tool discovery
- tool mapping
- stale-schema refresh
- missing-tool failures
- malformed payload handling

#### C. Manual end-to-end smoke test

Run against the public Learn MCP endpoint for:

- `doctor`
- one docs search
- one fetch
- one code search

### 13. Release gate

Before calling v0.1 complete:

- CLI build passes
- CLI tests pass
- existing repository validation passes
- the packed npm artifact runs locally
- the CLI succeeds against the public endpoint for the core commands

### 14. One-sentence decision

**Ship a TypeScript/Node companion CLI inside this repository, keep it as a thin dynamic MCP adapter over the public Learn endpoint, and validate it with deterministic CLI tests plus live smoke checks.**
