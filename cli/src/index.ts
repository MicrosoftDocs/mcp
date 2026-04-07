#!/usr/bin/env node

import { Command, CommanderError, Option } from 'commander';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { registerAnnotateCommand } from './commands/annotate.js';
import { registerCodeSearchCommand } from './commands/code-search.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerFetchCommand } from './commands/fetch.js';
import { registerSearchCommand } from './commands/search.js';
import { createDefaultContext, type CliContext } from './context.js';
import { CliError } from './utils/errors.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

export function createProgram(context: CliContext): Command {
  const program = new Command();

  program
    .name('mslearn')
    .description('CLI for the Microsoft Learn MCP server.')
    .version(context.version)
    .addOption(new Option('--endpoint <url>', 'Override the Learn MCP endpoint for this command.').hideHelp())
    .showHelpAfterError()
    .configureOutput({
      writeOut: context.writeOut,
      writeErr: context.writeErr,
      outputError: (value, write) => {
        write(value);
      },
    });

  registerSearchCommand(program, context);
  registerFetchCommand(program, context);
  registerCodeSearchCommand(program, context);
  registerDoctorCommand(program, context);
  registerAnnotateCommand(program, context);

  return program;
}

export async function runCli(argv = process.argv, overrides: Partial<CliContext> = {}): Promise<number> {
  const baseContext = createDefaultContext(packageJson.version);
  const context: CliContext = {
    ...baseContext,
    ...overrides,
  };
  const userArgs = argv.slice(2);

  const program = createProgram(context);
  const exitHandler = (error: CommanderError): never => {
    throw new CommanderError(error.exitCode === 0 ? 0 : 2, error.code, error.message);
  };
  program.exitOverride(exitHandler);
  for (const sub of program.commands) {
    sub.exitOverride(exitHandler);
  }

  try {
    await program.parseAsync(userArgs, { from: 'user' });
    return 0;
  } catch (error) {
    return handleCliError(error, context);
  }
}

function handleCliError(error: unknown, context: Pick<CliContext, 'writeErr'>): number {
  if (error instanceof CliError) {
    if (!error.quiet && error.message) {
      context.writeErr(`Error: ${error.message}\n`);
    }
    return error.exitCode;
  }

  if (error instanceof CommanderError || isCommanderLikeError(error) || looksLikeUsageError(error)) {
    return isZeroExitError(error) ? 0 : 2;
  }

  const message = error instanceof Error ? error.message : String(error);
  context.writeErr(`Error: ${message}\n`);
  return 1;
}

function isCommanderLikeError(error: unknown): error is { exitCode: number; code?: string; message: string } {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as Record<string, unknown>;
  return typeof maybeError.exitCode === 'number' && typeof maybeError.message === 'string';
}

function looksLikeUsageError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    /(missing required argument|unknown option|too many arguments|option .* argument missing)/i.test(error.message)
  );
}

function isZeroExitError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'exitCode' in error && (error as { exitCode?: unknown }).exitCode === 0;
}

export function resolveMainModuleUrl(argv1: string | undefined = process.argv[1]): string {
  try {
    return pathToFileURL(realpathSync(argv1 ?? '')).href;
  } catch {
    try {
      return pathToFileURL(argv1 ?? '').href;
    } catch {
      return '';
    }
  }
}

const resolvedArgv = resolveMainModuleUrl();

if (import.meta.url === resolvedArgv) {
  const exitCode = await runCli();
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}
