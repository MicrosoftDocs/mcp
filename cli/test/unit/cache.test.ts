import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { createFileLearnSessionCacheStore } from '../../src/mcp/cache.js';
import { createLearnCliClient } from '../../src/mcp/client.js';
import type { ListedTool } from '../../src/mcp/tool-discovery.js';

function createTool(name: string, description: string): ListedTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
    },
  };
}

describe('file session cache store', () => {
  it('writes and reads cached session entries', async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'mslearn-cache-'));
    const cachePath = join(cacheDir, 'cache.json');
    const store = createFileLearnSessionCacheStore({
      cacheFilePath: cachePath,
      now: () => 1_000,
    });

    await store.write({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      sessionId: 'session-1',
      tools: [createTool('microsoft_docs_search', 'Search docs')],
    });

    const cached = await store.read('https://learn.microsoft.com/api/mcp');

    expect(cached?.sessionId).toBe('session-1');
    expect(cached?.tools?.[0]?.name).toBe('microsoft_docs_search');
    expect(JSON.parse(await readFile(cachePath, 'utf8')).entries['https://learn.microsoft.com/api/mcp']).toBeTruthy();
  });

  it('expires stale cached entries', async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'mslearn-cache-'));
    const cachePath = join(cacheDir, 'cache.json');
    const store = createFileLearnSessionCacheStore({
      cacheFilePath: cachePath,
      ttlMs: 100,
      now: () => 1_000,
    });

    await store.write({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      sessionId: 'session-1',
    });

    const expiredStore = createFileLearnSessionCacheStore({
      cacheFilePath: cachePath,
      ttlMs: 100,
      now: () => 1_200,
    });

    await expect(expiredStore.read('https://learn.microsoft.com/api/mcp')).resolves.toBeUndefined();
  });
});

