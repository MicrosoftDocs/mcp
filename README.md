# 🌟 Microsoft Learn MCP Server
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Learn_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft-learn&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D)
[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Learn_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft-learn&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)

> **Stop AI Hallucinations.** Give your AI assistant (Claude, Cursor, Copilot, Codex, ...) direct access to the latest official Microsoft documentation.
>
> **✨ Free. One-click install. No key needed.**

## 🎯 Why install this?

Stop relying on outdated training data or risky web searches. Learn MCP server provides secure, direct access to Microsoft official docs.

* 🧠 **Eliminate Hallucinations.**
  Stop your AI from inventing non-existent Azure SDK methods or hallucinating library packages. Get code that actually compiles.

* 🔌 **Plug & Play (No Auth).**
  No API keys, no logins, no sign-ups required. Just one-click install and start coding immediately.

* 🛡️ **100% Trusted & Safe.**
  Protect your supply chain. Unlike generic web searches that may scrape insecure blogs or malicious sites, this tool **only** accesses official 1st-party Microsoft documentation.

* 💸 **Completely Free.** High search capacity tailored for seamless, heavy coding sessions.

### ✨ Example Prompts: Your Source of Truth

Your AI assistant should automatically use these tools for Microsoft-related topics. With both search and fetch capabilities, you can get quick answers or comprehensive deep dives. To ensure that it always consults the official documentation, you can add phrases like `search Microsoft Learn`, `deep dive`, `fetch full doc`.

#### **Quick Search & Reference**

> "Give me the Azure CLI commands to create an Azure Container App with a managed identity. **search Microsoft Learn**"

> "Is gpt-4.1-mini available in EU regions? **fetch full doc**"

#### **Code Verification & Best Practices**

> "Are you sure this is the right way to implement `IHttpClientFactory` in a .NET 8 minimal API? **search Microsoft Learn and fetch full doc**"

> "Show me the complete guide for implementing authentication in ASP.NET Core. **fetch full doc**"

> "show me detailed, runnable python code sample to do harms eval using azure ai foundry evaluation sdk"

#### **Comprehensive Learning & Deep Dive**

> "I need to understand Azure Functions end-to-end. **search Microsoft Learn and deep dive**"

> "Get me the full step-by-step tutorial for deploying a .NET application to Azure App Service. **search Microsoft Learn and deep dive**"

### 📊 Key Capabilities

- **High-Quality Content Retrieval**: Search and retrieve relevant content from Microsoft's official documentation in markdown format.
- **Code Sample Discovery**: Find official Microsoft/Azure code snippets and examples with language-specific filtering.
- **Semantic Understanding**: Uses advanced vector search to find the most contextually relevant documentation for any query.
- **Real-time Updates**: Access the latest Microsoft documentation as it's published.

## 🌐 The Microsoft Learn MCP Server Endpoint

The Microsoft Learn MCP Server is accessible to any IDE, agent, or tool that supports the Model Context Protocol (MCP). Any compatible client can connect to the following **remote MCP endpoint**:

