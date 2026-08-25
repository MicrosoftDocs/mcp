import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { getCopilotDiscoveryAssetPaths, getCopilotDiscoveryPaths } from '../setup/copilot.js';
import { UsageError } from '../utils/errors.js';

interface SetupCommandOptions {
  cli?: boolean;
  copilot?: boolean;
  project?: boolean;
}

export function registerSetupCommand(program: Command, context: CliContext): void {
  program
    .command('setup')
    .description('Install GitHub Copilot discovery for the standalone Microsoft Learn CLI.')
    .option('--cli', 'Configure discovery for the standalone CLI.')
    .option('--copilot', 'Install GitHub Copilot discovery.')
    .option('--project', 'Install discovery in the current project instead of the user profile.')
    .action(async (options: SetupCommandOptions) => {
      validateSetupOptions(options);

      const project = options.project ?? false;
      const paths = getCopilotDiscoveryPaths(project, context);
      const assets = getCopilotDiscoveryAssetPaths();
      const [skillContent, instructionContent] = await Promise.all([
        readFile(assets.skillFile, 'utf8'),
        readFile(assets.instructionFile, 'utf8'),
      ]);

      await Promise.all([
        mkdir(paths.skillDirectory, { recursive: true }),
        mkdir(dirname(paths.instructionFile), { recursive: true }),
      ]);
      await Promise.all([
        writeFile(paths.skillFile, skillContent, 'utf8'),
        writeFile(paths.instructionFile, instructionContent, 'utf8'),
      ]);

      const scope = project ? 'project' : 'global';
      context.writeOut(`Installed Copilot skill (${scope}): ${paths.skillFile}\n`);
      context.writeOut(`Installed Copilot instruction (${scope}): ${paths.instructionFile}\n`);
    });
}

function validateSetupOptions(options: SetupCommandOptions): asserts options is SetupCommandOptions & {
  cli: true;
  copilot: true;
} {
  if (!options.cli) {
    throw new UsageError('--cli is required. Run "mslearn setup --cli --copilot".');
  }

  if (!options.copilot) {
    throw new UsageError('--copilot is required. Run "mslearn setup --cli --copilot".');
  }
}
