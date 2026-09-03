import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runCli } from '../../src/index.js';
import type { CliContext } from '../../src/context.js';
import type { LearnCliClientLike } from '../../src/mcp/client.js';

function createMockClient(overrides: Partial<LearnCliClientLike> = {}): LearnCliClientLike {
  return {
    searchDocs: vi.fn<LearnCliClientLike['searchDocs']>().mockResolvedValue('{"results":[]}'),
    fetchDocument: vi.fn<LearnCliClientLike['fetchDocument']>().mockResolvedValue(''),
    searchCodeSamples: vi.fn<LearnCliClientLike['searchCodeSamples']>().mockResolvedValue('{"results":[]}'),
    getToolMapping: vi.fn<LearnCliClientLike['getToolMapping']>().mockResolvedValue({
      docsSearch: { name: 'microsoft_docs_search', inputSchema: { type: 'object' } },
      docsFetch: { name: 'microsoft_docs_fetch', inputSchema: { type: 'object' } },
      codeSearch: { name: 'microsoft_code_sample_search', inputSchema: { type: 'object' } },
    }),
    close: vi.fn<LearnCliClientLike['close']>().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createTestContext(client: LearnCliClientLike): {
  context: Partial<CliContext>;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    context: {
      env: {},
      version: '0.1.0-test',
      writeOut: (value) => {
        stdout.push(value);
      },
      writeErr: (value) => {
        stderr.push(value);
      },
      createClient: () => client,
    },
    stdout,
    stderr,
  };
}

async function createFilesystemTestContext(): Promise<{
  context: Partial<CliContext>;
  stdout: string[];
  stderr: string[];
  cwd: string;
  homeDir: string;
  cleanup: () => Promise<void>;
}> {
  const root = await mkdtemp(join(tmpdir(), 'mslearn-cli-test-'));
  const cwd = join(root, 'project');
  const homeDir = join(root, 'home');
  await Promise.all([mkdir(cwd, { recursive: true }), mkdir(homeDir, { recursive: true })]);

  const testContext = createTestContext(createMockClient());
  return {
    ...testContext,
    cwd,
    homeDir,
    context: {
      ...testContext.context,
      cwd,
      homeDir,
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface DiscoveryAgentCase {
  name: string;
  flag: string;
  globalSkill: (cwd: string, homeDir: string) => string;
  projectSkill: (cwd: string, homeDir: string) => string;
}

const discoveryAgentCases: DiscoveryAgentCase[] = [
  {
    name: 'GitHub Copilot',
    flag: '--copilot',
    globalSkill: (cwd, homeDir) =>
      join(homeDir, '.copilot', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
    projectSkill: (cwd) =>
      join(cwd, '.github', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
  },
  {
    name: 'Claude Code',
    flag: '--claude',
    globalSkill: (cwd, homeDir) =>
      join(homeDir, '.claude', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
    projectSkill: (cwd) =>
      join(cwd, '.claude', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
  },
  {
    name: 'Codex',
    flag: '--codex',
    globalSkill: (cwd, homeDir) =>
      join(homeDir, '.agents', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
    projectSkill: (cwd) =>
      join(cwd, '.agents', 'skills', 'microsoft-learn-cli', 'SKILL.md'),
  },
];

const discoveryScopeCases = discoveryAgentCases.flatMap((agent) => [
  {
    name: `${agent.name} global`,
    displayName: agent.name,
    flag: agent.flag,
    args: [] as string[],
    skill: agent.globalSkill,
  },
  {
    name: `${agent.name} project`,
    displayName: agent.name,
    flag: agent.flag,
    args: ['--project'],
    skill: agent.projectSkill,
  },
]);

describe('runCli', () => {
  it('keeps the internal endpoint override out of public help output', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', '--help'], context);

    expect(exitCode).toBe(0);
    expect(stdout.join('')).not.toContain('--endpoint <url>');
  });

  it('lists setup and remove discovery commands in public help', async () => {
    const client = createMockClient();
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', '--help'], context);

    expect(exitCode).toBe(0);
    const output = stdout.join('');
    expect(output).toContain('setup');
    expect(output).toContain('Install agent discovery');
    expect(output).toContain('remove');
    expect(output).toContain('Remove agent discovery');
  });

  it('formats search results with one result per block', async () => {
    const client = createMockClient({
      searchDocs: vi
        .fn()
        .mockResolvedValue(
          '{"results":[{"title":"Azure Functions runtime versions overview","contentUrl":"https://learn.microsoft.com/example","content":"The functionTimeout property in host.json sets the timeout duration."}]}',
        ),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search', 'azure functions timeout'], context);

    expect(exitCode).toBe(0);
    const output = stdout.join('');
    expect(output).toContain('[1] Azure Functions runtime versions overview');
    expect(output).toContain('https://learn.microsoft.com/example');
    expect(output).toContain('The functionTimeout property in host.json sets the timeout duration.');
  });

  it('outputs raw JSON from search when --json is passed', async () => {
    const rawPayload =
      '{"results":[{"title":"Test","contentUrl":"https://learn.microsoft.com/example","content":"Body."}]}';
    const client = createMockClient({
      searchDocs: vi.fn().mockResolvedValue(rawPayload),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search', 'test query', '--json'], context);

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.join(''))).toEqual(JSON.parse(rawPayload));
  });

  it('outputs raw JSON from code-search when --json is passed', async () => {
    const rawPayload =
      '{"results":[{"description":"desc","codeSnippet":"x = 1","link":"https://example.com","language":"python"}]}';
    const client = createMockClient({
      searchCodeSamples: vi.fn().mockResolvedValue(rawPayload),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'code-search', 'test query', '--json'], context);

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout.join(''))).toEqual(JSON.parse(rawPayload));
  });

  it('filters fetched markdown by section', async () => {
    const client = createMockClient({
      fetchDocument: vi.fn().mockResolvedValue(['# Title', '', '## Usage', 'Use it here.', '', '## Next', 'Done.'].join('\n')),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(
      ['node', 'mslearn', 'fetch', 'https://learn.microsoft.com/example', '--section', 'Usage'],
      context,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('## Usage');
    expect(stdout.join('')).not.toContain('## Next');
  });

  it('returns a non-zero doctor exit code when required checks fail', async () => {
    const client = createMockClient({
      getToolMapping: vi.fn().mockRejectedValue(new Error('tool mapping failed')),
    });
    const { context, stdout } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'doctor', '--format', 'json'], context);

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout.join('')).ok).toBe(false);
  });

  it('forces a fresh connection check in doctor instead of using cached tool mappings', async () => {
    const getToolMapping = vi.fn<LearnCliClientLike['getToolMapping']>().mockResolvedValue({
      docsSearch: { name: 'microsoft_docs_search', inputSchema: { type: 'object' } },
      docsFetch: { name: 'microsoft_docs_fetch', inputSchema: { type: 'object' } },
      codeSearch: { name: 'microsoft_code_sample_search', inputSchema: { type: 'object' } },
    });
    const client = createMockClient({ getToolMapping });
    const { context } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'doctor'], context);

    expect(exitCode).toBe(0);
    expect(getToolMapping).toHaveBeenCalledWith(true);
  });

  it('returns a usage error for missing required arguments', async () => {
    const client = createMockClient();
    const { context, stderr } = createTestContext(client);

    const exitCode = await runCli(['node', 'mslearn', 'search'], context);

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('missing required argument');
  });

  it.each(['setup', 'remove'])('requires --cli for %s', async (command) => {
    const { context, stderr } = createTestContext(createMockClient());

    const exitCode = await runCli(['node', 'mslearn', command, '--copilot'], context);

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('--cli is required');
  });

  it('requires an explicit target when setup detects no supported agents', async () => {
    const test = await createFilesystemTestContext();

    try {
      const exitCode = await runCli(
        ['node', 'mslearn', 'setup', '--cli', '--project'],
        test.context,
      );

      expect(exitCode).toBe(2);
      expect(test.stderr.join('')).toContain('No supported agents detected');
      expect(test.stderr.join('')).toContain('--copilot, --claude, or --codex');
    } finally {
      await test.cleanup();
    }
  });

  it('requires an explicit target when remove detects no managed discovery', async () => {
    const test = await createFilesystemTestContext();

    try {
      await Promise.all([
        mkdir(join(test.cwd, '.github'), { recursive: true }),
        mkdir(join(test.cwd, '.claude'), { recursive: true }),
        mkdir(join(test.cwd, '.codex'), { recursive: true }),
      ]);

      const exitCode = await runCli(
        ['node', 'mslearn', 'remove', '--cli', '--project'],
        test.context,
      );

      expect(exitCode).toBe(2);
      expect(test.stderr.join('')).toContain('No Microsoft Learn CLI agent discovery detected');
      expect(test.stderr.join('')).toContain('--copilot, --claude, or --codex');
    } finally {
      await test.cleanup();
    }
  });

  it.each(discoveryScopeCases)('installs CLI-first discovery for $name', async ({
    flag,
    args,
    skill,
    displayName,
  }) => {
    const test = await createFilesystemTestContext();

    try {
      const exitCode = await runCli(
        ['node', 'mslearn', 'setup', '--cli', flag, ...args],
        test.context,
      );
      const skillPath = skill(test.cwd, test.homeDir);

      expect(exitCode).toBe(0);
      const output = test.stdout.join('');
      expect(output).toContain(`  ${displayName}`);
      expect(output).toContain('    + Skill installed');
      expect(output).toContain(skillPath);

      const skillContent = await readFile(skillPath, 'utf8');
      expect(skillContent).toContain('---');
      expect(skillContent).toContain('search');
      expect(skillContent).toContain('fetch');
      expect(skillContent).toContain('code-search');
      expect(skillContent).toContain('Prefer Microsoft Learn MCP tools when they are available');
    } finally {
      await test.cleanup();
    }
  });

  it('installs multiple explicitly selected agents in one command', async () => {
    const test = await createFilesystemTestContext();

    try {
      const exitCode = await runCli(
        [
          'node',
          'mslearn',
          'setup',
          '--cli',
          '--copilot',
          '--claude',
          '--codex',
          '--project',
        ],
        test.context,
      );

      expect(exitCode).toBe(0);
      for (const agent of discoveryAgentCases) {
        expect(await fileExists(agent.projectSkill(test.cwd, test.homeDir))).toBe(true);
      }
    } finally {
      await test.cleanup();
    }
  });

  it('auto-detects installed agents from their project directories', async () => {
    const test = await createFilesystemTestContext();

    try {
      await Promise.all([
        mkdir(join(test.cwd, '.github'), { recursive: true }),
        mkdir(join(test.cwd, '.codex'), { recursive: true }),
      ]);

      expect(
        await runCli(
          ['node', 'mslearn', 'setup', '--cli', '--project'],
          test.context,
        ),
      ).toBe(0);

      expect(test.stdout.join('')).toContain('Detected: GitHub Copilot, Codex');
      expect(await fileExists(discoveryAgentCases[0].projectSkill(test.cwd, test.homeDir))).toBe(
        true,
      );
      expect(await fileExists(discoveryAgentCases[1].projectSkill(test.cwd, test.homeDir))).toBe(
        false,
      );
      expect(await fileExists(discoveryAgentCases[2].projectSkill(test.cwd, test.homeDir))).toBe(
        true,
      );
    } finally {
      await test.cleanup();
    }
  });

  it('uses explicit setup targets instead of combining them with detected agents', async () => {
    const test = await createFilesystemTestContext();

    try {
      await mkdir(join(test.cwd, '.claude'), { recursive: true });

      expect(
        await runCli(
          ['node', 'mslearn', 'setup', '--cli', '--copilot', '--project'],
          test.context,
        ),
      ).toBe(0);

      expect(test.stdout.join('')).not.toContain('Detected:');
      expect(await fileExists(discoveryAgentCases[0].projectSkill(test.cwd, test.homeDir))).toBe(
        true,
      );
      expect(await fileExists(discoveryAgentCases[1].projectSkill(test.cwd, test.homeDir))).toBe(
        false,
      );
    } finally {
      await test.cleanup();
    }
  });

  it('refreshes managed skill content when setup is repeated', async () => {
    const test = await createFilesystemTestContext();
    const skillPath = join(test.cwd, '.github', 'skills', 'microsoft-learn-cli', 'SKILL.md');

    try {
      const args = ['node', 'mslearn', 'setup', '--cli', '--copilot', '--project'];
      expect(await runCli(args, test.context)).toBe(0);
      await writeFile(skillPath, 'stale skill', 'utf8');

      expect(await runCli(args, test.context)).toBe(0);

      const bundledSkill = await readFile(new URL('../../assets/microsoft-learn-cli/SKILL.md', import.meta.url), 'utf8');
      expect(await readFile(skillPath, 'utf8')).toBe(bundledSkill);
    } finally {
      await test.cleanup();
    }
  });

  it('does not create or modify always-loaded agent instructions', async () => {
    const test = await createFilesystemTestContext();
    const agentsFile = join(test.cwd, 'AGENTS.md');
    const copilotInstruction = join(
      test.cwd,
      '.github',
      'instructions',
      'microsoft-learn-cli.instructions.md',
    );
    const claudeRule = join(test.cwd, '.claude', 'rules', 'microsoft-learn-cli.md');
    const originalContent = '# Existing instructions\n';

    try {
      await Promise.all([
        mkdir(join(test.cwd, '.github', 'instructions'), { recursive: true }),
        mkdir(join(test.cwd, '.claude', 'rules'), { recursive: true }),
      ]);
      await Promise.all([
        writeFile(agentsFile, originalContent, 'utf8'),
        writeFile(copilotInstruction, originalContent, 'utf8'),
        writeFile(claudeRule, originalContent, 'utf8'),
      ]);

      expect(
        await runCli(
          [
            'node',
            'mslearn',
            'setup',
            '--cli',
            '--copilot',
            '--claude',
            '--codex',
            '--project',
          ],
          test.context,
        ),
      ).toBe(0);
      expect(
        await runCli(
          [
            'node',
            'mslearn',
            'remove',
            '--cli',
            '--copilot',
            '--claude',
            '--codex',
            '--project',
          ],
          test.context,
        ),
      ).toBe(0);

      expect(await readFile(agentsFile, 'utf8')).toBe(originalContent);
      expect(await readFile(copilotInstruction, 'utf8')).toBe(originalContent);
      expect(await readFile(claudeRule, 'utf8')).toBe(originalContent);
    } finally {
      await test.cleanup();
    }
  });

  it.each(discoveryScopeCases)('removes managed discovery for $name idempotently', async ({
    flag,
    args,
    skill,
    displayName,
  }) => {
    const test = await createFilesystemTestContext();
    const setupArgs = ['node', 'mslearn', 'setup', '--cli', flag, ...args];
    const removeArgs = ['node', 'mslearn', 'remove', '--cli', flag, ...args];
    const skillPath = skill(test.cwd, test.homeDir);

    try {
      expect(await runCli(setupArgs, test.context)).toBe(0);
      expect(await runCli(removeArgs, test.context)).toBe(0);
      expect(await fileExists(skillPath)).toBe(false);
      const output = test.stdout.join('');
      expect(output).toContain(`  ${displayName}`);
      expect(output).toContain('    - Skill removed');
      expect(await runCli(removeArgs, test.context)).toBe(0);
      expect(test.stdout.join('')).toContain('    ~ Skill not found');
    } finally {
      await test.cleanup();
    }
  });

  it('auto-detects only agents with managed discovery during removal', async () => {
    const test = await createFilesystemTestContext();

    try {
      await mkdir(join(test.cwd, '.claude'), { recursive: true });
      expect(
        await runCli(
          [
            'node',
            'mslearn',
            'setup',
            '--cli',
            '--copilot',
            '--codex',
            '--project',
          ],
          test.context,
        ),
      ).toBe(0);
      test.stdout.length = 0;

      expect(
        await runCli(
          ['node', 'mslearn', 'remove', '--cli', '--project'],
          test.context,
        ),
      ).toBe(0);

      const output = test.stdout.join('');
      expect(output).toContain('Detected: GitHub Copilot, Codex');
      expect(output).not.toContain('Claude Code');
      expect(await fileExists(discoveryAgentCases[0].projectSkill(test.cwd, test.homeDir))).toBe(
        false,
      );
      expect(await fileExists(discoveryAgentCases[2].projectSkill(test.cwd, test.homeDir))).toBe(
        false,
      );
    } finally {
      await test.cleanup();
    }
  });

  it.each([
    {
      name: 'global',
      args: [] as string[],
      root: (cwd: string, homeDir: string) => join(homeDir, '.copilot'),
    },
    {
      name: 'project',
      args: ['--project'],
      root: (cwd: string) => join(cwd, '.github'),
    },
  ])('preserves unrelated files during $name removal', async ({ args, root }) => {
    const test = await createFilesystemTestContext();
    const discoveryRoot = root(test.cwd, test.homeDir);
    const skillDirectory = join(discoveryRoot, 'skills', 'microsoft-learn-cli');
    const instructionsDirectory = join(discoveryRoot, 'instructions');
    const unrelatedFiles = [
      join(discoveryRoot, 'keep.txt'),
      join(skillDirectory, 'NOTES.md'),
      join(instructionsDirectory, 'keep.instructions.md'),
    ];

    try {
      expect(
        await runCli(['node', 'mslearn', 'setup', '--cli', '--copilot', ...args], test.context),
      ).toBe(0);
      await mkdir(instructionsDirectory, { recursive: true });
      await Promise.all(unrelatedFiles.map((path) => writeFile(path, 'keep', 'utf8')));

      expect(
        await runCli(['node', 'mslearn', 'remove', '--cli', '--copilot', ...args], test.context),
      ).toBe(0);

      for (const path of unrelatedFiles) {
        expect(await readFile(path, 'utf8')).toBe('keep');
      }
    } finally {
      await test.cleanup();
    }
  });

  it.each(discoveryAgentCases)('isolates global and project removal scopes for $name', async (agent) => {
    const test = await createFilesystemTestContext();
    const globalSkill = agent.globalSkill(test.cwd, test.homeDir);
    const projectSkill = agent.projectSkill(test.cwd, test.homeDir);

    try {
      expect(
        await runCli(['node', 'mslearn', 'setup', '--cli', agent.flag], test.context),
      ).toBe(0);
      expect(
        await runCli(
          ['node', 'mslearn', 'setup', '--cli', agent.flag, '--project'],
          test.context,
        ),
      ).toBe(0);

      expect(
        await runCli(
          ['node', 'mslearn', 'remove', '--cli', agent.flag, '--project'],
          test.context,
        ),
      ).toBe(0);
      expect(await fileExists(globalSkill)).toBe(true);
      expect(await fileExists(projectSkill)).toBe(false);

      expect(
        await runCli(
          ['node', 'mslearn', 'setup', '--cli', agent.flag, '--project'],
          test.context,
        ),
      ).toBe(0);
      expect(
        await runCli(['node', 'mslearn', 'remove', '--cli', agent.flag], test.context),
      ).toBe(0);
      expect(await fileExists(globalSkill)).toBe(false);
      expect(await fileExists(projectSkill)).toBe(true);
    } finally {
      await test.cleanup();
    }
  });

  it('includes discovery assets in the npm package allowlist', async () => {
    const packageJson = JSON.parse(
      await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { files?: string[] };

    expect(packageJson.files).toContain('assets');
  });
});
