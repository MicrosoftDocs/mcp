import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { formatSearchResults } from '../formatters/search-results.js';
import { resolveEndpoint } from '../utils/options.js';
import { ensureTrailingNewline } from '../utils/text.js';

interface SearchCommandOptions {
  json?: boolean;
}

export function registerSearchCommand(program: Command, context: CliContext): void {
  program
    .command('search')
    .description('Search official Microsoft documentation through the Learn MCP server.')
    .argument('<query>', 'Search query.')
    .option('--json', 'Output raw JSON instead of formatted text.')
    .action(async (query: string, options: SearchCommandOptions) => {
      const endpoint = resolveEndpoint(program.opts<{ endpoint?: string }>().endpoint, context.env);
      const client = context.createClient({ endpoint });

      try {
        const payload = await client.searchDocs(query);
        const output = options.json ? payload : formatSearchResults(payload);
        context.writeOut(ensureTrailingNewline(output));
      } finally {
        await client.close();
      }
    });
}
