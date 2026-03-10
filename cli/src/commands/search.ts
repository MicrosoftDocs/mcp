import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { resolveEndpoint } from '../utils/options.js';
import { ensureTrailingNewline } from '../utils/text.js';

export function registerSearchCommand(program: Command, context: CliContext): void {
  program
    .command('search')
    .description('Search official Microsoft documentation through the Learn MCP server.')
    .argument('<query>', 'Search query.')
    .action(async (query: string) => {
      const endpoint = resolveEndpoint(program.opts<{ endpoint?: string }>().endpoint, context.env);
      const client = context.createClient({
        endpoint,
        clientName: 'mslearn',
        clientVersion: context.version,
      });

      try {
        const payload = await client.searchDocs(query);
        context.writeOut(ensureTrailingNewline(payload));
      } finally {
        await client.close();
      }
    });
}
