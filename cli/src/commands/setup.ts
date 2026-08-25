import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import {
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
      const agents = getSelectedDiscoveryAgents(options);

      for (const agent of agents) {
        const paths = getAgentDiscoveryPaths(agent, project, context);
        const assets = getAgentDiscoveryAssets(agent);
        const [skillContent, instructionContent] = await Promise.all([
          readFile(assets.skillFile, 'utf8'),
          readFile(assets.instructionFile, 'utf8'),
        ]);

        await mkdir(paths.skillDirectory, { recursive: true });
        await writeFile(paths.skillFile, skillContent, 'utf8');

        let instructionFile: string;
        if (paths.instruction.kind === 'file') {
          instructionFile = paths.instruction.file;
          await mkdir(dirname(instructionFile), { recursive: true });
          await writeFile(instructionFile, instructionContent, 'utf8');
        } else {
          instructionFile = await selectFirstNonEmptyFile(
            paths.instruction.files,
            paths.instruction.defaultFile,
          );
          await upsertManagedSection(instructionFile, instructionContent);
          for (const alternateFile of paths.instruction.files) {
            if (alternateFile !== instructionFile) {
              await removeManagedSection(alternateFile);
            }
          }
        }

        context.writeOut(`Installed ${paths.displayName} skill (${scope}): ${paths.skillFile}\n`);
        context.writeOut(
          `Installed ${paths.displayName} instruction (${scope}): ${instructionFile}\n`,
        );
      }
    });
}

function validateSetupOptions(options: SetupCommandOptions): asserts options is SetupCommandOptions & {
  cli: true;
} {
  if (!options.cli) {
    throw new UsageError('--cli is required. Run "mslearn setup --cli --copilot".');
  }

  if (getSelectedDiscoveryAgents(options).length === 0) {
    throw new UsageError('An agent target is required: --copilot, --claude, or --codex.');
  }
}
