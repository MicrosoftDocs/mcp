import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { OperationError } from '../utils/errors.js';

const MANAGED_SECTION_START = '<!-- mslearn:microsoft-learn-cli:start -->';
const MANAGED_SECTION_END = '<!-- mslearn:microsoft-learn-cli:end -->';

interface ManagedSectionRange {
  start: number;
  end: number;
}

export type ManagedSectionStatus = 'installed' | 'updated';
export type ManagedSectionRemovalStatus = 'removed' | 'not found';

export async function selectFirstNonEmptyFile(files: string[], defaultFile: string): Promise<string> {
  for (const file of files) {
    const content = await readOptionalFile(file);
    if (content?.trim()) {
      return file;
    }
  }

  return defaultFile;
}

export async function upsertManagedSection(
  file: string,
  content: string,
): Promise<ManagedSectionStatus> {
  const existing = (await readOptionalFile(file)) ?? '';
  const section = `${MANAGED_SECTION_START}\n${content.trim()}\n${MANAGED_SECTION_END}`;
  const range = findManagedSection(existing, file);
  const nextContent = range
    ? `${existing.slice(0, range.start)}${section}${existing.slice(range.end)}`
    : appendManagedSection(existing, section);

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, nextContent, 'utf8');
  return range ? 'updated' : 'installed';
}

export async function removeManagedSection(file: string): Promise<ManagedSectionRemovalStatus> {
  const existing = await readOptionalFile(file);
  if (existing === undefined) {
    return 'not found';
  }

  const range = findManagedSection(existing, file);
  if (!range) {
    return 'not found';
  }

  const nextContent = `${existing.slice(0, range.start)}${existing.slice(range.end)}`;
  if (nextContent.trim()) {
    await writeFile(file, nextContent, 'utf8');
  } else {
    await rm(file, { force: true });
  }
  return 'removed';
}

function appendManagedSection(existing: string, section: string): string {
  if (!existing) {
    return `${section}\n`;
  }

  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}${section}\n`;
}

function findManagedSection(content: string, file: string): ManagedSectionRange | undefined {
  const start = content.indexOf(MANAGED_SECTION_START);
  const endMarkerStart =
    start === -1
      ? content.indexOf(MANAGED_SECTION_END)
      : content.indexOf(MANAGED_SECTION_END, start + MANAGED_SECTION_START.length);

  if (start === -1 && endMarkerStart === -1) {
    return undefined;
  }

  if (start === -1 || endMarkerStart === -1) {
    throw new OperationError(`Managed Microsoft Learn CLI markers are incomplete in ${file}.`);
  }

  return {
    start,
    end: endMarkerStart + MANAGED_SECTION_END.length,
  };
}

async function readOptionalFile(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (isFileSystemError(error, 'ENOENT')) {
      return undefined;
    }
    throw error;
  }
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
