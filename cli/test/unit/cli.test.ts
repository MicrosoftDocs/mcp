import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runCli } from '../../src/index.js';
import type { CliContext } from '../../src/context.js';
import type { LearnCliClientLike } from '../../src/mcp/client.js';
import { createFileAnnotationStore } from '../../src/utils/annotations.js';

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
  const annotationsDir = mkdtempSync(join(tmpdir(), 'mslearn-test-annotations-'));

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
      createClient: () => client,
      createAnnotationStore: () => createFileAnnotationStore({ annotationsDir }),
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

  it('formats search results with one result per block', async () => {
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
    const output = stdout.join('');
    expect(output).toContain('[1] Azure Functions runtime versions overview');
    expect(output).toContain('https://learn.microsoft.com/example');
    expect(output).toContain('The functionTimeout property in host.json sets the timeout duration.');
  });

  it('outputs raw JSON from search when --json is passed', async () => {
    const rawPayload =
      '{"results":[{"title":"Test","contentUrl":"https://learn.microsoft.com/example","content":"Body."}]}';
    const client = createMockClient({
      searchDocs: vi.fn().mockResolvedValue(rawPayload),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search', 'test query', '--json'], context);

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.join(''))).toEqual(JSON.parse(rawPayload));
  });

  it('outputs raw JSON from code-search when --json is passed', async () => {
    const rawPayload =
      '{"results":[{"description":"desc","codeSnippet":"x = 1","link":"https://example.com","language":"python"}]}';
    const client = createMockClient({
      searchCodeSamples: vi.fn().mockResolvedValue(rawPayload),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'code-search', 'test query', '--json'], context);

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.join(''))).toEqual(JSON.parse(rawPayload));
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

  it('forces a fresh connection check in doctor instead of using cached tool mappings', async () => {
    const getToolMapping = vi.fn<LearnCliClientLike['getToolMapping']>().mockResolvedValue({
      docsSearch: { name: 'microsoft_docs_search', inputSchema: { type: 'object' } },
      docsFetch: { name: 'microsoft_docs_fetch', inputSchema: { type: 'object' } },
      codeSearch: { name: 'microsoft_code_sample_search', inputSchema: { type: 'object' } },
    });
    const client = createMockClient({ getToolMapping });
    const { context } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'doctor'], context);

    expect(exitCode).toBe(0);
    expect(getToolMapping).toHaveBeenCalledWith(true);
  });

  it('returns a usage error for missing required arguments', async () => {
    const client = createMockClient();
    const { context, stderr } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search'], context);

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('missing required argument');
  });
});

describe('annotate command', () => {
  it('saves and retrieves an annotation for a URL', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/', 'Needs raw body for webhooks'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('Annotation saved for');
    expect(stdout.join('')).toContain('https://learn.microsoft.com/en-us/azure/functions/');
  });

  it('reads an existing annotation when no note is provided', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/', 'Webhook note'],
      context,
    );
    stdout.length = 0;

    const exitCode = await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('Webhook note');
  });

  it('shows a message for a non-existent annotation', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/nonexistent'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('No annotation for');
  });

  it('clears an existing annotation with --clear', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/', 'temp note'],
      context,
    );
    stdout.length = 0;

    const exitCode = await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/', '--clear'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('Annotation cleared for');
  });

  it('reports when --clear targets a non-existent annotation', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/nonexistent', '--clear'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('No annotation found for');
  });

  it('lists all annotations with --list', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/functions/', 'functions note'],
      context,
    );
    await runCli(
      ['node', 'mslearn', 'annotate', 'https://learn.microsoft.com/en-us/azure/storage/', 'storage note'],
      context,
    );
    stdout.length = 0;

    const exitCode = await runCli(['node', 'mslearn', 'annotate', '--list'], context);

    expect(exitCode).toBe(0);
    const output = stdout.join('');
    expect(output).toContain('functions note');
    expect(output).toContain('storage note');
  });

  it('shows a message when --list finds no annotations', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'annotate', '--list'], context);

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('No annotations.');
  });

  it('returns a usage error when no URL is provided without --list', async () => {
    const client = createMockClient();
    const { context, stderr } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'annotate'], context);

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('Missing required argument');
  });
});
