import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CliContext } from '../context.js';
import { getCopilotDiscoveryPaths, SKILL_NAME } from './copilot.js';

export const DISCOVERY_AGENTS = ['copilot', 'claude', 'codex'] as const;

export type DiscoveryAgent = (typeof DISCOVERY_AGENTS)[number];

export interface DiscoveryAgentOptions {
  copilot?: boolean;
  claude?: boolean;
  codex?: boolean;
}

interface FileInstructionDestination {
  kind: 'file';
  file: string;
}

interface ManagedSectionInstructionDestination {
  kind: 'managed-section';
  files: string[];
  defaultFile: string;
}

export interface AgentDiscoveryPaths {
  agent: DiscoveryAgent;
  displayName: string;
  skillDirectory: string;
  skillFile: string;
  instruction: FileInstructionDestination | ManagedSectionInstructionDestination;
}

export interface AgentDiscoveryAssets {
  skillFile: string;
  instructionFile: string;
}

export function getSelectedDiscoveryAgents(options: DiscoveryAgentOptions): DiscoveryAgent[] {
  return DISCOVERY_AGENTS.filter((agent) => options[agent] === true);
}

export function getAgentDiscoveryPaths(
  agent: DiscoveryAgent,
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>,
): AgentDiscoveryPaths {
  if (agent === 'copilot') {
    const paths = getCopilotDiscoveryPaths(project, context);
    return {
      agent,
      displayName: 'GitHub Copilot',
      skillDirectory: paths.skillDirectory,
      skillFile: paths.skillFile,
      instruction: {
        kind: 'file',
        file: paths.instructionFile,
      },
    };
  }

  if (agent === 'claude') {
    const claudeRoot = project ? join(context.cwd, '.claude') : join(context.homeDir, '.claude');
    const skillDirectory = join(claudeRoot, 'skills', SKILL_NAME);
    return {
      agent,
      displayName: 'Claude Code',
      skillDirectory,
      skillFile: join(skillDirectory, 'SKILL.md'),
      instruction: {
        kind: 'file',
        file: join(claudeRoot, 'rules', `${SKILL_NAME}.md`),
      },
    };
  }

  const skillRoot = project ? context.cwd : context.homeDir;
  const skillDirectory = join(skillRoot, '.agents', 'skills', SKILL_NAME);
  const instructionRoot = project ? context.cwd : getCodexHome(context);
  const defaultFile = join(instructionRoot, 'AGENTS.md');

  return {
    agent,
    displayName: 'Codex',
    skillDirectory,
    skillFile: join(skillDirectory, 'SKILL.md'),
    instruction: {
      kind: 'managed-section',
      files: [join(instructionRoot, 'AGENTS.override.md'), defaultFile],
      defaultFile,
    },
  };
}

export function getAgentDiscoveryAssets(agent: DiscoveryAgent): AgentDiscoveryAssets {
  const instructionAsset = {
    copilot: 'INSTRUCTIONS.md',
    claude: 'CLAUDE.md',
    codex: 'CODEX.md',
  } satisfies Record<DiscoveryAgent, string>;

  return {
    skillFile: fileURLToPath(new URL('../../assets/microsoft-learn-cli/SKILL.md', import.meta.url)),
    instructionFile: fileURLToPath(
      new URL(`../../assets/microsoft-learn-cli/${instructionAsset[agent]}`, import.meta.url),
    ),
  };
}

function getCodexHome(context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>): string {
  const configuredHome = context.env.CODEX_HOME?.trim();
  return configuredHome ? resolve(context.cwd, configuredHome) : join(context.homeDir, '.codex');
}
