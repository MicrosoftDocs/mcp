#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates the repository structure for the Claude plugin, agent skills, MCP config, and CLI.

.DESCRIPTION
    This script validates that all required files and folders exist for:
    
    1. Claude Plugin (.claude-plugin/)
       - marketplace.json  : Plugin metadata for Claude marketplace
       - plugin.json       : Plugin configuration and capabilities
    
    2. Agent Skills (skills/)
       - Each subfolder must contain a SKILL.md file describing the skill
       - Skills help AI agents use MCP tools more effectively
     
    3. MCP Configuration (.mcp.json)
       - Root-level MCP server configuration

    4. CLI (cli/)
       - TypeScript source, tests, and package metadata for the in-repo Learn CLI

    Run this script to verify your changes before submitting a PR.

.EXAMPLE
    ./scripts/validate-repo.ps1
#>

$ErrorActionPreference = "Stop"
$script:hasErrors = $false
$repoRoot = Split-Path -Parent $PSScriptRoot

function Write-ValidationError($message) {
    Write-Host "❌ ERROR: $message" -ForegroundColor Red
    $script:hasErrors = $true
}

function Write-ValidationSuccess($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-ValidationHeader($message) {
    Write-Host "`n📋 $message" -ForegroundColor Cyan
    Write-Host ("-" * 50) -ForegroundColor Gray
}

function Test-ValidJson($path) {
    try {
        $null = Get-Content $path -Raw | ConvertFrom-Json
        return $true
    } catch {
        return $false
    }
}

# ============================================================================
# Validation 1: Claude Plugin Files
# The .claude-plugin folder contains configuration for Claude marketplace
# ============================================================================
Write-ValidationHeader "Validating Claude Plugin (.claude-plugin/)"

$claudePluginFiles = @(
    "marketplace.json",  # Plugin metadata (name, description, author, etc.)
    "plugin.json"        # Plugin capabilities and MCP server reference
)

foreach ($file in $claudePluginFiles) {
    $path = Join-Path $repoRoot ".claude-plugin" $file
    if (Test-Path $path) {
        Write-ValidationSuccess "Found: .claude-plugin/$file"
        if (Test-ValidJson $path) {
            Write-ValidationSuccess "Valid JSON: .claude-plugin/$file"
        } else {
            Write-ValidationError "Invalid JSON: .claude-plugin/$file"
        }
    } else {
        Write-ValidationError "Missing: .claude-plugin/$file"
    }
}

# ============================================================================
# Validation 2: Agent Skills Structure
# Each skill folder under /skills must have a SKILL.md describing the skill
# ============================================================================
Write-ValidationHeader "Validating Agent Skills (skills/)"

$skillsDir = Join-Path $repoRoot "skills"

if (-not (Test-Path $skillsDir)) {
    Write-ValidationError "Missing: skills/ directory"
} else {
    $skillFolders = Get-ChildItem -Path $skillsDir -Directory
    
    if ($skillFolders.Count -eq 0) {
        Write-ValidationError "No skill folders found in skills/"
    } else {
        foreach ($folder in $skillFolders) {
            $skillMd = Join-Path $folder.FullName "SKILL.md"
            if (Test-Path $skillMd) {
                Write-ValidationSuccess "Found: skills/$($folder.Name)/SKILL.md"
            } else {
                Write-ValidationError "Missing: skills/$($folder.Name)/SKILL.md - Each skill folder must have a SKILL.md file"
            }
        }
    }
}

# ============================================================================
# Validation 3: MCP Configuration
# The .mcp.json file at repo root defines MCP server settings
# ============================================================================
Write-ValidationHeader "Validating MCP Configuration (.mcp.json)"

$mcpJsonPath = Join-Path $repoRoot ".mcp.json"
if (Test-Path $mcpJsonPath) {
    Write-ValidationSuccess "Found: .mcp.json"
    if (Test-ValidJson $mcpJsonPath) {
        Write-ValidationSuccess "Valid JSON: .mcp.json"
    } else {
        Write-ValidationError "Invalid JSON: .mcp.json"
    }
} else {
    Write-ValidationError "Missing: .mcp.json at repository root"
}

# ============================================================================
# Validation 4: CLI Structure
# The cli folder contains the open source CLI implementation
# ============================================================================
Write-ValidationHeader "Validating CLI (cli/)"

$cliDir = Join-Path $repoRoot "cli"
if (-not (Test-Path $cliDir)) {
    Write-ValidationError "Missing: cli/ directory"
} else {
    Write-ValidationSuccess "Found: cli/ directory"

    $cliJsonFiles = @(
        "package.json",
        "tsconfig.json"
    )

    foreach ($file in $cliJsonFiles) {
        $path = Join-Path $cliDir $file
        if (Test-Path $path) {
            Write-ValidationSuccess "Found: cli/$file"
            if (Test-ValidJson $path) {
                Write-ValidationSuccess "Valid JSON: cli/$file"
            } else {
                Write-ValidationError "Invalid JSON: cli/$file"
            }
        } else {
            Write-ValidationError "Missing: cli/$file"
        }
    }

    $cliRequiredFiles = @(
        "README.md",
        "src/index.ts",
        "src/commands/search.ts",
        "src/commands/fetch.ts",
        "src/commands/code-search.ts",
        "src/commands/doctor.ts",
        "src/mcp/client.ts",
        "src/mcp/tool-discovery.ts",
        "test/unit/cli.test.ts"
    )

    foreach ($file in $cliRequiredFiles) {
        $path = Join-Path $cliDir $file
        if (Test-Path $path) {
            Write-ValidationSuccess "Found: cli/$file"
        } else {
            Write-ValidationError "Missing: cli/$file"
        }
    }
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n" ("-" * 50) -ForegroundColor Gray
if ($script:hasErrors) {
    Write-Host "❌ Validation FAILED - Please fix the errors above" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All validations PASSED" -ForegroundColor Green
    exit 0
}
