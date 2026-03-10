export const DEFAULT_ENDPOINT = 'https://learn.microsoft.com/api/mcp';

export const DOCTOR_FORMATS = ['text', 'json'] as const;

export type DoctorFormat = (typeof DOCTOR_FORMATS)[number];
export type ToolKind = 'docsSearch' | 'docsFetch' | 'codeSearch';

export interface ReachabilityReport {
  ok: boolean;
  status?: number;
  detail: string;
}

export interface DoctorReport {
  ok: boolean;
  endpoint: string;
  runtime: {
    version: string;
    supported: boolean;
  };
  reachability: ReachabilityReport;
  mcp: {
    connected: boolean;
    discovered: boolean;
  };
  tools: {
    docsSearch?: string;
    docsFetch?: string;
    codeSearch?: string;
  };
  errors: string[];
}
