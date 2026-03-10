import { describe, expect, it } from 'vitest';

import { discoverLearnTools, type ListedTool } from '../../src/mcp/tool-discovery.js';

function createTool(name: string, description: string): ListedTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
    },
  };
}

describe('discoverLearnTools', () => {
  it('maps the expected Learn tools by exact name', () => {
    const tools = [
      createTool('microsoft_docs_search', 'Search docs.'),
      createTool('microsoft_docs_fetch', 'Fetch docs.'),
      createTool('microsoft_code_sample_search', 'Search code samples.'),
    ];

    const discovered = discoverLearnTools(tools);

    expect(discovered.docsSearch.name).toBe('microsoft_docs_search');
    expect(discovered.docsFetch.name).toBe('microsoft_docs_fetch');
    expect(discovered.codeSearch.name).toBe('microsoft_code_sample_search');
  });

  it('falls back to descriptions when names do not exactly match', () => {
    const tools = [
      createTool('search-docs', 'Search official Microsoft documentation.'),
      createTool('fetch-docs', 'Fetch full documentation page content.'),
      createTool('search-code', 'Search code samples and snippets.'),
    ];

    const discovered = discoverLearnTools(tools);

    expect(discovered.docsSearch.name).toBe('search-docs');
    expect(discovered.docsFetch.name).toBe('fetch-docs');
    expect(discovered.codeSearch.name).toBe('search-code');
  });
});
