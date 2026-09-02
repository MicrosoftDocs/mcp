#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates the repository structure for the Microsoft Docs plugin package.

.DESCRIPTION
    The repo exposes one shared plugin package under plugins/microsoft-docs/
    and root-level marketplace/shim files for Codex, Claude Code, and GitHub
    Copilot CLI.
#>

$ErrorActionPreference = "Stop"
$script:HasErrors = $false
$repoRoot = Split-Path -Parent $PSScriptRoot

$pluginName = "microsoft-docs"
$pluginDir = Join-Path (Join-Path $repoRoot "plugins") "microsoft-docs"
$skillsDir = Join-Path $pluginDir "skills"
$mcpJson = Join-Path $pluginDir ".mcp.json"
$codexMcpJson = Join-Path $pluginDir ".codex.mcp.json"

$codexMarketplaceJson = Join-Path (Join-Path (Join-Path $repoRoot ".agents") "plugins") "marketplace.json"
$claudeMarketplaceJson = Join-Path (Join-Path $repoRoot ".claude-plugin") "marketplace.json"
$copilotMarketplaceJson = Join-Path (Join-Path (Join-Path $repoRoot ".github") "plugin") "marketplace.json"
$copilotShimJson = Join-Path (Join-Path (Join-Path $repoRoot ".github") "plugin") "plugin.json"

$copilotPackageJson = Join-Path $pluginDir "plugin.json"
$claudePackageJson = Join-Path (Join-Path $pluginDir ".claude-plugin") "plugin.json"
$codexPackageJson = Join-Path (Join-Path $pluginDir ".codex-plugin") "plugin.json"

function Write-ValidationError($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
    $script:HasErrors = $true
}

