# 🌟 Microsoft Docs MCP Server
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)

The Microsoft Docs MCP Server implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides AI assistants with real-time access to official [Microsoft documentation](https://learn.microsoft.com).

> Please note that this project is in Public Preview and implementation may significantly change prior to our General Availability.

## 📑 Table of contents
1. [🎯 Overview](#-overview)
2. [🌐 The Microsoft Docs MCP Server Endpoint](#-the-microsoft-docs-mcp-server-endpoint)
3. [🛠️ Currently Supported Tools](#%EF%B8%8F-currently-supported-tools)
4. [🔌 Installation & Getting Started](#-installation--getting-started)
5. [❓ Troubleshooting](#-troubleshooting)
6. [🔮 Future Enhancements](#-future-enhancements)
7. [📚 Additional Resources](#-additional-resources)

## 🎯 Overview

### ✨ What is the Microsoft Docs MCP Server?

The Microsoft Docs MCP Server is a cloud-hosted service that enables MCP hosts like GitHub Copilot and Cursor to search and retrieve accurate information directly from Microsoft's official documentation. By implementing the standardized Model Context Protocol (MCP), this service allows any compatible AI system to ground its responses in authoritative Microsoft content.

### 📊 Key Capabilities

- **High-Quality Content Retrieval**: Search and retrieve relevant content from Microsoft Learn, Azure documentation, Microsoft 365 documentation, and other official Microsoft sources.
- **Semantic Understanding**: Uses advanced vector search to find the most contextually relevant documentation for any query.
- **Optimized Chunking**: Returns up to 10 high-quality content chunks (each max 500 tokens), with article titles, URLs, and self-contained content excerpts.
- **Real-time Updates**: Access the latest Microsoft documentation as it's published.

## 🌐 The Microsoft Docs MCP Server Endpoint

The Microsoft Docs MCP Server is accessible to any IDE, agent, or tool that supports the Model Context Protocol (MCP). Any compatible client can connect to the following **remote MCP endpoint**:

```
https://learn.microsoft.com/api/mcp
```
> **Note:** This endpoint is designed for programmatic access by MCP clients via Streamable HTTP. It does not support direct access from a web browser and may return a `405 Method Not Allowed` error if accessed manually.

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

## 🔌 Installation & Getting Started

The Microsoft Docs MCP Server supports quick installation across multiple development environments. Choose your preferred client below for streamlined setup:

| Client | One-click Installation | MCP Guide |
|--------|----------------------|-------------------|
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders) | [VS Code MCP Official Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) |
| **Visual Studio** | Manual configuration required<br/>Use `"type": "http"` | [Visual Studio MCP Official Guide](https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers?view=vs-2022) |
| **Cursor IDE** | [![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=microsoft.docs.mcp&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi8vbGVhcm4ubWljcm9zb2Z0LmNvbS9hcGkvbWNwIn0%3D) | [Cursor MCP Official Guide](https://docs.cursor.com/context/model-context-protocol) |
| **Roo Code** | Manual configuration required<br/>Use `"type": "streamable-http"` | [Roo Code MCP Guide](https://docs.roocode.com/features/mcp/using-mcp-in-roo) |

### Alternative Installation (for clients without Streamable HTTP support)

Some clients don't support `Streamable HTTP`, so you can use `mcp-remote` as a workaround:

| Client | Manual Configuration | MCP Guide |
|--------|----------------------|-----------| 
| **Claude Desktop** | <details><summary>View Config</summary><pre>{<br/>  "microsoft.docs.mcp": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ]<br/>  }<br/>}</pre> </details>| [Claude Desktop MCP Guide](https://modelcontextprotocol.io/quickstart/user) |
| **Windsurf** | <details><summary>View Config</summary><pre>{<br/>  "microsoft.docs.mcp": {<br/>    "command": "npx",<br/>    "args": [<br/>      "-y",<br/>      "mcp-remote",<br/>      "https://learn.microsoft.com/api/mcp"<br/>    ]<br/>  }<br/>}</pre> </details>| [Windsurf MCP Guide](https://docs.windsurf.com/windsurf/cascade/mcp) |


### ▶️ Getting Started
1. Open GitHub Copilot in VS Code and [switch to Agent mode](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode)
2. You should see the Docs MCP Server in the list of tools
3. Try a prompt that tells the agent to use the Docs MCP Server, such as "what are the az cli commands to create an Azure container app according to official Microsoft Learn documentation?"
4. The agent should be able to use the Docs MCP Server tools to complete your query

## ❓ Troubleshooting

### ⚠️ Common Issues

| Issue | Possible Solution |
|-------|-------------------|
| Connection errors | Verify your network connection and that the server URL is correctly entered |
| No results returned | Try rephrasing your query with more specific technical terms |
| Tool not appearing in VS Code | Restart VS Code or check that the MCP extension is properly installed |
| HTTP status 405  | Method not allowed happens when a browser tries to connect to the endpoint. Try using the Docs MCP Server through VS Code GitHub Copilot or [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) instead. |

### 🆘 Getting Support

- [Ask questions, share ideas](https://github.com/MicrosoftDocs/mcp/discussions)
- [Create an issue](https://github.com/MicrosoftDocs/mcp/issues)

## 🔮 Future Enhancements

The Microsoft Docs MCP Server team is working on several enhancements:

- Expanding coverage to additional Microsoft documentation sources
- Improved query understanding for more precise results

## 📚 Additional Resources

- [Microsoft MCP Servers](https://github.com/microsoft/mcp)
- [Microsoft Learn](https://learn.microsoft.com)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
