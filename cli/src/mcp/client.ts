import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

import type { ReachabilityReport, ToolKind } from '../utils/contracts.js';
import { OperationError } from '../utils/errors.js';
import { createFileLearnSessionCacheStore, type LearnSessionCacheStore } from './cache.js';
import { discoverLearnTools, type DiscoveredLearnTools, type ListedTool } from './tool-discovery.js';

export interface LearnClientOptions {
  endpoint: string;
  clientName?: string;
  clientVersion?: string;
  fetchImpl?: typeof fetch;
  cacheStore?: LearnSessionCacheStore;
  createSdkClient?: () => SdkClientLike;
  createTransport?: (endpoint: URL, sessionId?: string) => TransportLike;
}

export interface LearnCliClientLike {
  searchDocs(query: string): Promise<string>;
  fetchDocument(url: string): Promise<string>;
  searchCodeSamples(query: string, language?: string): Promise<string>;
  getToolMapping(forceRefresh?: boolean): Promise<DiscoveredLearnTools>;
  close(): Promise<void>;
}

export function createLearnCliClient(options: LearnClientOptions): LearnCliClientLike {
  return new LearnCliClient(options);
}

type ToolCallResult = Awaited<ReturnType<Client['callTool']>>;
type ToolErrorAction = 'none' | 'refresh-tools' | 'reset-session';

interface SdkClientLike {
  connect(transport: unknown): Promise<void>;
  listTools(params?: { cursor?: string }): Promise<ListToolsResult>;
  callTool(params: { name: string; arguments: Record<string, unknown> }): Promise<ToolCallResult>;
}

interface TransportLike {
  readonly sessionId?: string;
  close(): Promise<void>;
}

