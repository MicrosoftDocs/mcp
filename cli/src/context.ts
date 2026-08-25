import { homedir } from 'node:os';

import { createLearnCliClient, type LearnCliClientLike, type LearnClientOptions } from './mcp/client.js';

export interface CliContext {
  cwd: string;
  homeDir: string;
  env: NodeJS.ProcessEnv;
  version: string;
  writeOut: (value: string) => void;
  writeErr: (value: string) => void;
  createClient: (options: LearnClientOptions) => LearnCliClientLike;
}

export function createDefaultContext(version: string): CliContext {
  return {
    cwd: process.cwd(),
    homeDir: homedir(),
    env: process.env,
    version,
    writeOut: (value) => {
      process.stdout.write(value);
    },
    writeErr: (value) => {
      process.stderr.write(value);
    },
    createClient: (options) =>
      createLearnCliClient({
        clientVersion: version,
        ...options,
      }),
  };
}
