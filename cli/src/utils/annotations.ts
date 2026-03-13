import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import envPaths from 'env-paths';

export interface Annotation {
  url: string;
  note: string;
  updatedAt: string;
}

export interface AnnotationStore {
  read(url: string): Annotation | undefined;
  write(url: string, note: string): Annotation;
  clear(url: string): boolean;
  list(): Annotation[];
}

interface FileAnnotationStoreOptions {
  annotationsDir?: string;
  now?: () => number;
}

export function getDefaultAnnotationsDir(): string {
  const paths = envPaths('mslearn', { suffix: '' });
  return join(paths.data, 'annotations');
}

export function createFileAnnotationStore(options: FileAnnotationStoreOptions = {}): AnnotationStore {
  return new FileAnnotationStore(options);
}

function urlToFilename(url: string): string {
  return url.replace(/[^a-zA-Z0-9.-]/g, '_') + '.json';
}

class FileAnnotationStore implements AnnotationStore {
  private readonly annotationsDir: string;
  private readonly now: () => number;

  constructor(options: FileAnnotationStoreOptions) {
    this.annotationsDir = options.annotationsDir ?? getDefaultAnnotationsDir();
    this.now = options.now ?? Date.now;
  }

  read(url: string): Annotation | undefined {
    try {
      const filePath = join(this.annotationsDir, urlToFilename(url));
      const raw = readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as Annotation;
    } catch {
      return undefined;
    }
  }

  write(url: string, note: string): Annotation {
    mkdirSync(this.annotationsDir, { recursive: true });
    const annotation: Annotation = {
      url,
      note,
      updatedAt: new Date(this.now()).toISOString(),
    };
    const filePath = join(this.annotationsDir, urlToFilename(url));
    writeFileSync(filePath, JSON.stringify(annotation, null, 2), 'utf8');
    return annotation;
  }

  clear(url: string): boolean {
    try {
      const filePath = join(this.annotationsDir, urlToFilename(url));
      unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  list(): Annotation[] {
    try {
      const files = readdirSync(this.annotationsDir).filter((f) => f.endsWith('.json'));
      const results: Annotation[] = [];
      for (const file of files) {
        try {
          const raw = readFileSync(join(this.annotationsDir, file), 'utf8');
          results.push(JSON.parse(raw) as Annotation);
        } catch {
          // skip malformed files
        }
      }
      return results;
    } catch {
      return [];
    }
  }
}
