# 🌟 Microsoft Docs MCP Server
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)

The Microsoft Docs MCP Server implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides AI assistants with real-time access to official [Microsoft documentation](https://learn.microsoft.com).

> Please note that this project is in Public Preview and implementation may significantly change prior to our General Availability.

## 📑 Table of contents
1. [🎯 Overview](#-overview)
2. [🛠️ Currently Supported Tools](#%EF%B8%8F-currently-supported-tools)
3. [🔌 Installation & Getting Started](#-installation--getting-started)
4. [❓ Troubleshooting](#-troubleshooting)
5. [🔮 Future Enhancements](#-future-enhancements)
6. [📚 Additional Resources](#-additional-resources)

## 🎯 Overview

### ✨ What is the Microsoft Docs MCP Server?

The Microsoft Docs MCP Server is a cloud-hosted service that enables MCP hosts like GitHub Copilot and Cursor to search and retrieve accurate information directly from Microsoft's official documentation. By implementing the standardized Model Context Protocol (MCP), this service allows any compatible AI system to ground its responses in authoritative Microsoft content.

### 📊 Key Capabilities

- **High-Quality Content Retrieval**: Search and retrieve relevant content from Microsoft Learn, Azure documentation, Microsoft 365 documentation, and other official Microsoft sources.
- **Semantic Understanding**: Uses advanced vector search to find the most contextually relevant documentation for any query.
- **Optimized Chunking**: Returns up to 10 high-quality content chunks (each max 500 tokens), with article titles, URLs, and self-contained content excerpts.
- **Real-time Updates**: Access the latest Microsoft documentation as it's published.

## 🛠️ Currently Supported Tools

| Tool Name | Description | Input Parameters |
|-----------|-------------|------------------|
| `microsoft_docs_search` | Performs semantic search against Microsoft official technical documentations | `query` (string): The search query for retrieval |

## 🔌 Installation & Getting Started

### ⚡ Prerequisites

1. Install VS Code (either version):
   * [Stable release](https://code.visualstudio.com/download)
   * [Insiders release](https://code.visualstudio.com/insiders)
2. Open VS Code in any workspace

### 🚀 Installation Options

#### ✨ One-Click Installation

For the fastest setup, click one of these buttons to automatically install the Microsoft Docs MCP Server:

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Docs_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Microsoft_Docs_MCP-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=microsoft.docs.mcp&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D&quality=insiders)
Just one click, and you're ready to go! 🎉

You might get prompted to open the link with VS Code and then select "Install Server".
Once you've installed the Microsoft Docs MCP Server, make sure you select GitHub Copilot Agent Mode and refresh the tools list. To learn more about Agent Mode, visit the [VS Code Documentation](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode).

#### 🔧 Manual Installation

For a step-by-step installation, follow these instructions:

1. Open VS Code's command palette by pressing `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac)

2. Type `MCP: Add Server...` and select it when it appears in the dropdown

3. Next select `HTTP (server-sent events)`

![img](docs/images/mcp01.png)

4. Enter the server URL: `https://learn.microsoft.com/api/mcp`

![img](docs/images/mcp02.png)

5. Provide a local name for the server (default or custom).

6. Choose Workspace as the save location.

![img](docs/images/mcp03.png)

7. A file named `mcp.json` will be created in the `.vscode` folder:
```
{
  "servers": {
    "microsoft.docs.mcp": {
        "type": "http",
        "url": "https://learn.microsoft.com/api/mcp"
    }
  }
}
```

8. If successful, you should be connected to the MCP server and see 1 tool available.

![img](docs/images/mcp04.png)

### 📝 Getting Started

1. Open VS Code and [switch to Agent mode](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode).

2. Verify that the Microsoft Docs MCP Server (`microsoft.docs.mcp`) appears in the list of tools.

3. Test the server by prompting the agent with a query, e.g., "How to create an app service in Azure portal using microsoft docs?"

4. The agent should use the Microsoft Docs MCP Server to retrieve relevant documentation.

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
- Want to integrate the Learn MCP server with another product or service? [Contact us here](https://forms.office.com/r/MUHdB9CNx5)

## 🔮 Future Enhancements

The Microsoft Docs MCP Server team is working on several enhancements:

- Expanding coverage to additional Microsoft documentation sources
- Improved query understanding for more precise results
- Client info tracking and throtlling

## 📚 Additional Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Microsoft Learn](https://learn.microsoft.com)
