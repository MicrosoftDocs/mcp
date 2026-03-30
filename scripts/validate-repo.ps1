#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates the repository structure for the Claude plugin, the repo-local Codex plugin, agent skills, MCP config, and CLI.

.DESCRIPTION
    This script validates that all required files and folders exist for:
    
    1. Claude Plugin (.claude-plugin/)
       - marketplace.json  : Plugin metadata for Claude marketplace
       - plugin.json       : Plugin configuration and capabilities

    1b. Codex Plugin (repo-local)
        - .agents/plugins/marketplace.json : Local marketplace entry that makes the plugin appear in `codex /plugins`
        - .codex-plugin/plugin.json        : Plugin manifest for the repo-root OpenAI Codex plugin
    
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
# Validation 1b: Plugin JSON Sync
# .claude-plugin/plugin.json and .github/plugin/plugin.json must stay in sync.
# .claude-plugin/plugin.json is the source of truth; .github/plugin/plugin.json
# is consumed by GitHub and must mirror it exactly.
# ============================================================================
Write-ValidationHeader "Validating plugin.json sync"

$claudePluginJson = Join-Path $repoRoot ".claude-plugin" "plugin.json"
$githubPluginJson = Join-Path $repoRoot ".github" "plugin" "plugin.json"

if ((Test-Path $claudePluginJson) -and (Test-Path $githubPluginJson)) {
    $claudeContent = Get-Content $claudePluginJson -Raw
    $githubContent = Get-Content $githubPluginJson -Raw
    if ($claudeContent -eq $githubContent) {
        Write-ValidationSuccess "plugin.json files are in sync (.claude-plugin/ and .github/plugin/)"
    } else {
        Write-ValidationError "plugin.json drift detected: .claude-plugin/plugin.json and .github/plugin/plugin.json differ. Update both files or copy from the source of truth (.claude-plugin/plugin.json)."
    }
} elseif (-not (Test-Path $githubPluginJson)) {
    Write-ValidationError "Missing: .github/plugin/plugin.json"
} else {
    # .claude-plugin/plugin.json missing is already reported in Validation 1
}

# ============================================================================
# Validation 1c: Codex Plugin Files
# Codex uses a repo-local marketplace entry that points at the repository root,
# where `.codex-plugin/plugin.json` defines the plugin shown in `codex /plugins`.
# ============================================================================
Write-ValidationHeader "Validating Codex Plugin (repo-local marketplace)"

$codexPluginName = "microsoft-docs"
$codexMarketplaceJson = Join-Path $repoRoot ".agents" "plugins" "marketplace.json"
$codexPluginDir = $repoRoot
$codexPluginJson = Join-Path $codexPluginDir ".codex-plugin" "plugin.json"

if (Test-Path $codexMarketplaceJson) {
    Write-ValidationSuccess "Found: .agents/plugins/marketplace.json"
    if (Test-ValidJson $codexMarketplaceJson) {
        Write-ValidationSuccess "Valid JSON: .agents/plugins/marketplace.json"
    } else {
        Write-ValidationError "Invalid JSON: .agents/plugins/marketplace.json"
    }
} else {
    Write-ValidationError "Missing: .agents/plugins/marketplace.json"
}

if (Test-Path $codexPluginJson) {
    Write-ValidationSuccess "Found: .codex-plugin/plugin.json"
    if (Test-ValidJson $codexPluginJson) {
        Write-ValidationSuccess "Valid JSON: .codex-plugin/plugin.json"
    } else {
        Write-ValidationError "Invalid JSON: .codex-plugin/plugin.json"
    }
} else {
    Write-ValidationError "Missing: .codex-plugin/plugin.json"
}

# ============================================================================
# Validation 1d: Codex Marketplace Wiring
# The local marketplace entry must point to the repository root plugin and
# include the policy fields required for Codex to show the plugin in /plugins.
# ============================================================================
Write-ValidationHeader "Validating Codex marketplace wiring"

if ((Test-Path $codexMarketplaceJson) -and (Test-ValidJson $codexMarketplaceJson)) {
    $marketplaceObj = Get-Content $codexMarketplaceJson -Raw | ConvertFrom-Json
    $marketplaceEntry = $marketplaceObj.plugins | Where-Object { $_.name -eq $codexPluginName } | Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($marketplaceObj.name) -or $marketplaceObj.name.StartsWith("[TODO:")) {
        Write-ValidationError "Codex marketplace root 'name' must be set to a real value."
    } else {
        Write-ValidationSuccess "Codex marketplace root name is set"
    }

    if ([string]::IsNullOrWhiteSpace($marketplaceObj.interface.displayName) -or $marketplaceObj.interface.displayName.StartsWith("[TODO:")) {
        Write-ValidationError "Codex marketplace interface.displayName must be set to a real value."
    } else {
        Write-ValidationSuccess "Codex marketplace display name is set"
    }

    if ($null -eq $marketplaceEntry) {
        Write-ValidationError "Missing plugin entry '$codexPluginName' in .agents/plugins/marketplace.json"
    } else {
        Write-ValidationSuccess "Found marketplace entry for '$codexPluginName'"

        if ($marketplaceEntry.source.source -ne "local") {
            Write-ValidationError "Codex marketplace entry '$codexPluginName' must use source.source = 'local'."
        } else {
            Write-ValidationSuccess "Codex marketplace entry uses local source"
        }

        $expectedPluginPath = "./"
        if ($marketplaceEntry.source.path -ne $expectedPluginPath) {
            Write-ValidationError "Codex marketplace entry '$codexPluginName' must use source.path = '$expectedPluginPath'."
        } else {
            Write-ValidationSuccess "Codex marketplace entry points to $expectedPluginPath"
        }

        if ([string]::IsNullOrWhiteSpace($marketplaceEntry.policy.installation)) {
            Write-ValidationError "Codex marketplace entry '$codexPluginName' is missing policy.installation."
        } else {
            Write-ValidationSuccess "Codex marketplace entry includes policy.installation"
        }

        if ([string]::IsNullOrWhiteSpace($marketplaceEntry.policy.authentication)) {
            Write-ValidationError "Codex marketplace entry '$codexPluginName' is missing policy.authentication."
        } else {
            Write-ValidationSuccess "Codex marketplace entry includes policy.authentication"
        }

        if ([string]::IsNullOrWhiteSpace($marketplaceEntry.category)) {
            Write-ValidationError "Codex marketplace entry '$codexPluginName' is missing category."
        } else {
            Write-ValidationSuccess "Codex marketplace entry includes category"
        }
    }
}

