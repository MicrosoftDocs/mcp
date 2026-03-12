const INDENT = '    ';

interface FormatOptions {
  /** When true, apply code-search-specific cleanup (description metadata stripping, language suffix). */
  codeSearch?: boolean;
}

export function formatSearchResults(payload: string): string {
  return formatResultsPayload(payload, { codeSearch: false });
}

export function formatCodeSearchResults(payload: string): string {
  return formatResultsPayload(payload, { codeSearch: true });
}

function formatResultsPayload(payload: string, options: FormatOptions): string {
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return payload;
  }

  const results = extractResultsArray(data);
  if (!results || results.length === 0) {
    return JSON.stringify(data, null, 2);
  }

  const formatter = options.codeSearch ? formatCodeSearchResult : formatDocsSearchResult;
  return results
    .map((item, index) => formatter(item as Record<string, unknown>, index + 1))
    .join('\n\n');
}

function extractResultsArray(data: unknown): unknown[] | undefined {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as Record<string, unknown>).results;
    if (Array.isArray(results)) {
      return results;
    }
  }

  return undefined;
}

function formatDocsSearchResult(result: Record<string, unknown>, index: number): string {
  const title = stringField(result, 'title') ?? `Result ${index}`;
  const url = stringField(result, 'contentUrl') ?? stringField(result, 'url');
  const body = stringField(result, 'content');

  const lines: string[] = [];
  lines.push(`[${index}] ${title}`);

  if (url) {
    lines.push(`${INDENT}${url}`);
  }

  if (body) {
    lines.push('');
    lines.push(body);
  }

  return lines.join('\n');
}

function formatCodeSearchResult(result: Record<string, unknown>, index: number): string {
  const rawTitle = stringField(result, 'description') ?? stringField(result, 'title');
  const title = rawTitle ? cleanCodeSearchDescription(rawTitle) : `Result ${index}`;
  const url = stringField(result, 'link') ?? stringField(result, 'contentUrl') ?? stringField(result, 'url');
  const language = stringField(result, 'language');
  const body = stringField(result, 'codeSnippet') ?? stringField(result, 'content');

  const lines: string[] = [];

  const langSuffix = language ? ` (${language})` : '';
  lines.push(`[${index}] ${title}${langSuffix}`);

  if (url) {
    lines.push(`${INDENT}${url}`);
  }

  if (body) {
    lines.push('');
    lines.push(body);
  }

  return lines.join('\n');
}

/**
 * The Learn MCP code-search description field sometimes embeds structured
 * metadata lines (e.g. "description: …\npackage: …\nlanguage: …\n").
 * Strip those so the title line stays clean.
 */
function cleanCodeSearchDescription(raw: string): string {
  let text = raw;

  // Strip leading "description: " prefix (case-insensitive).
  text = text.replace(/^\s*description:\s*/i, '');

  // Drop trailing metadata lines like "package: ..." and "language: ...".
  text = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*(package|language):\s*/i.test(line))
    .join(' ')
    .trim();

  return text || raw;
}

function stringField(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
