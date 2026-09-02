import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createFileAnnotationStore } from '../../src/utils/annotations.js';

function createTempStore(now?: () => number) {
  const dir = mkdtempSync(join(tmpdir(), 'mslearn-annotations-'));
  return {
    store: createFileAnnotationStore({ annotationsDir: dir, now }),
    dir,
  };
}

describe('annotation store', () => {
  it('writes and reads an annotation', () => {
    const { store } = createTempStore(() => 1_000);

    const result = store.write('https://learn.microsoft.com/en-us/azure/functions/', 'Needs raw body for webhooks');

    expect(result.url).toBe('https://learn.microsoft.com/en-us/azure/functions/');
    expect(result.note).toBe('Needs raw body for webhooks');
    expect(result.updatedAt).toBe('1970-01-01T00:00:01.000Z');

    const read = store.read('https://learn.microsoft.com/en-us/azure/functions/');
    expect(read).toEqual(result);
  });

  it('returns undefined for a missing annotation', () => {
    const { store } = createTempStore();

    expect(store.read('https://learn.microsoft.com/nonexistent')).toBeUndefined();
  });

  it('overwrites an existing annotation', () => {
    const { store } = createTempStore();

    store.write('https://learn.microsoft.com/test', 'first note');
    store.write('https://learn.microsoft.com/test', 'updated note');

    const result = store.read('https://learn.microsoft.com/test');
    expect(result?.note).toBe('updated note');
  });

  it('clears an existing annotation', () => {
    const { store } = createTempStore();

    store.write('https://learn.microsoft.com/test', 'some note');
    const removed = store.clear('https://learn.microsoft.com/test');

    expect(removed).toBe(true);
    expect(store.read('https://learn.microsoft.com/test')).toBeUndefined();
  });

  it('returns false when clearing a non-existent annotation', () => {
    const { store } = createTempStore();

    expect(store.clear('https://learn.microsoft.com/nonexistent')).toBe(false);
  });

  it('lists all annotations', () => {
    const { store } = createTempStore();

    store.write('https://learn.microsoft.com/a', 'note A');
    store.write('https://learn.microsoft.com/b', 'note B');

    const list = store.list();
    expect(list).toHaveLength(2);

    const urls = list.map((a) => a.url).sort();
    expect(urls).toEqual([
      'https://learn.microsoft.com/a',
      'https://learn.microsoft.com/b',
    ]);
  });

  it('returns an empty list when no annotations exist', () => {
    const { store } = createTempStore();

    expect(store.list()).toEqual([]);
  });

  it('creates the annotations directory on first write', () => {
    const tempBase = mkdtempSync(join(tmpdir(), 'mslearn-ann-parent-'));
    const annotationsDir = join(tempBase, 'nested', 'annotations');
    const store = createFileAnnotationStore({ annotationsDir });

    store.write('https://learn.microsoft.com/test', 'note');

    const files = readdirSync(annotationsDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/\.json$/);
  });

  it('stores annotations as valid JSON files on disk', () => {
    const { store, dir } = createTempStore(() => 2_000);

    store.write('https://learn.microsoft.com/test', 'a note');

    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    expect(files).toHaveLength(1);

    const raw = readFileSync(join(dir, files[0]!), 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.url).toBe('https://learn.microsoft.com/test');
    expect(parsed.note).toBe('a note');
    expect(parsed.updatedAt).toBe('1970-01-01T00:00:02.000Z');
  });
});
