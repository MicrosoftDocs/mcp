import { readdir, rm, rmdir } from 'node:fs/promises';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { getCopilotDiscoveryPaths } from '../setup/copilot.js';
import { UsageError } from '../utils/errors.js';

interface RemoveCommandOptions {
  cli?: boolean;
  copilot?: boolean;
  project?: boolean;
}

export function registerRemoveCommand(program: Command, context: CliContext): void {
  program
    .command('remove')
    .description('Remove GitHub Copilot discovery for the standalone Microsoft Learn CLI.')
    .option('--cli', 'Remove discovery for the standalone CLI.')
    .option('--copilot', 'Remove GitHub Copilot discovery.')
    .option('--project', 'Remove discovery from the current project instead of the user profile.')
    .action(async (options: RemoveCommandOptions) => {
      validateRemoveOptions(options);

      const project = options.project ?? false;
      const paths = getCopilotDiscoveryPaths(project, context);

      await rm(paths.skillFile, { force: true });
      await removeDirectoryIfEmpty(paths.skillDirectory);
      await rm(paths.instructionFile, { force: true });

      const scope = project ? 'project' : 'global';
      context.writeOut(`Removed Copilot skill (${scope}): ${paths.skillFile}\n`);
      context.writeOut(`Removed Copilot instruction (${scope}): ${paths.instructionFile}\n`);
    });
}

function validateRemoveOptions(options: RemoveCommandOptions): asserts options is RemoveCommandOptions & {
  cli: true;
  copilot: true;
} {
  if (!options.cli) {
    throw new UsageError('--cli is required. Run "mslearn remove --cli --copilot".');
  }

  if (!options.copilot) {
    throw new UsageError('--copilot is required. Run "mslearn remove --cli --copilot".');
  }
}

async function removeDirectoryIfEmpty(path: string): Promise<void> {
  try {
    const entries = await readdir(path);
    if (entries.length === 0) {
      await rmdir(path);
    }
  } catch (error) {
    if (isFileSystemError(error, 'ENOENT') || isFileSystemError(error, 'ENOTEMPTY')) {
      return;
    }
    throw error;
  }
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