# ============================================================================
# Validation 1e: Codex Plugin JSON Sync
# The shared fields in the repo-root Codex plugin.json must match the source of
# truth (.claude-plugin/plugin.json). The Codex file may have additional fields
# (skills, mcpServers, interface) that are not present in the Claude file.
# ============================================================================
Write-ValidationHeader "Validating Codex plugin.json sync"

if ((Test-Path $claudePluginJson) -and (Test-Path $codexPluginJson) -and (Test-ValidJson $codexPluginJson)) {
    $claudeObj = Get-Content $claudePluginJson -Raw | ConvertFrom-Json
    $codexObj  = Get-Content $codexPluginJson  -Raw | ConvertFrom-Json

    $sharedKeys = @("name", "description", "version", "homepage", "repository")
    $syncOk = $true

    foreach ($key in $sharedKeys) {
        $claudeVal = $claudeObj.$key
        $codexVal  = $codexObj.$key
        if ("$claudeVal" -ne "$codexVal") {
            Write-ValidationError "Codex plugin.json field '$key' differs from source of truth (.claude-plugin/plugin.json). Expected '$claudeVal', got '$codexVal'."
            $syncOk = $false
        }
    }

    if ($claudeObj.author.name -ne $codexObj.author.name) {
        Write-ValidationError "Codex plugin.json field 'author.name' differs from source of truth. Expected '$($claudeObj.author.name)', got '$($codexObj.author.name)'."
        $syncOk = $false
    }

    $claudeKw = ($claudeObj.keywords | Sort-Object) -join ","
    $codexKw  = ($codexObj.keywords  | Sort-Object) -join ","
    if ($claudeKw -ne $codexKw) {
        Write-ValidationError "Codex plugin.json 'keywords' differ from source of truth (.claude-plugin/plugin.json)."
        $syncOk = $false
    }

    $codexPluginRoot = $codexPluginDir
    $skillsPath = ([System.IO.Path]::GetFullPath((Join-Path $codexPluginRoot $codexObj.skills))).TrimEnd('\', '/')
    $mcpServersPath = ([System.IO.Path]::GetFullPath((Join-Path $codexPluginRoot $codexObj.mcpServers))).TrimEnd('\', '/')
    $repoMcpJsonPath = ([System.IO.Path]::GetFullPath((Join-Path $repoRoot ".mcp.json"))).TrimEnd('\', '/')
    $repoSkillsPath = ([System.IO.Path]::GetFullPath((Join-Path $repoRoot "skills"))).TrimEnd('\', '/')

    if ($codexObj.skills -ne "./skills/") {
        Write-ValidationError "Codex plugin.json field 'skills' must be './skills/'."
        $syncOk = $false
    } elseif (-not (Test-Path $skillsPath)) {
        Write-ValidationError "Codex plugin.json 'skills' path does not resolve to an existing directory: $skillsPath"
        $syncOk = $false
    } elseif ($skillsPath -ne $repoSkillsPath) {
        Write-ValidationError "Codex plugin.json 'skills' path must resolve to the repo root skills directory: $repoSkillsPath"
        $syncOk = $false
    } else {
        Write-ValidationSuccess "Codex plugin.json skills path resolves to repo root skills/"
    }

    if ($codexObj.mcpServers -ne "./.mcp.json") {
        Write-ValidationError "Codex plugin.json field 'mcpServers' must be './.mcp.json'."
        $syncOk = $false
    } elseif (-not (Test-Path $mcpServersPath)) {
        Write-ValidationError "Codex plugin.json 'mcpServers' path does not resolve to an existing file: $mcpServersPath"
        $syncOk = $false
    } elseif ($mcpServersPath -ne $repoMcpJsonPath) {
        Write-ValidationError "Codex plugin.json 'mcpServers' path must resolve to repo root .mcp.json: $repoMcpJsonPath"
        $syncOk = $false
    } else {
        Write-ValidationSuccess "Codex plugin.json MCP server path resolves to repo root .mcp.json"
    }

    if ($codexObj.name -ne $codexPluginName) {
        Write-ValidationError "Codex plugin.json name must be '$codexPluginName'."
        $syncOk = $false
    }

    if ($syncOk) {
        Write-ValidationSuccess "Codex plugin.json is in sync with source of truth and wired to repo-root assets"
    }
} elseif (-not (Test-Path $codexPluginJson)) {
    # Already reported above
} else {
    # .claude-plugin/plugin.json missing is already reported in Validation 1
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
