import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { extractMarkdownSection, truncateOutput } from '../utils/markdown.js';
import { normalizeUrl, parsePositiveInteger, resolveEndpoint } from '../utils/options.js';
import { ensureTrailingNewline } from '../utils/text.js';

interface FetchCommandOptions {
  section?: string;
  maxChars?: number;
}

export function registerFetchCommand(program: Command, context: CliContext): void {
  program
    .command('fetch')
    .description('Fetch a Microsoft Learn document in markdown-friendly form.')
    .argument('<url>', 'Microsoft Learn document URL.')
    .option('--section <heading>', 'Return only the matching markdown section.')
    .option('--max-chars <number>', 'Truncate the final rendered output.', parsePositiveInteger)
    .action(async (url: string, options: FetchCommandOptions) => {
      const endpoint = resolveEndpoint(program.opts<{ endpoint?: string }>().endpoint, context.env);
      const normalizedUrl = normalizeUrl(url);
      const client = context.createClient({ endpoint });

      try {
        const markdown = await client.fetchDocument(normalizedUrl);
        const sectionFiltered = options.section ? extractMarkdownSection(markdown, options.section) : markdown;
        const finalContent = truncateOutput(sectionFiltered, options.maxChars);
        context.writeOut(ensureTrailingNewline(finalContent));
      } finally {
        await client.close();
      }
    });
}
