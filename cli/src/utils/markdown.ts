import { OperationError, UsageError } from './errors.js';

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

export function truncateOutput(value: string, maxChars?: number): string {
  if (maxChars === undefined) {
    return value;
  }

  if (!Number.isInteger(maxChars) || maxChars <= 0) {
    throw new UsageError('--max-chars must be a positive integer.');
  }

  if (value.length <= maxChars) {
    return value;
  }

  return value.slice(0, maxChars);
}

export function extractMarkdownSection(markdown: string, heading: string): string {
  const target = normalizeHeading(heading);
  const lines = markdown.split(/\r?\n/);

  let startIndex = -1;
  let startLevel = 0;

  for (const [index, line] of lines.entries()) {
    const match = HEADING_PATTERN.exec(line);
    if (!match) {
      continue;
    }

    const hashes = match[1];
    const rawHeading = match[2];
    if (!hashes || !rawHeading) {
      continue;
    }

    if (normalizeHeading(rawHeading) === target) {
      startIndex = index;
      startLevel = hashes.length;
      break;
    }
  }

  if (startIndex === -1) {
    throw new OperationError(`Heading not found: ${heading}`);
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = HEADING_PATTERN.exec(lines[index] ?? '');
    if (!match) {
      continue;
    }

    const hashes = match[1];
    if (!hashes) {
      continue;
    }

    if (hashes.length <= startLevel) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').trimEnd();
}

function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~<>[\]()+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
