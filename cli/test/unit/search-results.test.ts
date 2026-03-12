import { describe, expect, it } from 'vitest';

import { formatSearchResults, formatCodeSearchResults } from '../../src/formatters/search-results.js';

describe('formatSearchResults', () => {
  it('formats a single result with title, url, and content', () => {
    const payload = JSON.stringify({
      results: [
        {
          title: 'Azure Functions overview',
          contentUrl: 'https://learn.microsoft.com/example',
          content: 'Overview of Azure Functions.',
        },
      ],
    });

    const output = formatSearchResults(payload);

    expect(output).toBe(
      [
        '[1] Azure Functions overview',
        '    https://learn.microsoft.com/example',
        '',
        'Overview of Azure Functions.',
      ].join('\n'),
    );
  });

  it('formats multiple results separated by blank lines', () => {
    const payload = JSON.stringify({
      results: [
        {
          title: 'First',
          contentUrl: 'https://example.com/1',
          content: 'Content one.',
        },
        {
          title: 'Second',
          contentUrl: 'https://example.com/2',
          content: 'Content two.',
        },
      ],
    });

    const output = formatSearchResults(payload);

    expect(output).toContain('[1] First');
    expect(output).toContain('[2] Second');
    expect(output).toContain('\n\n[2]');
  });

  it('preserves multi-line content without adding indentation', () => {
    const payload = JSON.stringify({
      results: [
        {
          title: 'Multi-line',
          contentUrl: 'https://example.com/ml',
          content: 'Line one.\nLine two.\nLine three.',
        },
      ],
    });

    const output = formatSearchResults(payload);

    expect(output).toContain('\n\nLine one.\nLine two.\nLine three.');
  });

  it('pretty-prints JSON when results array is empty', () => {
    const payload = '{"results":[]}';

    const output = formatSearchResults(payload);

    expect(output).toBe(JSON.stringify({ results: [] }, null, 2));
  });

  it('returns raw text when payload is not valid JSON', () => {
    const payload = 'This is plain text from the server.';

    const output = formatSearchResults(payload);

    expect(output).toBe(payload);
  });

  it('falls back to Result N when title is missing', () => {
    const payload = JSON.stringify({
      results: [{ contentUrl: 'https://example.com/no-title', content: 'Some content.' }],
    });

    const output = formatSearchResults(payload);

    expect(output).toContain('[1] Result 1');
  });

  it('handles a top-level array of results', () => {
    const payload = JSON.stringify([
      { title: 'Direct array item', url: 'https://example.com/arr', content: 'Inline.' },
    ]);

    const output = formatSearchResults(payload);

    expect(output).toContain('[1] Direct array item');
    expect(output).toContain('https://example.com/arr');
  });

  it('uses url field when contentUrl is absent', () => {
    const payload = JSON.stringify({
      results: [{ title: 'Fallback URL', url: 'https://example.com/fallback', content: 'Body.' }],
    });

    const output = formatSearchResults(payload);

    expect(output).toContain('https://example.com/fallback');
  });

  it('uses description field as title fallback', () => {
    const payload = JSON.stringify({
      results: [{ description: 'A description used as title', content: 'Body.' }],
    });

    const output = formatSearchResults(payload);

    expect(output).toContain('[1] A description used as title');
  });
});

describe('formatCodeSearchResults', () => {
  it('cleans embedded metadata from the description field', () => {
    const payload = JSON.stringify({
      results: [
        {
          description:
            'description: Creates a BlobServiceClient using SAS token.\npackage: azure-storage-blob\nlanguage: python\n',
          link: 'https://learn.microsoft.com/azure/example',
          language: 'python',
          codeSnippet: 'from azure.storage.blob import BlobServiceClient\nclient = BlobServiceClient(url)',
        },
      ],
    });

    const output = formatCodeSearchResults(payload);

    expect(output).toContain('[1] Creates a BlobServiceClient using SAS token. (python)');
    expect(output).not.toContain('description:');
    expect(output).not.toContain('package:');
    expect(output).toContain('    https://learn.microsoft.com/azure/example');
    expect(output).toContain('from azure.storage.blob import BlobServiceClient');
  });

  it('separates multiple code results with blank lines', () => {
    const payload = JSON.stringify({
      results: [
        { description: 'First sample', language: 'python', codeSnippet: 'print("hello")' },
        { description: 'Second sample', language: 'python', codeSnippet: 'print("world")' },
      ],
    });

    const output = formatCodeSearchResults(payload);

    expect(output).toContain('[1] First sample (python)');
    expect(output).toContain('[2] Second sample (python)');
    expect(output).toContain('\n\n[2]');
  });

  it('omits language suffix when language is not present', () => {
    const payload = JSON.stringify({
      results: [{ description: 'No lang', codeSnippet: 'some code' }],
    });

    const output = formatCodeSearchResults(payload);

    expect(output).toBe(['[1] No lang', '', 'some code'].join('\n'));
  });

  it('uses link field for the URL line', () => {
    const payload = JSON.stringify({
      results: [{ description: 'With link', link: 'https://example.com/code', codeSnippet: 'x = 1' }],
    });

    const output = formatCodeSearchResults(payload);

    expect(output).toContain('    https://example.com/code');
  });
});
