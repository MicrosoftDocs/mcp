# 🌟 Microsoft Docs MCP Server
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)

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

The Microsoft Docs MCP Server is accessible to any IDE, agent, or tool that supports the Model Context Protocol (MCP). Any compatible client can connect directly to the endpoint below:

**Endpoint URL:**
```
https://learn.microsoft.com/api/mcp
```

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
| `microsoft_docs_search` | Performs semantic search against Microsoft official technical documentations | `query` (string): The search query for retrieval |

## 🔌 Installation & Getting Started

The Microsoft Docs MCP Server supports quick installation across multiple development environments. Choose your preferred client below for streamlined setup:

| Client | One-click Installation | Get Started |
|--------|----------------------|-------------------|
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders) | [VS Code MCP Official Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) |
| **Visual Studio** | Manual configuration required | [Visual Studio MCP Official Guide](https://learn.microsoft.com/en-us/visualstudio/ide/mcp-servers?view=vs-2022) |
| **Cursor IDE** | <a href="https://cursor.com/install-mcp?name=microsoft.docs.mcp&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi0vbGVhcm4ubWljcm9zb2Z0LmNvbS9hcGkvbWNwIn0%3D"><img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Add microsoft.docs.mcp MCP server to Cursor" height="32" /></a> | [Cursor MCP Official Guide](https://docs.cursor.com/context/model-context-protocol) |

## ❓ Troubleshooting

### ⚠️ Common Issues

| Issue | Possible Solution |
|-------|-------------------|
| Connection errors | Verify your network connection and that the server URL is correctly entered |
| No results returned | Try rephrasing your query with more specific technical terms |
| Tool not appearing in VS Code | Restart VS Code or check that the MCP extension is properly installed |

### 🆘 Getting Support

For issues with the Microsoft Docs MCP Server:
- Check the [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [Give us feedback](https://github.com/MicrosoftDocs/mcp/issues)

## 🔮 Future Enhancements

The Microsoft Docs MCP Server team is working on several enhancements:

- Expanding coverage to additional Microsoft documentation sources
- Improved query understanding for more precise results

## 📚 Additional Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Microsoft Learn](https://learn.microsoft.com)
