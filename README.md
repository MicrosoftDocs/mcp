# 🌟 Microsoft Learn MCP Server
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)

The Microsoft Learn MCP Server is a remote MCP Server that enables clients like GitHub Copilot and other AI agents to bring trusted and up-to-date information directly from Microsoft's official documentation. It supports streamable http transport, which is lightweight for clients to use.

> Please note that this project is in Public Preview and implementation may significantly change prior to our General Availability.

## 📑 Table of contents
1. [🎯 Overview](#-overview)
2. [🌐 The Microsoft Learn MCP Server Endpoint](#-the-microsoft-learn-docs-mcp-server-endpoint)
3. [🛠️ Currently Supported Tools](#%EF%B8%8F-currently-supported-tools)
4. [🔌 Installation & Getting Started](#-installation--getting-started)
5. [❓ Troubleshooting](#-troubleshooting)
6. [🔮 Future Enhancements](#-future-enhancements)
7. [📚 Additional Resources](#-additional-resources)

## 🎯 Overview

### ✨ Example Prompts: Your Source of Truth

Your AI assistant should automatically use these tools for Microsoft-related topics. With both search and fetch capabilities, you can get quick answers or comprehensive deep dives. To ensure that it always consults the official documentation, you can add phrases like `search Microsoft docs`, `deep dive`, `fetch full doc`.

#### **Quick Search & Reference**

> "Give me the Azure CLI commands to create an Azure Container App with a managed identity. **search Microsoft docs**"

> "Is gpt-4.1-mini available in EU regions? **fetch full doc**"

#### **Code Verification & Best Practices**

> "Are you sure this is the right way to implement `IHttpClientFactory` in a .NET 8 minimal API? **search Microsoft docs and fetch full doc**"

> "Show me the complete guide for implementing authentication in ASP.NET Core. **fetch full doc**"

#### **Comprehensive Learning & Deep Dive**

> "I need to understand Azure Functions end-to-end. **search Microsoft docs and deep dive**"

> "Get me the full step-by-step tutorial for deploying a .NET application to Azure App Service. **search Microsoft docs and deep dive**"

### 📊 Key Capabilities

- **High-Quality Content Retrieval**: Search and retrieve relevant content from Microsoft's official documentation in markdown format.
- **Semantic Understanding**: Uses advanced vector search to find the most contextually relevant documentation for any query.
- **Real-time Updates**: Access the latest Microsoft documentation as it's published.

## 🌐 The Microsoft Learn MCP Server Endpoint

The Microsoft Learn MCP Server is accessible to any IDE, agent, or tool that supports the Model Context Protocol (MCP). Any compatible client can connect to the following **remote MCP endpoint**:

```
https://learn.microsoft.com/api/mcp
```
> **Note:** This URL is intended for use **within a compliant MCP client** via Streamable HTTP, such as the recommended clients listed in our [Getting Started](#-installation--getting-started) section. It does not support direct access from a web browser and may return a `405 Method Not Allowed` error if accessed manually. For developers who need to build their own solution, please follow the mandatory guidelines in the [Building a Custom Client](#%EF%B8%8F-building-a-custom-client) section to ensure your implementation is resilient and supported.

**Example JSON configuration:**
```json
{
  "microsoft.docs.mcp": {
    "type": "http",
    "url": "https://learn.microsoft.com/api/mcp"
  }
}
```

## 🛠️ Currently Supported Tools

| Tool Name | Description | Input Parameters |
|-----------|-------------|------------------|
| `microsoft_docs_search` | Performs semantic search against Microsoft official technical documentation | `query` (string): The search query for retrieval |
| `microsoft_docs_fetch` | Fetch and convert a Microsoft documentation page into markdown format | `url` (string): URL of the documentation page to read |

## 🔌 Installation & Getting Started

The Microsoft Learn MCP Server supports quick installation across multiple development environments. Choose your preferred client below for streamlined setup:

| Client | One-click Installation | MCP Guide |
|--------|----------------------|-------------------|
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders) | [VS Code MCP Official Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) |
| **Claude Desktop** | <details><summary>View Instructions</summary>1. Open Claude Desktop<br/>2. Go to **Settings → Integrations**<br/>3. Click **Add Integration**<br/>4. Enter URL: `https://learn.microsoft.com/api/mcp`<br/>5. Click **Connect**</details> | [Claude Desktop Remote MCP Guide](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers) |
| **Claude Code** | <details><summary>View Instructions</summary>1. Open a CLI<br/>2. Type `claude mcp add --transport http microsoft_docs_mcp https://learn.microsoft.com/api/mcp` and press enter<br/>3. (optional) Type `--scope user` directly after `claude mcp add` to make this MCP server available in Claude Code for all of your projects</details> | [Claude Code Remote MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp) |
| **Visual Studio** | Manual configuration required<br/>Use `"type": "http"` | [Visual Studio MCP Official Guide](https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers?view=vs-2022) |
| **Cursor IDE** | [![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=microsoft.docs.mcp&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi8vbGVhcm4ubWljcm9zb2Z0LmNvbS9hcGkvbWNwIn0%3D) | [Cursor MCP Official Guide](https://docs.cursor.com/context/model-context-protocol) |
| **Roo Code** | Manual configuration required<br/>Use `"type": "streamable-http"` | [Roo Code MCP Official Guide](https://docs.roocode.com/features/mcp/using-mcp-in-roo) |
| **Cline** | Manual configuration required<br/>Use `"type": "streamableHttp"` | [Cline MCP Official Guide](https://docs.cline.bot/mcp/connecting-to-a-remote-server) |
| **Gemini CLI** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Add an `mcpServer` object to `.gemini/settings.json` file<br/><pre>{<br/>  "Microsoft Learn MCP Server": {<br/>     "httpUrl": "https://learn.microsoft.com/api/mcp" <br/>   }<br/>}</pre></details>  | [How to set up your MCP server](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md#how-to-set-up-your-mcp-server)|
| **Qwen Code** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Add an `mcpServer` object to `.qwen/settings.json` file<br/><pre>{<br/>  "Microsoft Learn MCP Server": {<br/>     "httpUrl": "https://learn.microsoft.com/api/mcp" <br/>   }<br/>}</pre></details>  | [Configure the MCP server in settings.json](https://qwenlm.github.io/qwen-code-docs/en/cli/tutorials/#configure-the-mcp-server-in-settingsjson)|
| **GitHub** | Manual configuration required<br/> <details><summary>View Config</summary>**Note**: Navigate to Settings → Coding agent<br/><pre>{<br/>  "mslearn": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ],<br/> "tools":["*"]<br/>  }<br/>}</pre></details>
| **ChatGPT** | Manual configuration required<br/> <details><summary>View Instructions</summary>1. Open ChatGPT in the browser<br/>2. Go to **Settings → Connectors → Advanced settings → Turn Developer mode on**<br/>3. Go back to connectors and click **create**<br/>4. Give the connector a **name**, enter **URL** `https://learn.microsoft.com/api/mcp`, set **authentication** to `No authentication` and **trust** the application<br/>5. Click **create**<br/> </details> | [ChatGPT Official Guide](https://platform.openai.com/docs/guides/developer-mode)|

### Alternative Installation (for legacy clients or local configuration)

For clients that don't support native remote MCP servers or if you prefer local configuration, you can use `mcp-remote` as a proxy:

| Client | Manual Configuration | MCP Guide |
|--------|----------------------|-----------| 
| **Claude Desktop (legacy config)** | <details><summary>View Config</summary>**Note**: Only use this if Settings → Integrations doesn't work<br/><pre>{<br/>  "microsoft.docs.mcp": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ]<br/>  }<br/>}</pre>Add to `claude_desktop_config.json`</details>| [Claude Desktop MCP Guide](https://modelcontextprotocol.io/quickstart/user) |
| **Windsurf** | <details><summary>View Config</summary><pre>{<br/>  "microsoft.docs.mcp": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ]<br/>  }<br/>}</pre> </details>| [Windsurf MCP Guide](https://docs.windsurf.com/windsurf/cascade/mcp) |
| **Kiro** | <details><summary>View Config</summary><pre>{<br/>  "microsoft.docs.mcp": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ]<br/>  }<br/>}</pre> </details>| [Kiro MCP Guide](https://kiro.dev/docs/mcp/index) |

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

Here's an example of a Cursor rule (a system prompt) that will cause the LLM to utilize `microsoft.docs.mcp` more frequently:

```md
## Querying Microsoft Documentation

You have access to MCP tools called `microsoft_docs_search` and `microsoft_docs_fetch` - these tools allow you to search through and fetch Microsoft's latest official documentation, and that information might be more detailed or newer than what's in your training data set.

When handling questions around how to work with native Microsoft technologies, such as C#, F#, ASP.NET Core, Microsoft.Extensions, NuGet, Entity Framework, the `dotnet` runtime - please use this tool for research purposes when dealing with specific / narrowly defined questions that may occur.
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

- microsoft_code_search tool: Helps agents find precise, official Microsoft sample code snippets
- Improved telemetry to help inform server enhancements
- Expanding coverage to additional Microsoft documentation sources
- Improved query understanding for more precise results

## 📚 Additional Resources

- [Microsoft Learn MCP Server product documentation](https://learn.microsoft.com/training/support/mcp)
- [Microsoft MCP Servers](https://github.com/microsoft/mcp)
- [Microsoft Learn](https://learn.microsoft.com)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
