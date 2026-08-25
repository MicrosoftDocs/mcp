import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import type { CliContext } from '../context.js';

export const SKILL_NAME = 'microsoft-learn-cli';

export interface CopilotDiscoveryPaths {
  skillDirectory: string;
  skillFile: string;
  instructionFile: string;
}

export interface CopilotDiscoveryAssetPaths {
  skillFile: string;
  instructionFile: string;
}

export function getCopilotDiscoveryPaths(
  project: boolean,
  context: Pick<CliContext, 'cwd' | 'homeDir'>,
): CopilotDiscoveryPaths {
  const copilotRoot = project ? join(context.cwd, '.github') : join(context.homeDir, '.copilot');
  const skillDirectory = join(copilotRoot, 'skills', SKILL_NAME);

  return {
    skillDirectory,
    skillFile: join(skillDirectory, 'SKILL.md'),
    instructionFile: join(copilotRoot, 'instructions', `${SKILL_NAME}.instructions.md`),
  };
}

export function getCopilotDiscoveryAssetPaths(): CopilotDiscoveryAssetPaths {
  return {
    skillFile: fileURLToPath(new URL('../../assets/microsoft-learn-cli/SKILL.md', import.meta.url)),
    instructionFile: fileURLToPath(new URL('../../assets/microsoft-learn-cli/INSTRUCTIONS.md', import.meta.url)),
  };
}
