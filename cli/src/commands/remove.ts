import { readdir, rm, rmdir } from 'node:fs/promises';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import {
  detectConfiguredDiscoveryAgents,
  formatDiscoveryAgentNames,
  getAgentDiscoveryPaths,
  getSelectedDiscoveryAgents,
  type DiscoveryAgentOptions,
} from '../setup/agents.js';
import { UsageError } from '../utils/errors.js';

interface RemoveCommandOptions extends DiscoveryAgentOptions {
  cli?: boolean;
  project?: boolean;
}

export function registerRemoveCommand(program: Command, context: CliContext): void {
  program
    .command('remove')
    .description('Remove agent discovery for the standalone Microsoft Learn CLI.')
    .option('--cli', 'Remove discovery for the standalone CLI.')
    .option('--copilot', 'Remove GitHub Copilot discovery.')
    .option('--claude', 'Remove Claude Code discovery.')
    .option('--codex', 'Remove Codex discovery.')
    .option('--project', 'Remove discovery from the current project instead of the user profile.')
    .action(async (options: RemoveCommandOptions) => {
      validateRemoveOptions(options);

      const project = options.project ?? false;
      const scope = project ? 'project' : 'global';
      const explicitAgents = getSelectedDiscoveryAgents(options);
      const agents =
        explicitAgents.length > 0
          ? explicitAgents
          : await detectConfiguredDiscoveryAgents(project, context);
      if (agents.length === 0) {
        throw new UsageError(
          'No Microsoft Learn CLI agent discovery detected. Pass --copilot, --claude, or --codex.',
        );
      }

      context.writeOut('\n');
      if (explicitAgents.length === 0) {
        context.writeOut(`  Detected: ${formatDiscoveryAgentNames(agents, project, context)}\n\n`);
      }

      for (const agent of agents) {
        const paths = getAgentDiscoveryPaths(agent, project, context);

        const skillStatus = await removeFileIfPresent(paths.skillFile);
        await removeDirectoryIfEmpty(paths.skillDirectory);

        context.writeOut(`  ${paths.displayName} (${scope})\n`);
        context.writeOut(`    ${skillStatus === 'removed' ? '-' : '~'} Skill ${skillStatus}\n`);
        context.writeOut(`      ${paths.skillFile}\n`);
      }

      context.writeOut('\n');
    });
}

function validateRemoveOptions(options: RemoveCommandOptions): asserts options is RemoveCommandOptions & {
  cli: true;
} {
  if (!options.cli) {
    throw new UsageError('--cli is required. Run "mslearn remove --cli --copilot".');
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

async function removeFileIfPresent(path: string): Promise<'removed' | 'not found'> {
  try {
    await rm(path);
    return 'removed';
  } catch (error) {
    if (isFileSystemError(error, 'ENOENT')) {
      return 'not found';
    }
    throw error;
  }
}
