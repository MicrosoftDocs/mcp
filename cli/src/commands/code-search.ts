import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { resolveEndpoint } from '../utils/options.js';
import { ensureTrailingNewline } from '../utils/text.js';

interface CodeSearchCommandOptions {
  language?: string;
}

export function registerCodeSearchCommand(program: Command, context: CliContext): void {
  program
    .command('code-search')
    .description('Search Microsoft Learn code samples through the Learn MCP server.')
    .argument('<query>', 'Search query.')
    .option('--language <name>', 'Preferred language filter to pass to Learn.')
    .action(async (query: string, options: CodeSearchCommandOptions) => {
      const endpoint = resolveEndpoint(program.opts<{ endpoint?: string }>().endpoint, context.env);
      const client = context.createClient({
        endpoint,
        clientName: 'mslearn',
        clientVersion: context.version,
      });

      try {
        const payload = await client.searchCodeSamples(query, options.language);
        context.writeOut(ensureTrailingNewline(payload));
      } finally {
        await client.close();
      }
    });
}