describe('LearnCliClient session reuse', () => {
  it('uses cached session and tool metadata for a direct tools/call fast path', async () => {
    const cacheStore = {
      read: vi.fn(async () => ({
        endpoint: 'https://learn.microsoft.com/api/mcp',
        sessionId: 'cached-session',
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        tools: [
          createTool('microsoft_docs_search', 'Search docs'),
          createTool('microsoft_docs_fetch', 'Fetch docs'),
          createTool('microsoft_code_sample_search', 'Search code samples'),
        ],
      })),
      write: vi.fn(async (value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }) => ({
        endpoint: value.endpoint,
        sessionId: value.sessionId,
        tools: value.tools,
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })),
      clear: vi.fn(async () => undefined),
    };

    const fakeClient = {
      connect: vi.fn<(transport: unknown) => Promise<void>>().mockResolvedValue(undefined),
      listTools: vi.fn(async () => ({
        tools: [],
      })),
      callTool: vi.fn(async () => ({
        content: [
          {
            type: 'text' as const,
            text: '{"results":[]}',
          },
        ],
      })),
    };

    const fetchImpl = vi.fn(async () => {
      const responsePayload = {
        result: {
          content: [
            {
              type: 'text',
              text: '{"results":[]}',
            },
          ],
        },
      };

      return new Response(`event: message\ndata: ${JSON.stringify(responsePayload)}\n\n`, {
        status: 200,
        headers: {
          'content-type': 'text/event-stream',
          'mcp-session-id': 'cached-session',
        },
      });
    });

    const seenSessionIds: Array<string | undefined> = [];
    const client = createLearnCliClient({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      fetchImpl,
      cacheStore,
      createSdkClient: () => fakeClient,
      createTransport: (_endpoint, sessionId) => {
        seenSessionIds.push(sessionId);
        return {
          sessionId: sessionId ?? 'fresh-session',
          close: async () => undefined,
        };
      },
    });

    await client.searchDocs('azure functions timeout');
    await client.close();

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(seenSessionIds).toEqual([]);
    expect(fakeClient.connect).not.toHaveBeenCalled();
    expect(fakeClient.listTools).not.toHaveBeenCalled();
    expect(fakeClient.callTool).not.toHaveBeenCalled();
    expect(cacheStore.clear).not.toHaveBeenCalled();
    expect(cacheStore.write).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://learn.microsoft.com/api/mcp',
        sessionId: 'cached-session',
      }),
    );
  });

  it('falls back to full MCP initialization when the direct fast path is rejected', async () => {
    const tools = [
      createTool('microsoft_docs_search', 'Search docs'),
      createTool('microsoft_docs_fetch', 'Fetch docs'),
      createTool('microsoft_code_sample_search', 'Search code samples'),
    ];
    const cacheStore = {
      read: vi.fn(async () => ({
        endpoint: 'https://learn.microsoft.com/api/mcp',
        sessionId: 'cached-session',
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        tools,
      })),
      write: vi.fn(async (value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }) => ({
        endpoint: value.endpoint,
        sessionId: value.sessionId,
        tools: value.tools,
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })),
      clear: vi.fn(async () => undefined),
    };

    const fakeClient = {
      connect: vi.fn<(transport: unknown) => Promise<void>>().mockResolvedValue(undefined),
      listTools: vi.fn(async () => ({
        tools,
      })),
      callTool: vi.fn(async () => ({
        content: [
          {
            type: 'text' as const,
            text: '{"results":[]}',
          },
        ],
      })),
    };

    const fetchImpl = vi.fn(async () => {
      const errorPayload = {
        error: {
          message: 'invalid session',
        },
      };

      return new Response(`event: message\ndata: ${JSON.stringify(errorPayload)}\n\n`, {
        status: 400,
        headers: {
          'content-type': 'text/event-stream',
        },
      });
    });

    const client = createLearnCliClient({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      fetchImpl,
      cacheStore,
      createSdkClient: () => fakeClient,
      createTransport: () => ({
        sessionId: 'fresh-session',
        close: async () => undefined,
      }),
    });

    await client.searchDocs('azure functions timeout');
    await client.close();

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(cacheStore.clear).toHaveBeenCalledOnce();
    expect(fakeClient.connect).toHaveBeenCalledOnce();
    expect(fakeClient.callTool).toHaveBeenCalledOnce();
  });

  it('refreshes tools without clearing the cached session when the direct fast path hits a tool mismatch', async () => {
    const tools = [
      createTool('microsoft_docs_search', 'Search docs'),
      createTool('microsoft_docs_fetch', 'Fetch docs'),
      createTool('microsoft_code_sample_search', 'Search code samples'),
    ];
    const cacheStore = {
      read: vi.fn(async () => ({
        endpoint: 'https://learn.microsoft.com/api/mcp',
        sessionId: 'cached-session',
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        tools,
      })),
      write: vi.fn(async (value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }) => ({
        endpoint: value.endpoint,
        sessionId: value.sessionId,
        tools: value.tools,
        updatedAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })),
      clear: vi.fn(async () => undefined),
    };

    const fakeClient = {
      connect: vi.fn<(transport: unknown) => Promise<void>>().mockResolvedValue(undefined),
      listTools: vi.fn(async () => ({
        tools,
      })),
      callTool: vi.fn(async () => ({
        content: [
          {
            type: 'text' as const,
            text: '{"results":[{"title":"updated"}]}',
          },
        ],
      })),
    };

    const fetchImpl = vi.fn(async () => {
      const errorPayload = {
        error: {
          message: 'tool not found',
        },
      };

      return new Response(`event: message\ndata: ${JSON.stringify(errorPayload)}\n\n`, {
        status: 404,
        headers: {
          'content-type': 'text/event-stream',
          'mcp-session-id': 'cached-session',
        },
      });
    });

    const seenSessionIds: Array<string | undefined> = [];
    const client = createLearnCliClient({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      fetchImpl,
      cacheStore,
      createSdkClient: () => fakeClient,
      createTransport: (_endpoint, sessionId) => {
        seenSessionIds.push(sessionId);
        return {
          sessionId: sessionId ?? 'fresh-session',
          close: async () => undefined,
        };
      },
    });

    await client.searchDocs('azure functions timeout');
    await client.close();

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(cacheStore.clear).not.toHaveBeenCalled();
    expect(fakeClient.connect).toHaveBeenCalledOnce();
    expect(fakeClient.listTools).toHaveBeenCalledOnce();
    expect(fakeClient.callTool).toHaveBeenCalledOnce();
    expect(seenSessionIds).toEqual(['cached-session']);
  });

  it('falls back to text content when toolResult is present but undefined', async () => {
    const tools = [
      createTool('microsoft_docs_search', 'Search docs'),
      createTool('microsoft_docs_fetch', 'Fetch docs'),
      createTool('microsoft_code_sample_search', 'Search code samples'),
    ];

    const client = createLearnCliClient({
      endpoint: 'https://learn.microsoft.com/api/mcp',
      cacheStore: {
        read: vi.fn(async () => undefined),
        write: vi.fn(async (value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }) => ({
          endpoint: value.endpoint,
          sessionId: value.sessionId,
          tools: value.tools,
          updatedAt: new Date(0).toISOString(),
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })),
        clear: vi.fn(async () => undefined),
      },
      createSdkClient: () => ({
        connect: vi.fn<(transport: unknown) => Promise<void>>().mockResolvedValue(undefined),
        listTools: vi.fn(async () => ({
          tools,
        })),
        callTool: vi.fn(async () => ({
          toolResult: undefined,
          content: [
            {
              type: 'text' as const,
              text: 'fallback text',
            },
          ],
        })),
      }),
      createTransport: () => ({
        sessionId: 'fresh-session',
        close: async () => undefined,
      }),
    });

    await expect(client.searchDocs('azure functions timeout')).resolves.toBe('fallback text');
    await client.close();
  });
});