export async function probeEndpoint(endpoint: string, fetchImpl: typeof fetch): Promise<ReachabilityReport> {
  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      redirect: 'manual',
    });

    return {
      ok: true,
      status: response.status,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

class LearnCliClient implements LearnCliClientLike {
  private readonly client: SdkClientLike;
  private readonly endpoint: URL;
  private readonly cacheStore: LearnSessionCacheStore;
  private readonly fetchImpl: typeof fetch;
  private transport?: TransportLike;
  private cachedTools?: ListedTool[];
  private discoveredTools?: DiscoveredLearnTools;
  private cachedSessionId?: string;
  private hasLoadedPersistentCache = false;

  constructor(private readonly options: LearnClientOptions) {
    this.endpoint = new URL(options.endpoint);
    this.cacheStore = options.cacheStore ?? createFileLearnSessionCacheStore();
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.client = options.createSdkClient?.() ?? this.createDefaultSdkClient();
  }

  async close(): Promise<void> {
    if (!this.transport) {
      return;
    }

    await this.transport.close();
    this.transport = undefined;
  }

  async getToolMapping(forceRefresh = false): Promise<DiscoveredLearnTools> {
    await this.loadPersistentCache();

    if (!forceRefresh && this.cachedTools && this.discoveredTools) {
      return this.discoveredTools;
    }

    await this.ensureConnected();

    if (forceRefresh || !this.cachedTools || !this.discoveredTools) {
      this.cachedTools = await this.listAllTools();
      this.discoveredTools = discoverLearnTools(this.cachedTools);
      await this.persistCache();
    }

    return this.discoveredTools;
  }

  async searchDocs(query: string): Promise<string> {
    const result = await this.callMappedTool('docsSearch', { query });
    return readToolText(result, 'search');
  }

  async fetchDocument(url: string): Promise<string> {
    const result = await this.callMappedTool('docsFetch', { url });
    return readToolText(result, 'fetch');
  }

  async searchCodeSamples(query: string, language?: string): Promise<string> {
    const argumentsPayload = language ? { query, language } : { query };
    const result = await this.callMappedTool('codeSearch', argumentsPayload);
    return readToolText(result, 'code-search');
  }

  private async ensureConnected(): Promise<void> {
    await this.loadPersistentCache();

    if (this.transport) {
      return;
    }

    const attemptedSessionId = this.cachedSessionId;
    const transport = this.createTransport(attemptedSessionId);

    try {
      await this.client.connect(transport);
      this.transport = transport;
      this.cachedSessionId = transport.sessionId ?? attemptedSessionId;
      await this.persistCache();
    } catch (error) {
      await closeTransportQuietly(transport);

      if (attemptedSessionId && classifyToolError(error) === 'reset-session') {
        this.cachedSessionId = undefined;
        await this.cacheStore.clear(this.endpoint.toString());
        return this.ensureConnected();
      }

      throw new OperationError('Failed to connect to the Learn MCP endpoint.', { cause: error });
    }
  }

  private async listAllTools(): Promise<ListedTool[]> {
    const tools: ListedTool[] = [];
    let cursor: string | undefined;

    do {
      const page: ListToolsResult = await this.client.listTools(cursor ? { cursor } : undefined);
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);

    return tools;
  }

  private async callMappedTool(kind: ToolKind, args: Record<string, unknown>): Promise<ToolCallResult> {
    const mapping = await this.getToolMapping();

    if (!this.transport && this.cachedSessionId && this.discoveredTools) {
      const directResult = await this.tryDirectToolCall(kind, mapping[kind].name, args);
      if (directResult) {
        return directResult;
      }
    }

    return this.callMappedToolWithSdk(kind, args);
  }

  private async tryDirectToolCall(
    kind: ToolKind,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult | undefined> {
    try {
      return await this.callMappedToolDirectly(toolName, args);
    } catch (error) {
      const action = classifyToolError(error);

      if (action === 'reset-session') {
        await this.resetConnection(true);
        return undefined;
      }

      if (action === 'refresh-tools') {
        await this.clearToolCache();
        return undefined;
      }

      throw new OperationError(`Failed to invoke the ${kind} Learn MCP tool directly.`, { cause: error });
    }
  }

  private async callMappedToolWithSdk(kind: ToolKind, args: Record<string, unknown>): Promise<ToolCallResult> {
    await this.ensureConnected();
    let currentMapping = await this.getToolMapping();

    try {
      return await this.invokeToolWithSdk(currentMapping[kind].name, args);
    } catch (firstError) {
      const action = classifyToolError(firstError);
      if (action === 'none') {
        throw new OperationError(`Failed to invoke the ${kind} Learn MCP tool.`, { cause: firstError });
      }

      if (action === 'reset-session') {
        await this.resetConnection(true);
        await this.ensureConnected();
        currentMapping = await this.getToolMapping();
      } else {
        await this.clearToolCache();
        currentMapping = await this.getToolMapping(true);
      }

      try {
        return await this.invokeToolWithSdk(currentMapping[kind].name, args);
      } catch (retryError) {
        throw new OperationError(`Failed to invoke the ${kind} Learn MCP tool after recovery.`, { cause: retryError });
      }
    }
  }

  private async callMappedToolDirectly(toolName: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    const sessionId = this.cachedSessionId;
    if (!sessionId) {
      throw new OperationError('Direct tool call requires a cached Learn MCP session.');
    }

    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    const responseSessionId = response.headers.get('mcp-session-id') ?? sessionId;
    const message = await parseDirectCallResponse(response);
    this.cachedSessionId = responseSessionId;
    await this.persistCache();
    return message;
  }

  private async invokeToolWithSdk(toolName: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    return this.client.callTool({ name: toolName, arguments: args });
  }

  private createDefaultSdkClient(): SdkClientLike {
    return new Client(
      {
        name: this.options.clientName ?? 'mslearn',
        version: this.options.clientVersion ?? '0.1.0',
      },
      {
        capabilities: {},
        listChanged: {
          tools: {
            onChanged: (error, tools) => {
              if (error || !tools) {
                this.cachedTools = undefined;
                this.discoveredTools = undefined;
                return;
              }

              try {
                this.cachedTools = [...tools];
                this.discoveredTools = discoverLearnTools(this.cachedTools);
              } catch {
                this.cachedTools = [...tools];
                this.discoveredTools = undefined;
              }
            },
          },
        },
      },
    );
  }

  private createTransport(sessionId?: string): TransportLike {
    if (this.options.createTransport) {
      return this.options.createTransport(this.endpoint, sessionId);
    }

    return new StreamableHTTPClientTransport(this.endpoint, sessionId ? { sessionId } : undefined);
  }

  private async loadPersistentCache(): Promise<void> {
    if (this.hasLoadedPersistentCache) {
      return;
    }

    const cachedValue = await this.cacheStore.read(this.endpoint.toString());
    this.hasLoadedPersistentCache = true;

    if (!cachedValue) {
      return;
    }

    this.cachedSessionId = cachedValue.sessionId;

    if (!cachedValue.tools || cachedValue.tools.length === 0) {
      return;
    }

    this.cachedTools = [...cachedValue.tools];

    try {
      this.discoveredTools = discoverLearnTools(this.cachedTools);
    } catch {
      this.discoveredTools = undefined;
    }
  }

  private async persistCache(): Promise<void> {
    const sessionId = this.transport?.sessionId ?? this.cachedSessionId;
    if (!sessionId && !this.cachedTools) {
      return;
    }

    await this.cacheStore.write({
      endpoint: this.endpoint.toString(),
      sessionId,
      tools: this.cachedTools,
    });
  }

  private async clearToolCache(): Promise<void> {
    this.cachedTools = undefined;
    this.discoveredTools = undefined;
    await this.persistCache();
  }

  private async resetConnection(clearPersistentSession: boolean): Promise<void> {
    if (this.transport) {
      await closeTransportQuietly(this.transport);
      this.transport = undefined;
    }

    if (!clearPersistentSession) {
      return;
    }

    this.cachedSessionId = undefined;
    this.cachedTools = undefined;
    this.discoveredTools = undefined;
    await this.cacheStore.clear(this.endpoint.toString());
  }
}

function readToolText(result: ToolCallResult, context: string): string {
  if (result.isError) {
    throw new OperationError(`The ${context} tool reported an error.`);
  }

  if ('toolResult' in result) {
    return JSON.stringify(result.toolResult);
  }

  if ('structuredContent' in result && result.structuredContent && Object.keys(result.structuredContent).length > 0) {
    return JSON.stringify(result.structuredContent);
  }

  const text = result.content
    .filter((item): item is { type: 'text'; text: string } => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new OperationError(`The ${context} tool did not return any text content.`);
  }

  return text;
}

function classifyToolError(error: unknown): ToolErrorAction {
  if (!(error instanceof Error)) {
    return 'none';
  }

  const message = error.message.toLowerCase();
  if (
    message.includes('invalid session') ||
    message.includes('session') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return 'reset-session';
  }

  if (
    message.includes('tool') ||
    message.includes('schema') ||
    message.includes('404') ||
    message.includes('400') ||
    message.includes('not found') ||
    message.includes('invalid params')
  ) {
    return 'refresh-tools';
  }

  return 'none';
}

async function closeTransportQuietly(transport: TransportLike): Promise<void> {
  try {
    await transport.close();
  } catch {
    // Connection teardown is best-effort; closing failures should not mask the original error.
  }
}


async function parseDirectCallResponse(response: Response): Promise<ToolCallResult> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const bodyText = await response.text();
  const message = contentType.includes('text/event-stream')
    ? parseSseJsonRpcPayload(bodyText)
    : parseJsonRpcPayload(bodyText);

  if (!response.ok) {
    throw new OperationError(readJsonRpcErrorMessage(message, `HTTP ${response.status}`));
  }

  if (!message || typeof message !== 'object') {
    throw new OperationError('Direct Learn MCP call returned an unexpected payload.');
  }

  if ('error' in message && message.error) {
    throw new OperationError(readJsonRpcErrorMessage(message));
  }

  if (!('result' in message) || !message.result) {
    throw new OperationError('Direct Learn MCP call did not include a tool result.');
  }

  return message.result as ToolCallResult;
}

function parseSseJsonRpcPayload(bodyText: string): JsonRpcResponsePayload {
  const events = bodyText
    .split(/\r?\n\r?\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  for (const event of events) {
    const dataLines = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length === 0) {
      continue;
    }

    return parseJsonRpcPayload(dataLines.join('\n'));
  }

  throw new OperationError('Direct Learn MCP call returned an empty SSE response.');
}

function parseJsonRpcPayload(bodyText: string): JsonRpcResponsePayload {
  try {
    return JSON.parse(bodyText) as JsonRpcResponsePayload;
  } catch (error) {
    throw new OperationError('Failed to parse direct Learn MCP response payload.', { cause: error });
  }
}

function readJsonRpcErrorMessage(message: JsonRpcResponsePayload | undefined, fallback = 'Direct Learn MCP call failed.'): string {
  if (message && typeof message === 'object' && 'error' in message && message.error && typeof message.error === 'object') {
    const maybeError = message.error as { message?: unknown };
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }

  return fallback;
}

type JsonRpcResponsePayload =
  | {
      result?: ToolCallResult;
      error?: {
        message?: string;
      };
    }
  | undefined;
