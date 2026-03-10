import type { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

import type { ToolKind } from '../utils/contracts.js';
import { OperationError } from '../utils/errors.js';

export type ListedTool = ListToolsResult['tools'][number];

export interface DiscoveredLearnTools {
  docsSearch: ListedTool;
  docsFetch: ListedTool;
  codeSearch: ListedTool;
}

const EXACT_NAMES: Record<ToolKind, string> = {
  docsSearch: 'microsoft_docs_search',
  docsFetch: 'microsoft_docs_fetch',
  codeSearch: 'microsoft_code_sample_search',
};

export function discoverLearnTools(tools: readonly ListedTool[]): DiscoveredLearnTools {
  const docsSearch = pickBestTool('docsSearch', tools);
  const docsFetch = pickBestTool('docsFetch', tools);
  const codeSearch = pickBestTool('codeSearch', tools);

  return {
    docsSearch,
    docsFetch,
    codeSearch,
  };
}

function pickBestTool(kind: ToolKind, tools: readonly ListedTool[]): ListedTool {
  const exactMatch = tools.find((tool) => tool.name === EXACT_NAMES[kind]);
  if (exactMatch) {
    return exactMatch;
  }

  const ranked = tools
    .map((tool) => ({
      tool,
      score: scoreTool(kind, tool),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const bestMatch = ranked[0]?.tool;
  if (bestMatch) {
    return bestMatch;
  }

  throw new OperationError(`Could not map the Learn MCP ${LABELS[kind]} capability from the current tool list.`);
}

function scoreTool(kind: ToolKind, tool: ListedTool): number {
  const haystack = `${tool.name} ${tool.title ?? ''} ${tool.description ?? ''}`.toLowerCase();
  let score = 0;

  switch (kind) {
    case 'docsSearch':
      if (haystack.includes('search')) {
        score += 3;
      }
      if (haystack.includes('docs') || haystack.includes('documentation')) {
        score += 3;
      }
      if (haystack.includes('fetch')) {
        score -= 5;
      }
      if (haystack.includes('code sample') || haystack.includes('snippet')) {
        score -= 5;
      }
      break;
    case 'docsFetch':
      if (haystack.includes('fetch')) {
        score += 4;
      }
      if (haystack.includes('docs') || haystack.includes('documentation')) {
        score += 2;
      }
      if (haystack.includes('search')) {
        score -= 2;
      }
      break;
    case 'codeSearch':
      if (haystack.includes('search')) {
        score += 3;
      }
      if (haystack.includes('code')) {
        score += 3;
      }
      if (haystack.includes('sample')) {
        score += 2;
      }
      if (haystack.includes('fetch')) {
        score -= 5;
      }
      break;
  }

  return score;
}

const LABELS: Record<ToolKind, string> = {
  docsSearch: 'docs search',
  docsFetch: 'docs fetch',
  codeSearch: 'code search',
};
