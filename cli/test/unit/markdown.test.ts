import { describe, expect, it } from 'vitest';

import { extractMarkdownSection, truncateOutput } from '../../src/utils/markdown.js';

describe('extractMarkdownSection', () => {
  it('returns the requested section until the next heading of the same or higher level', () => {
    const markdown = [
      '# Title',
      '',
      '## Usage',
      'Line one',
      '',
      '### Nested',
      'Nested text',
      '',
      '## Next',
      'Line two',
    ].join('\n');

    expect(extractMarkdownSection(markdown, 'Usage')).toBe(['## Usage', 'Line one', '', '### Nested', 'Nested text'].join('\n'));
  });
});

describe('truncateOutput', () => {
  it('truncates deterministically when a maximum is provided', () => {
    expect(truncateOutput('abcdef', 4)).toBe('abcd');
  });
});
