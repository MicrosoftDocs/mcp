import { createLearnCliClient, DEFAULT_CLIENT_NAME, type LearnCliClientLike, type LearnClientOptions } from './mcp/client.js';

export interface CliContext {
  env: NodeJS.ProcessEnv;
  version: string;
  writeOut: (value: string) => void;
  writeErr: (value: string) => void;
  fetchImpl: typeof fetch;
  createClient: (options: LearnClientOptions) => LearnCliClientLike;
}

export function createDefaultContext(version: string): CliContext {
  const fetchImpl = globalThis.fetch.bind(globalThis) as typeof fetch;

  return {
    env: process.env,
    version,
    writeOut: (value) => {
      process.stdout.write(value);
    },
    writeErr: (value) => {
      process.stderr.write(value);
    },
    fetchImpl,
    createClient: (options) =>
      createLearnCliClient({
        clientName: DEFAULT_CLIENT_NAME,
        clientVersion: version,
        fetchImpl,
        ...options,
      }),
  };
}
