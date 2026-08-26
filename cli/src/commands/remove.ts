import { readdir, rm, rmdir } from 'node:fs/promises';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import {
  getAgentDiscoveryPaths,
  getSelectedDiscoveryAgents,
  type DiscoveryAgentOptions,
} from '../setup/agents.js';
import { removeManagedSection } from '../setup/managed-markdown.js';
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
      context.writeOut('\n');

      for (const agent of getSelectedDiscoveryAgents(options)) {
        const paths = getAgentDiscoveryPaths(agent, project, context);

        const skillStatus = await removeFileIfPresent(paths.skillFile);
        await removeDirectoryIfEmpty(paths.skillDirectory);

        const ruleResults: Array<{ path: string; status: 'removed' | 'not found' }> = [];
        if (paths.instruction.kind === 'file') {
          ruleResults.push({
            path: paths.instruction.file,
            status: await removeFileIfPresent(paths.instruction.file),
          });
        } else {
          for (const instructionFile of paths.instruction.files) {
            ruleResults.push({
              path: instructionFile,
              status: await removeManagedSection(instructionFile),
            });
          }
        }

        context.writeOut(`  ${paths.displayName} (${scope})\n`);
        context.writeOut(`    ${skillStatus === 'removed' ? '-' : '~'} Skill ${skillStatus}\n`);
        context.writeOut(`      ${paths.skillFile}\n`);

        const removedRules = ruleResults.filter((result) => result.status === 'removed');
        if (removedRules.length > 0) {
          for (const result of removedRules) {
            context.writeOut('    - Rule removed\n');
            context.writeOut(`      ${result.path}\n`);
          }
        } else {
          context.writeOut('    ~ Rule not found\n');
          for (const result of ruleResults) {
            context.writeOut(`      ${result.path}\n`);
          }
        }
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

  if (getSelectedDiscoveryAgents(options).length === 0) {
    throw new UsageError('An agent target is required: --copilot, --claude, or --codex.');
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
