import { Command } from 'commander';

import type { CliContext } from '../context.js';
import { probeEndpoint } from '../mcp/client.js';
import type { DoctorReport, DoctorFormat } from '../utils/contracts.js';
import { SilentCliError } from '../utils/errors.js';
import { parseDoctorFormat, resolveEndpoint } from '../utils/options.js';
import { formatDoctorText } from '../utils/text.js';

interface DoctorCommandOptions {
  format: DoctorFormat;
}

export function registerDoctorCommand(program: Command, context: CliContext): void {
  program
    .command('doctor')
    .description('Verify runtime, endpoint reachability, MCP connection, and tool discovery.')
    .option('--format <format>', 'Output format: text or json.', parseDoctorFormat, 'text')
    .action(async (options: DoctorCommandOptions) => {
      const endpoint = resolveEndpoint(program.opts<{ endpoint?: string }>().endpoint, context.env);
      const report = await runDoctorChecks(endpoint, context);

      if (options.format === 'json') {
        context.writeOut(`${JSON.stringify(report, null, 2)}\n`);
      } else {
        context.writeOut(formatDoctorText(report));
      }

      if (!report.ok) {
        throw new SilentCliError(1);
      }
    });
}

async function runDoctorChecks(endpoint: string, context: CliContext): Promise<DoctorReport> {
  const runtimeVersion = process.versions.node;
  const runtimeSupported = Number.parseInt(runtimeVersion.split('.')[0] ?? '0', 10) >= 22;
  const reachability = await probeEndpoint(endpoint, context.fetchImpl);
  const errors: string[] = [];
  const tools: DoctorReport['tools'] = {};
  let connected = false;
  let discovered = false;

  const client = context.createClient({
    endpoint,
    clientName: 'mslearn',
    clientVersion: context.version,
  });

  try {
    const mapping = await client.getToolMapping(true);
    connected = true;
    discovered = true;
    tools.docsSearch = mapping.docsSearch.name;
    tools.docsFetch = mapping.docsFetch.name;
    tools.codeSearch = mapping.codeSearch.name;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await client.close();
  }

  if (!runtimeSupported) {
    errors.push(`Node ${runtimeVersion} is below the supported floor of Node 22.`);
  }

  if (!reachability.ok) {
    errors.push(`Endpoint reachability failed: ${reachability.detail}`);
  }

  const ok =
    runtimeSupported &&
    reachability.ok &&
    connected &&
    discovered &&
    Boolean(tools.docsSearch && tools.docsFetch && tools.codeSearch);

  return {
    ok,
    endpoint,
    runtime: {
      version: runtimeVersion,
      supported: runtimeSupported,
    },
    reachability,
    mcp: {
      connected,
      discovered,
    },
    tools,
    errors,
  };
}
