import type { DoctorReport } from './contracts.js';

export function ensureTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`;
}

export function formatDoctorText(report: DoctorReport): string {
  const lines = [
    `Overall: ${report.ok ? 'ok' : 'failed'}`,
    `Runtime: Node ${report.runtime.version} (${report.runtime.supported ? 'supported' : 'unsupported'})`,
    `Endpoint: ${report.endpoint}`,
    `Reachability: ${report.reachability.ok ? 'ok' : 'failed'} (${report.reachability.detail})`,
    `MCP connect: ${report.mcp.connected ? 'ok' : 'failed'}`,
    `Tool discovery: ${report.mcp.discovered ? 'ok' : 'failed'}`,
    'Mapped tools:',
    `  search: ${report.tools.docsSearch ?? 'missing'}`,
    `  fetch: ${report.tools.docsFetch ?? 'missing'}`,
    `  code-search: ${report.tools.codeSearch ?? 'missing'}`,
  ];

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return ensureTrailingNewline(lines.join('\n'));
}
