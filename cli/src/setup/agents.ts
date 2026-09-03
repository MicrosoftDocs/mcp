import { access } from 'node:fs/promises';
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

export interface AgentDiscoveryPaths {
  agent: DiscoveryAgent;
  displayName: string;
  skillDirectory: string;
  skillFile: string;
}

export interface AgentDiscoveryAssets {
  skillFile: string;
}

export function getSelectedDiscoveryAgents(options: DiscoveryAgentOptions): DiscoveryAgent[] {
  return DISCOVERY_AGENTS.filter((agent) => options[agent] === true);
}

export async function detectInstalledDiscoveryAgents(
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>,
): Promise<DiscoveryAgent[]> {
  const detected: DiscoveryAgent[] = [];

  for (const agent of DISCOVERY_AGENTS) {
    const detectionPath = getAgentDetectionPath(agent, project, context);
    if (await pathExists(detectionPath)) {
      detected.push(agent);
    }
  }

  return detected;
}

export async function detectConfiguredDiscoveryAgents(
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>,
): Promise<DiscoveryAgent[]> {
  const detected: DiscoveryAgent[] = [];

  for (const agent of DISCOVERY_AGENTS) {
    const paths = getAgentDiscoveryPaths(agent, project, context);
    if (await pathExists(paths.skillFile)) {
      detected.push(agent);
    }
  }

  return detected;
}

export function formatDiscoveryAgentNames(
  agents: DiscoveryAgent[],
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>,
): string {
  return agents
    .map((agent) => getAgentDiscoveryPaths(agent, project, context).displayName)
    .join(', ');
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
    };
  }

  const skillRoot = project ? context.cwd : context.homeDir;
  const skillDirectory = join(skillRoot, '.agents', 'skills', SKILL_NAME);

  return {
    agent,
    displayName: 'Codex',
    skillDirectory,
    skillFile: join(skillDirectory, 'SKILL.md'),
  };
}

export function getAgentDiscoveryAssets(): AgentDiscoveryAssets {
  return {
    skillFile: fileURLToPath(new URL('../../assets/microsoft-learn-cli/SKILL.md', import.meta.url)),
  };
}

function getCodexHome(context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>): string {
  const configuredHome = context.env.CODEX_HOME?.trim();
  return configuredHome ? resolve(context.cwd, configuredHome) : join(context.homeDir, '.codex');
}

function getAgentDetectionPath(
  agent: DiscoveryAgent,
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir' | 'env'>,
): string {
  if (agent === 'copilot') {
    return project ? join(context.cwd, '.github') : join(context.homeDir, '.copilot');
  }

  if (agent === 'claude') {
    return project ? join(context.cwd, '.claude') : join(context.homeDir, '.claude');
  }

  return project ? join(context.cwd, '.codex') : getCodexHome(context);
}

async function pathExists(path: string): Promise<boolean> {
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
