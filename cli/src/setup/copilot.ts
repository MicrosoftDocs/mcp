import { join } from 'node:path';

import type { CliContext } from '../context.js';

export const SKILL_NAME = 'microsoft-learn-cli';

export interface CopilotDiscoveryPaths {
  skillDirectory: string;
  skillFile: string;
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
  };
}
