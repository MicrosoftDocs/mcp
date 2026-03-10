import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import envPaths from 'env-paths';

import type { ListedTool } from './tool-discovery.js';

const CACHE_SCHEMA_VERSION = 1;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface LearnSessionCacheValue {
  endpoint: string;
  sessionId?: string;
  tools?: ListedTool[];
  updatedAt: string;
  expiresAt: string;
}

export interface LearnSessionCacheStore {
  read(endpoint: string): Promise<LearnSessionCacheValue | undefined>;
  write(value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }): Promise<LearnSessionCacheValue>;
  clear(endpoint: string): Promise<void>;
}

interface CacheFileShape {
  version: number;
  entries: Record<string, LearnSessionCacheValue>;
}

interface FileLearnSessionCacheStoreOptions {
  cacheFilePath?: string;
  ttlMs?: number;
  now?: () => number;
}

export function createFileLearnSessionCacheStore(options: FileLearnSessionCacheStoreOptions = {}): LearnSessionCacheStore {
  return new FileLearnSessionCacheStore(options);
}

export function getDefaultCacheFilePath(): string {
  const paths = envPaths('mslearn', { suffix: '' });
  return join(paths.cache, 'learn-mcp-cache.json');
}

class FileLearnSessionCacheStore implements LearnSessionCacheStore {
  private readonly cacheFilePath: string;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: FileLearnSessionCacheStoreOptions) {
    this.cacheFilePath = options.cacheFilePath ?? getDefaultCacheFilePath();
    this.ttlMs = options.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  async read(endpoint: string): Promise<LearnSessionCacheValue | undefined> {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const cache = await this.readCacheFile();
    const entry = cache.entries[normalizedEndpoint];

    if (!entry) {
      return undefined;
    }

    if (new Date(entry.expiresAt).getTime() <= this.now()) {
      delete cache.entries[normalizedEndpoint];
      await this.writeCacheFile(cache);
      return undefined;
    }

    return entry;
  }

  async write(value: { endpoint: string; sessionId?: string; tools?: ListedTool[] }): Promise<LearnSessionCacheValue> {
    const normalizedEndpoint = normalizeEndpoint(value.endpoint);
    const cache = await this.readCacheFile();
    const storedValue: LearnSessionCacheValue = {
      endpoint: normalizedEndpoint,
      sessionId: value.sessionId,
      tools: value.tools ? [...value.tools] : undefined,
      updatedAt: new Date(this.now()).toISOString(),
      expiresAt: new Date(this.now() + this.ttlMs).toISOString(),
    };

    cache.entries[normalizedEndpoint] = storedValue;
    await this.writeCacheFile(cache);
    return storedValue;
  }

  async clear(endpoint: string): Promise<void> {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const cache = await this.readCacheFile();

    if (!(normalizedEndpoint in cache.entries)) {
      return;
    }

    delete cache.entries[normalizedEndpoint];

    if (Object.keys(cache.entries).length === 0) {
      await rm(this.cacheFilePath, { force: true }).catch(() => undefined);
      return;
    }

    await this.writeCacheFile(cache);
  }

  private async readCacheFile(): Promise<CacheFileShape> {
    try {
      const raw = await readFile(this.cacheFilePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<CacheFileShape>;
      if (parsed.version !== CACHE_SCHEMA_VERSION || !parsed.entries || typeof parsed.entries !== 'object') {
        return emptyCacheFile();
      }

      return {
        version: CACHE_SCHEMA_VERSION,
        entries: parsed.entries,
      };
    } catch {
      return emptyCacheFile();
    }
  }

  private async writeCacheFile(cache: CacheFileShape): Promise<void> {
    await mkdir(dirname(this.cacheFilePath), { recursive: true });
    await writeFile(this.cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
  }
}

function emptyCacheFile(): CacheFileShape {
  return {
    version: CACHE_SCHEMA_VERSION,
    entries: {},
  };
}

function normalizeEndpoint(endpoint: string): string {
  return new URL(endpoint).toString();
}

