import { createLearnCliClient, type LearnCliClientLike, type LearnClientOptions } from './mcp/client.js';

export interface CliContext {
  env: NodeJS.ProcessEnv;
  version: string;
  writeOut: (value: string) => void;
  writeErr: (value: string) => void;
  fetchImpl: typeof fetch;
  createClient: (options: LearnClientOptions) => LearnCliClientLike;
}

export function createDefaultContext(version: string): CliContext {
  return {
    env: process.env,
    version,
    writeOut: (value) => {
      process.stdout.write(value);
    },
    writeErr: (value) => {
      process.stderr.write(value);
    },
    fetchImpl: globalThis.fetch.bind(globalThis) as typeof fetch,
    createClient: (options) =>
      createLearnCliClient({
        clientName: 'learn-cli',
        clientVersion: version,
        ...options,
      }),
  };
}