function Write-ValidationSuccess($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-ValidationHeader($message) {
    Write-Host ""
    Write-Host $message -ForegroundColor Cyan
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

function Get-Json($path) {
    return Get-Content $path -Raw | ConvertFrom-Json
}

function Test-RequiredFile($path, $label) {
    if (Test-Path $path) {
        Write-ValidationSuccess "Found: $label"
        if ($path.EndsWith(".json")) {
            if (Test-ValidJson $path) {
                Write-ValidationSuccess "Valid JSON: $label"
            } else {
                Write-ValidationError "Invalid JSON: $label"
            }
        }
    } else {
        Write-ValidationError "Missing: $label"
    }
}

function Test-Equal($actual, $expected, $message) {
    if ("$actual" -eq "$expected") {
        Write-ValidationSuccess $message
    } else {
        Write-ValidationError "$message Expected '$expected', got '$actual'."
    }
}

function Test-StringArrayEqual($actual, $expected, $message) {
    $actualJoined = (@($actual) | Sort-Object) -join ","
    $expectedJoined = (@($expected) | Sort-Object) -join ","
    if ($actualJoined -eq $expectedJoined) {
        Write-ValidationSuccess $message
    } else {
        Write-ValidationError "$message Expected '$expectedJoined', got '$actualJoined'."
    }
}

function Test-SharedIdentity($actualObj, $expectedObj, $label) {
    $fields = @("name", "description", "version", "homepage", "repository", "license")
    foreach ($field in $fields) {
        Test-Equal $actualObj.$field $expectedObj.$field "$label field '$field' matches package manifest"
    }

    Test-Equal $actualObj.author.name $expectedObj.author.name "$label field 'author.name' matches package manifest"
    Test-StringArrayEqual $actualObj.keywords $expectedObj.keywords "$label field 'keywords' matches package manifest"
}

Write-ValidationHeader "Validating required plugin files"

$requiredFiles = @(
    @{ Path = $codexMarketplaceJson; Label = ".agents/plugins/marketplace.json" },
    @{ Path = $claudeMarketplaceJson; Label = ".claude-plugin/marketplace.json" },
    @{ Path = $copilotMarketplaceJson; Label = ".github/plugin/marketplace.json" },
    @{ Path = $copilotShimJson; Label = ".github/plugin/plugin.json" },
    @{ Path = $copilotPackageJson; Label = "plugins/microsoft-docs/plugin.json" },
    @{ Path = $claudePackageJson; Label = "plugins/microsoft-docs/.claude-plugin/plugin.json" },
    @{ Path = $codexPackageJson; Label = "plugins/microsoft-docs/.codex-plugin/plugin.json" },
    @{ Path = $mcpJson; Label = "plugins/microsoft-docs/.mcp.json" },
    @{ Path = $codexMcpJson; Label = "plugins/microsoft-docs/.codex.mcp.json" }
)

foreach ($file in $requiredFiles) {
    Test-RequiredFile $file.Path $file.Label
}

$unexpectedRootPluginFiles = @(
    @{ Path = Join-Path (Join-Path $repoRoot ".claude-plugin") "plugin.json"; Label = ".claude-plugin/plugin.json" },
    @{ Path = Join-Path (Join-Path $repoRoot ".codex-plugin") "plugin.json"; Label = ".codex-plugin/plugin.json" },
    @{ Path = Join-Path $repoRoot ".mcp.json"; Label = ".mcp.json" },
    @{ Path = Join-Path $repoRoot "skills"; Label = "skills/" }
)

foreach ($item in $unexpectedRootPluginFiles) {
    if (Test-Path $item.Path) {
        Write-ValidationError "Unexpected root plugin artifact remains: $($item.Label)"
    } else {
        Write-ValidationSuccess "No root plugin artifact: $($item.Label)"
    }
}

Write-ValidationHeader "Validating marketplace wiring"

if ((Test-ValidJson $codexMarketplaceJson) -and (Test-ValidJson $claudeMarketplaceJson) -and (Test-ValidJson $copilotMarketplaceJson)) {
    $codexMarketplace = Get-Json $codexMarketplaceJson
    $claudeMarketplace = Get-Json $claudeMarketplaceJson
    $copilotMarketplace = Get-Json $copilotMarketplaceJson

    Test-Equal $codexMarketplace.name "microsoft-docs-marketplace" "Codex marketplace name is aligned"
    Test-Equal $codexMarketplace.interface.displayName "Microsoft Docs" "Codex marketplace display name is set"

    $codexEntry = $codexMarketplace.plugins | Where-Object { $_.name -eq $pluginName } | Select-Object -First 1
    if ($null -eq $codexEntry) {
        Write-ValidationError "Missing Codex marketplace entry '$pluginName'"
    } else {
        Test-Equal $codexEntry.source.source "local" "Codex marketplace entry uses local source"
        Test-Equal $codexEntry.source.path "./plugins/microsoft-docs" "Codex marketplace entry points to plugin subfolder"
        Test-Equal $codexEntry.policy.installation "AVAILABLE" "Codex marketplace policy.installation is set"
        Test-Equal $codexEntry.policy.authentication "ON_INSTALL" "Codex marketplace policy.authentication is set"
        Test-Equal $codexEntry.category "Productivity" "Codex marketplace category is set"
    }

    $claudeEntry = $claudeMarketplace.plugins | Where-Object { $_.name -eq $pluginName } | Select-Object -First 1
    if ($null -eq $claudeEntry) {
        Write-ValidationError "Missing Claude marketplace entry '$pluginName'"
    } else {
        Test-Equal $claudeEntry.source "./plugins/microsoft-docs" "Claude marketplace entry points to plugin subfolder"
    }

    $copilotEntry = $copilotMarketplace.plugins | Where-Object { $_.name -eq $pluginName } | Select-Object -First 1
    if ($null -eq $copilotEntry) {
        Write-ValidationError "Missing Copilot marketplace entry '$pluginName'"
    } else {
        Test-Equal $copilotEntry.source "./plugins/microsoft-docs" "Copilot marketplace entry points to plugin subfolder"
    }
}

Write-ValidationHeader "Validating plugin manifests"

if ((Test-ValidJson $copilotPackageJson) -and (Test-ValidJson $claudePackageJson) -and (Test-ValidJson $codexPackageJson) -and (Test-ValidJson $copilotShimJson)) {
    $copilotPackage = Get-Json $copilotPackageJson
    $claudePackage = Get-Json $claudePackageJson
    $codexPackage = Get-Json $codexPackageJson
    $copilotShim = Get-Json $copilotShimJson

    Test-SharedIdentity $claudePackage $copilotPackage "Claude package manifest"
    Test-SharedIdentity $codexPackage $copilotPackage "Codex package manifest"
    Test-SharedIdentity $copilotShim $copilotPackage "Copilot direct-install shim"

    Test-StringArrayEqual $copilotPackage.skills @("skills/") "Copilot package skills path is plugin-root relative"
    Test-Equal $copilotPackage.mcpServers ".mcp.json" "Copilot package MCP path is plugin-root relative"

    Test-Equal $claudePackage.skills "./skills/" "Claude package skills path is plugin-root relative"
    Test-Equal $claudePackage.mcpServers "./.mcp.json" "Claude package MCP path is plugin-root relative"

    Test-Equal $codexPackage.skills "./skills/" "Codex package skills path is plugin-root relative"
    Test-Equal $codexPackage.mcpServers "./.codex.mcp.json" "Codex package MCP path is plugin-root relative"

    Test-StringArrayEqual $copilotShim.skills @("plugins/microsoft-docs/skills/") "Copilot shim skills path is repo-root relative"
    Test-Equal $copilotShim.mcpServers "plugins/microsoft-docs/.mcp.json" "Copilot shim MCP path is repo-root relative"
}

Write-ValidationHeader "Validating skills and MCP config"

if (Test-Path $skillsDir) {
    Write-ValidationSuccess "Found: plugins/microsoft-docs/skills/"
    $skillFolders = Get-ChildItem -Path $skillsDir -Directory
    if ($skillFolders.Count -eq 0) {
        Write-ValidationError "No skill folders found in plugins/microsoft-docs/skills/"
    } else {
        foreach ($folder in $skillFolders) {
            $skillMd = Join-Path $folder.FullName "SKILL.md"
            if (Test-Path $skillMd) {
                Write-ValidationSuccess "Found: plugins/microsoft-docs/skills/$($folder.Name)/SKILL.md"
            } else {
                Write-ValidationError "Missing: plugins/microsoft-docs/skills/$($folder.Name)/SKILL.md"
            }
        }
    }
} else {
    Write-ValidationError "Missing: plugins/microsoft-docs/skills/"
}

if (Test-ValidJson $mcpJson) {
    $mcpObj = Get-Json $mcpJson
    if ($null -eq $mcpObj.mcpServers."microsoft-learn") {
        Write-ValidationError "Claude/Copilot .mcp.json is missing mcpServers.microsoft-learn."
    } else {
        Test-Equal $mcpObj.mcpServers."microsoft-learn".url "https://learn.microsoft.com/api/mcp" "Claude/Copilot MCP server URL is set"
    }
}

if (Test-ValidJson $codexMcpJson) {
    $codexMcpObj = Get-Json $codexMcpJson
    if ($null -ne $codexMcpObj.mcpServers) {
        Write-ValidationError "Codex .codex.mcp.json should use a direct server map, not a camelCase mcpServers wrapper."
    } elseif ($null -eq $codexMcpObj."microsoft-learn") {
        Write-ValidationError "Codex .codex.mcp.json is missing the microsoft-learn server entry."
    } else {
        Test-Equal $codexMcpObj."microsoft-learn".url "https://learn.microsoft.com/api/mcp" "Codex MCP server URL is set"
    }
}

Write-ValidationHeader "Validating CLI"

$cliDir = Join-Path $repoRoot "cli"
if (-not (Test-Path $cliDir)) {
    Write-ValidationError "Missing: cli/"
} else {
    Write-ValidationSuccess "Found: cli/"
    foreach ($file in @("package.json", "tsconfig.json")) {
        $path = Join-Path $cliDir $file
        Test-RequiredFile $path "cli/$file"
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

Write-Host ""
Write-Host ("-" * 50) -ForegroundColor Gray
if ($script:HasErrors) {
    Write-Host "Validation FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "All validations PASSED" -ForegroundColor Green
exit 0
