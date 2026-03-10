import { describe, expect, it, vi } from 'vitest';

import { runCli } from '../../src/index.js';
import type { CliContext } from '../../src/context.js';
import type { LearnCliClientLike } from '../../src/mcp/client.js';

function createMockClient(overrides: Partial<LearnCliClientLike> = {}): LearnCliClientLike {
  return {
    searchDocs: vi.fn<LearnCliClientLike['searchDocs']>().mockResolvedValue('{"results":[]}'),
    fetchDocument: vi.fn<LearnCliClientLike['fetchDocument']>().mockResolvedValue(''),
    searchCodeSamples: vi.fn<LearnCliClientLike['searchCodeSamples']>().mockResolvedValue('{"results":[]}'),
    getToolMapping: vi.fn<LearnCliClientLike['getToolMapping']>().mockResolvedValue({
      docsSearch: { name: 'microsoft_docs_search', inputSchema: { type: 'object' } },
      docsFetch: { name: 'microsoft_docs_fetch', inputSchema: { type: 'object' } },
      codeSearch: { name: 'microsoft_code_sample_search', inputSchema: { type: 'object' } },
    }),
    close: vi.fn<LearnCliClientLike['close']>().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createTestContext(client: LearnCliClientLike): {
  context: Partial<CliContext>;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    context: {
      env: {},
      version: '0.1.0-test',
      writeOut: (value) => {
        stdout.push(value);
      },
      writeErr: (value) => {
        stderr.push(value);
      },
      fetchImpl: vi.fn(async () => new Response(null, { status: 405 })) as unknown as typeof fetch,
      createClient: () => client,
    },
    stdout,
    stderr,
  };
}

describe('runCli', () => {
  it('keeps the internal endpoint override out of public help output', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', '--help'], context);

    expect(exitCode).toBe(0);
    expect(stdout.join('')).not.toContain('--endpoint <url>');
  });

  it('returns the raw search payload', async () => {
    const client = createMockClient({
      searchDocs: vi
        .fn()
        .mockResolvedValue(
          '{"results":[{"title":"Azure Functions runtime versions overview","contentUrl":"https://learn.microsoft.com/example","content":"The functionTimeout property in host.json sets the timeout duration."}]}',
        ),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search', 'azure functions timeout'], context);

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.join(''))).toEqual({
      results: [
        {
          title: 'Azure Functions runtime versions overview',
          contentUrl: 'https://learn.microsoft.com/example',
          content: 'The functionTimeout property in host.json sets the timeout duration.',
        },
      ],
    });
  });

  it('filters fetched markdown by section', async () => {
    const client = createMockClient({
      fetchDocument: vi.fn().mockResolvedValue(['# Title', '', '## Usage', 'Use it here.', '', '## Next', 'Done.'].join('\n')),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(
      ['node', 'mslearn', 'fetch', 'https://learn.microsoft.com/example', '--section', 'Usage'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('## Usage');
    expect(stdout.join('')).not.toContain('## Next');
  });

  it('returns a non-zero doctor exit code when required checks fail', async () => {
    const client = createMockClient({
      getToolMapping: vi.fn().mockRejectedValue(new Error('tool mapping failed')),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'doctor', '--format', 'json'], context);

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout.join('')).ok).toBe(false);
  });

  it('returns a usage error for missing required arguments', async () => {
    const client = createMockClient();
    const { context, stderr } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search'], context);

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('missing required argument');
  });
});
