import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { normalizeUrl } from '../utils/options.js';
import { ensureTrailingNewline } from '../utils/text.js';
import { UsageError } from '../utils/errors.js';

interface AnnotateCommandOptions {
  clear?: boolean;
  list?: boolean;
}

export function registerAnnotateCommand(program: Command, context: CliContext): void {
  program
    .command('annotate')
    .description('Attach a local note to a Microsoft Learn URL. Notes persist across sessions.')
    .argument('[url]', 'Microsoft Learn document URL.')
    .argument('[note]', 'Note text to attach to the URL.')
    .option('--clear', 'Remove the annotation for this URL.')
    .option('--list', 'List all saved annotations.')
    .action((url: string | undefined, note: string | undefined, options: AnnotateCommandOptions) => {
      const store = context.createAnnotationStore();

      if (options.list) {
        const annotations = store.list();
        if (annotations.length === 0) {
          context.writeOut(ensureTrailingNewline('No annotations.'));
          return;
        }
        const lines: string[] = [];
        for (const a of annotations) {
          lines.push(`${a.url} (${a.updatedAt})`);
          lines.push(`  ${a.note}`);
          lines.push('');
        }
        context.writeOut(ensureTrailingNewline(lines.join('\n')));
        return;
      }

      if (!url) {
        throw new UsageError(
          'Missing required argument: <url>. Usage: mslearn annotate <url> <note> | mslearn annotate <url> --clear | mslearn annotate --list',
        );
      }

      const normalizedUrl = normalizeUrl(url);

      if (options.clear) {
        const removed = store.clear(normalizedUrl);
        if (removed) {
          context.writeOut(ensureTrailingNewline(`Annotation cleared for ${normalizedUrl}.`));
        } else {
          context.writeOut(ensureTrailingNewline(`No annotation found for ${normalizedUrl}.`));
        }
        return;
      }

      if (!note) {
        const existing = store.read(normalizedUrl);
        if (existing) {
          context.writeOut(ensureTrailingNewline(`${existing.url} (${existing.updatedAt})\n${existing.note}`));
        } else {
          context.writeOut(ensureTrailingNewline(`No annotation for ${normalizedUrl}.`));
        }
        return;
      }

      const annotation = store.write(normalizedUrl, note);
      context.writeOut(ensureTrailingNewline(`Annotation saved for ${annotation.url}.`));
    });
}
