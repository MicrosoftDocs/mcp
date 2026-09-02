import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import {
  detectInstalledDiscoveryAgents,
  formatAgentInstruction,
  formatDiscoveryAgentNames,
  getAgentDiscoveryAssets,
  getAgentDiscoveryPaths,
  getSelectedDiscoveryAgents,
  type DiscoveryAgentOptions,
} from '../setup/agents.js';
import {
  removeManagedSection,
  selectFirstNonEmptyFile,
  upsertManagedSection,
} from '../setup/managed-markdown.js';
import { UsageError } from '../utils/errors.js';

interface SetupCommandOptions extends DiscoveryAgentOptions {
  cli?: boolean;
  project?: boolean;
}

export function registerSetupCommand(program: Command, context: CliContext): void {
  program
    .command('setup')
    .description('Install agent discovery for the standalone Microsoft Learn CLI.')
    .option('--cli', 'Configure discovery for the standalone CLI.')
    .option('--copilot', 'Install GitHub Copilot discovery.')
    .option('--claude', 'Install Claude Code discovery.')
    .option('--codex', 'Install Codex discovery.')
    .option('--project', 'Install discovery in the current project instead of the user profile.')
    .action(async (options: SetupCommandOptions) => {
      validateSetupOptions(options);

      const project = options.project ?? false;
      const scope = project ? 'project' : 'global';
      const explicitAgents = getSelectedDiscoveryAgents(options);
      const agents =
        explicitAgents.length > 0
          ? explicitAgents
          : await detectInstalledDiscoveryAgents(project, context);
      if (agents.length === 0) {
        throw new UsageError(
          'No supported agents detected. Pass --copilot, --claude, or --codex.',
        );
      }

      context.writeOut('\n');
      if (explicitAgents.length === 0) {
        context.writeOut(`  Detected: ${formatDiscoveryAgentNames(agents, project, context)}\n\n`);
      }

      for (const agent of agents) {
        const paths = getAgentDiscoveryPaths(agent, project, context);
        const assets = getAgentDiscoveryAssets();
        const [skillContent, baseInstructionContent] = await Promise.all([
          readFile(assets.skillFile, 'utf8'),
          readFile(assets.instructionFile, 'utf8'),
        ]);
        const instructionContent = formatAgentInstruction(agent, baseInstructionContent);

        await mkdir(paths.skillDirectory, { recursive: true });
        await writeFile(paths.skillFile, skillContent, 'utf8');

        let instructionFile: string;
        let ruleStatus: 'installed' | 'updated';
        if (paths.instruction.kind === 'file') {
          instructionFile = paths.instruction.file;
          ruleStatus = (await fileExists(instructionFile)) ? 'updated' : 'installed';
          await mkdir(dirname(instructionFile), { recursive: true });
          await writeFile(instructionFile, instructionContent, 'utf8');
        } else {
          instructionFile = await selectFirstNonEmptyFile(
            paths.instruction.files,
            paths.instruction.defaultFile,
          );
          ruleStatus = await upsertManagedSection(instructionFile, instructionContent);
          for (const alternateFile of paths.instruction.files) {
            if (alternateFile !== instructionFile) {
              await removeManagedSection(alternateFile);
            }
          }
        }

        context.writeOut(`  ${paths.displayName} (${scope})\n`);
        context.writeOut('    + Skill installed\n');
        context.writeOut(`      ${paths.skillFile}\n`);
        context.writeOut(`    + Rule ${ruleStatus}\n`);
        context.writeOut(`      ${instructionFile}\n`);
      }

      context.writeOut('\n');
    });
}

function validateSetupOptions(options: SetupCommandOptions): asserts options is SetupCommandOptions & {
  cli: true;
} {
  if (!options.cli) {
    throw new UsageError('--cli is required. Run "mslearn setup --cli --copilot".');
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isFileSystemError(error, 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
