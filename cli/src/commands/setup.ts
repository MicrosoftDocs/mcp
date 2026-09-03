import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { Command } from 'commander';

import type { CliContext } from '../context.js';
import {
  detectInstalledDiscoveryAgents,
  formatDiscoveryAgentNames,
  getAgentDiscoveryAssets,
  getAgentDiscoveryPaths,
  getSelectedDiscoveryAgents,
  type DiscoveryAgentOptions,
} from '../setup/agents.js';
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

      const assets = getAgentDiscoveryAssets();
      const skillContent = await readFile(assets.skillFile, 'utf8');

      for (const agent of agents) {
        const paths = getAgentDiscoveryPaths(agent, project, context);

        await mkdir(paths.skillDirectory, { recursive: true });
        await writeFile(paths.skillFile, skillContent, 'utf8');

        context.writeOut(`  ${paths.displayName} (${scope})\n`);
        context.writeOut('    + Skill installed\n');
        context.writeOut(`      ${paths.skillFile}\n`);
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