```
https://learn.microsoft.com/api/mcp
```
> **Note:** This URL is intended for use **within a compliant MCP client** via Streamable HTTP, such as the recommended clients listed in our [Getting Started](#-installation--getting-started) section. It does not support direct access from a web browser and may return a `405 Method Not Allowed` error if accessed manually. For developers who need to build their own solution, please follow the mandatory guidelines in the [Building a Custom Client](#%EF%B8%8F-building-a-custom-client) section to ensure your implementation is resilient and supported.

**Standard config** works in most clients:
```json
{
  "servers": {
    "microsoft-learn": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp"
    }
  }
}
```

**OpenAI-compatible endpoint** [supports OpenAI Deep Research models](https://platform.openai.com/docs/mcp): use `https://learn.microsoft.com/api/mcp/openai-compatible`.

## 🛠️ Currently Supported Tools

| Tool Name | Description | Input Parameters |
|-----------|-------------|------------------|
| `microsoft_docs_search` | Performs semantic search against Microsoft official technical documentation | `query` (string): The search query for retrieval |
| `microsoft_docs_fetch` | Fetch and convert a Microsoft documentation page into markdown format | `url` (string): URL of the documentation page to read |
| `microsoft_code_sample_search` | Search for official Microsoft/Azure code snippets and examples | `query` (string): Search query for Microsoft/Azure code snippets<br/>`language` (string, optional): Programming language filter.|

## 🤖 Agent Skills

[Agent Skills](https://agentskills.io/) are portable instruction packages that help AI agents use tools more effectively. We provide two skills that guide agents on when and how to use the Microsoft Learn MCP tools:

| Skill | Purpose | Best For |
|-------|---------|----------|
| [`microsoft-docs`](skills/microsoft-docs/SKILL.md) | Understanding concepts, tutorials, architecture, limits | "How does X work?", learning, configuration guides |
| [`microsoft-code-reference`](skills/microsoft-code-reference/SKILL.md) | API lookups, code samples, verification, error fixing | Implementing code, finding correct methods, troubleshooting |

### Quick Setup

If you use Claude Code, run the following commands and restart Claude Code:
```bash
/plugin marketplace add microsoftdocs/mcp
/plugin install microsoft-docs@microsoft-docs-marketplace
```
Otherwise:
1. **Install the MCP Server first** — See [Installation](#-installation--getting-started) below
2. **Copy the skill folders** to your project's `.github/skills/` or `.claude/skills/` directory:
   - [`microsoft-docs`](skills/microsoft-docs/) — for concepts, tutorials, and factual lookups
   - [`microsoft-code-reference`](skills/microsoft-code-reference/) — for API lookups, code samples, and troubleshooting

### Supported Agents

Agent Skills work across multiple AI agents:
- **VS Code** (Insiders) — enable `chat.useAgentSkills` setting
- **GitHub Copilot CLI** & **Copilot coding agent**
- **Claude Code**, **Cursor**, **OpenAI Codex**, and [more](https://agentskills.io/)

### Which Skill Do I Need?

| If you want to... | Install |
|-------------------|---------|
| Cover all Microsoft docs scenarios | Both skills |
| Focus on coding (APIs, samples, errors) | `microsoft-code-reference` only |
| Focus on facts & concepts (limits, config, tutorials) | `microsoft-docs` only |


## 🔌 Installation & Getting Started

The Microsoft Learn MCP Server supports quick installation across multiple development environments. Choose your preferred client below for streamlined setup:

| Client | One-click Installation | MCP Guide |
|--------|----------------------|-------------------|
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/Install_in-VS_Code-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft-learn&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) <br/> or search "@mcp learn" in Extensions to show "Microsoft Learn" MCP | [VS Code MCP Official Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) |
| **Claude Desktop** | Follow "Add custom connector" instructions in official guide. | [Claude Desktop Remote MCP Guide](https://modelcontextprotocol.io/docs/develop/connect-remote-servers) |
| **Claude Code** | Install via plugin marketplace (includes MCP server + skills) - see [Quick Setup](#-agent-skills) | [Claude Code Remote MCP Guide](https://code.claude.com/docs/en/mcp) |
| **Visual Studio** | Upgrade to latest VS 2022 or 2026, "Microsoft Learn" MCP is already built-in | [Visual Studio MCP Official Guide](https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers?view=vs-2022) |
| **Cursor IDE** | [![Install in Cursor](https://img.shields.io/badge/Install_in-Cursor-000000?style=flat-square&logoColor=white)](https://cursor.com/en/install-mcp?name=microsoft-learn&config=eyJuYW1lIjoibWljcm9zb2Z0LWxlYXJuIiwidHlwZSI6Imh0dHAiLCJ1cmwiOiJodHRwczovL2xlYXJuLm1pY3Jvc29mdC5jb20vYXBpL21jcCJ9) | [Cursor MCP Official Guide](https://docs.cursor.com/context/model-context-protocol) |
| **Codex** | `codex mcp add "microsoft-learn" --url "https://learn.microsoft.com/api/mcp"`| [Codex MCP documentation](https://github.com/openai/codex/blob/main/codex-rs/config.md#mcp_servers) |
| **Roo Code** | Open [Roo Code Marketplace](https://docs.roocode.com/features/marketplace), search for `Microsoft Learn`, and click `Install` | [Roo Code MCP Official Guide](https://docs.roocode.com/features/mcp/using-mcp-in-roo) |
| **Cline** | Manual configuration required<br/>Use `"type": "streamableHttp"` | [Cline MCP Official Guide](https://docs.cline.bot/mcp/connecting-to-a-remote-server) |
| **Gemini CLI** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Add an `mcpServer` object to `.gemini/settings.json` file<br/><pre>{<br/>  "Microsoft Learn MCP Server": {<br/>     "httpUrl": "https://learn.microsoft.com/api/mcp" <br/>   }<br/>}</pre></details>  | [How to set up your MCP server](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md#how-to-set-up-your-mcp-server)|
| **Qwen Code** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Add an `mcpServer` object to `.qwen/settings.json` file<br/><pre>{<br/>  "Microsoft Learn MCP Server": {<br/>     "httpUrl": "https://learn.microsoft.com/api/mcp" <br/>   }<br/>}</pre></details>  | [Configure the MCP server in settings.json](https://qwenlm.github.io/qwen-code-docs/en/cli/tutorials/#configure-the-mcp-server-in-settingsjson)|
| **GitHub** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Navigate to Settings → Coding agent<br/><pre>{<br/>  "mslearn": {<br/>    "type": "http",<br/>    "url": "https://learn.microsoft.com/api/mcp",<br/>    "tools": [<br/>      "*"<br/>    ]<br/>  }<br/>}</pre></details> |
| **ChatGPT** | Manual configuration required<br/> <details><summary>View Instructions</summary>1. Open ChatGPT in the browser<br/>2. Go to **Settings → Connectors → Advanced settings → Turn Developer mode on**<br/>3. Go back to connectors and click **create**<br/>4. Give the connector a **name**, enter **URL** `https://learn.microsoft.com/api/mcp`, set **authentication** to `No authentication` and **trust** the application<br/>5. Click **create**<br/> </details> | [ChatGPT Official Guide](https://platform.openai.com/docs/guides/developer-mode)|
| **Windsurf** | Manual configuration required<br/> <details><summary>View Config</summary><pre>{<br/>  "mcpServers": {<br/>    "microsoft-learn": {<br/>      "serverUrl": "https://learn.microsoft.com/api/mcp"<br/>    }<br/>  }<br/>}</pre></details>| [Windsurf MCP Guide](https://docs.windsurf.com/windsurf/cascade/mcp) |
| **Kiro** | <details><summary>View Config</summary><pre>{<br/>  "microsoft-learn": {<br/>    "url": "https://learn.microsoft.com/api/mcp"<br/>    }<br/>}</pre> </details>| [Kiro MCP Guide](https://kiro.dev/docs/mcp/index) |


### ▶️ Getting Started

1. **For VS Code**: Open GitHub Copilot in VS Code and [switch to Agent mode](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode)
2. **For Claude Desktop**: After adding the integration, you'll see the MCP tools icon in the chat interface
3. You should see the Learn MCP Server in the list of available tools
4. Try a prompt that tells the agent to use the MCP Server, such as "what are the az cli commands to create an Azure container app according to official Microsoft Learn documentation?"
5. The agent should be able to use the MCP Server tools to complete your query

> ### ⚠️ Building a Custom Client
>
> If your use case requires a direct, programmatic integration, it is essential to understand that MCP is a **dynamic protocol, not a static API**. The available tools and their schemas will evolve.
>
> To build a resilient client that will not break as the service is updated, you should adhere to the following principles:
>
> 1.  **Discover Tools Dynamically:** Your client should fetch current tool definitions from the server at runtime (e.g., using `tools/list`). **Do not hard-code tool names or parameters.**
> 2.  **Refresh on Failure:** Your client should handle errors during `tool/invoke` calls. If a tool call fails with an error indicating it is missing or its schema has changed (e.g., an HTTP 404 or 400 error), your client should assume its cache is stale and automatically trigger a refresh by calling `tools/list`.
> 3.  **Handle Live Updates:** Your client should listen for server notifications (e.g., `listChanged`) and refresh its tool cache accordingly.

## ❓ Troubleshooting

### 💻 System Prompt

Even tool-friendly models like Claude Sonnet 4 sometimes fail to call MCP tools by default; use system prompts to encourage usage.

Here's an example of a Cursor rule (a system prompt) that will cause the LLM to utilize `microsoft-learn` more frequently:

```md
## Querying Microsoft Documentation

You have access to MCP tools called `microsoft_docs_search`, `microsoft_docs_fetch`, and `microsoft_code_sample_search` - these tools allow you to search through and fetch Microsoft's latest official documentation and code samples, and that information might be more detailed or newer than what's in your training data set.

When handling questions around how to work with native Microsoft technologies, such as C#, F#, ASP.NET Core, Microsoft.Extensions, NuGet, Entity Framework, the `dotnet` runtime - please use these tools for research purposes when dealing with specific / narrowly defined questions that may occur.
```

### ⚠️ Common Issues

| Issue | Possible Solution |
|-------|-------------------|
| Connection errors | Verify your network connection and that the server URL is correctly entered |
| No results returned | Try rephrasing your query with more specific technical terms |
| Tool not appearing in VS Code | Restart VS Code or check that the MCP extension is properly installed |
| HTTP status 405  | Method not allowed happens when a browser tries to connect to the endpoint. Try using the MCP Server through VS Code GitHub Copilot or [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) instead. |

### 🆘 Getting Support

- [Ask questions, share ideas](https://github.com/MicrosoftDocs/mcp/discussions)
- [Create an issue](https://github.com/MicrosoftDocs/mcp/issues)

## 🔮 Future Enhancements

The Microsoft Learn MCP Server team is working on several enhancements:

- Improved telemetry to help inform server enhancements
- Expanding coverage to additional Microsoft documentation sources
- Improved query understanding for more precise results

## 📚 Additional Resources

- [Microsoft Learn MCP Server product documentation](https://learn.microsoft.com/training/support/mcp)
- [Microsoft MCP Servers](https://github.com/microsoft/mcp)
- [Microsoft Learn](https://learn.microsoft.com)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
