# Requirements Document

## Introduction

This specification covers updating all 10 Kiro agent configuration files in `.kiro/agents/` to align with the new agent schema. The update addresses deprecated fields, adds missing schema validation, and introduces new UX features for improved agent switching and context.

## Glossary

- **Agent**: A specialized AI assistant configuration with custom prompts, tools, and resources
- **Schema**: JSON Schema reference for IDE validation and autocomplete
- **MCP_Server**: Model Context Protocol server providing external tool capabilities
- **Keyboard_Shortcut**: A key combination for quick agent switching (e.g., ctrl+shift+1)
- **Welcome_Message**: A greeting displayed when switching to an agent
- **useLegacyMcpJson**: Boolean field that replaces the deprecated `includeMcpJson` field

## Requirements

### Requirement 1: Schema Reference Addition

**User Story:** As a developer, I want all agent configuration files to include a JSON schema reference, so that I get IDE validation and autocomplete support.

#### Acceptance Criteria

1. THE Agent_Configuration SHALL include a `$schema` field as the first property
2. THE `$schema` field SHALL reference the Kiro agent schema URL
3. WHEN the schema is present, THE IDE SHALL provide validation and autocomplete

### Requirement 2: Deprecated Field Migration

**User Story:** As a developer, I want deprecated fields replaced with their new equivalents, so that agent configurations remain compatible with future Kiro versions.

#### Acceptance Criteria

1. WHEN an agent has `includeMcpJson: true`, THE Migration SHALL replace it with `useLegacyMcpJson: true`
2. WHEN an agent has `includeMcpJson: false`, THE Migration SHALL replace it with `useLegacyMcpJson: false`
3. WHEN an agent has no `includeMcpJson` field, THE Migration SHALL NOT add `useLegacyMcpJson`
4. THE Migration SHALL preserve all other existing field values unchanged

### Requirement 3: Keyboard Shortcut Assignment

**User Story:** As a developer, I want unique keyboard shortcuts for each agent, so that I can quickly switch between agents without using the mouse.

#### Acceptance Criteria

1. THE Agent_Configuration SHALL include a `keyboardShortcut` field
2. EACH agent SHALL have a unique keyboard shortcut
3. THE keyboard shortcuts SHALL follow the pattern `ctrl+shift+{number}` where number is 0-9
4. THE shortcut assignments SHALL be:
    - backend-engineer: ctrl+shift+1
    - frontend-engineer: ctrl+shift+2
    - fullstack-engineer: ctrl+shift+3
    - devops-engineer: ctrl+shift+4
    - qa-engineer: ctrl+shift+5
    - security-engineer: ctrl+shift+6
    - data-analyst: ctrl+shift+7
    - i18n-engineer: ctrl+shift+8
    - livestock-specialist: ctrl+shift+9
    - product-architect: ctrl+shift+0

### Requirement 4: Welcome Message Addition

**User Story:** As a developer, I want each agent to display a contextual welcome message when activated, so that I understand the agent's capabilities and current context.

#### Acceptance Criteria

1. THE Agent_Configuration SHALL include a `welcomeMessage` field
2. THE welcome message SHALL describe the agent's primary role and capabilities
3. THE welcome message SHALL be concise (1-2 sentences maximum)
4. THE welcome message SHALL use an appropriate emoji prefix matching the agent's domain

### Requirement 5: Configuration Validation

**User Story:** As a developer, I want all updated agent configurations to pass schema validation, so that I can be confident the configurations are correct.

#### Acceptance Criteria

1. WHEN an agent configuration is updated, THE Configuration SHALL be valid JSON
2. THE Configuration SHALL include all required fields (name, description, prompt)
3. THE Configuration SHALL NOT include any unknown or deprecated fields after migration
4. IF validation fails, THEN THE System SHALL report the specific validation error

### Requirement 6: Preserve Existing Functionality

**User Story:** As a developer, I want all existing agent functionality preserved during the update, so that agents continue to work as expected.

#### Acceptance Criteria

1. THE Migration SHALL preserve all existing `tools` arrays unchanged
2. THE Migration SHALL preserve all existing `allowedTools` arrays unchanged
3. THE Migration SHALL preserve all existing `toolsSettings` configurations unchanged
4. THE Migration SHALL preserve all existing `resources` arrays unchanged
5. THE Migration SHALL preserve all existing `hooks` configurations unchanged
6. THE Migration SHALL preserve all existing `mcpServers` configurations unchanged
7. THE Migration SHALL preserve all existing `model` values unchanged
8. THE Migration SHALL preserve all existing `prompt` content unchanged

### Requirement 7: MCP Server OAuth Configuration

**User Story:** As a developer, I want MCP server configurations to use OAuth-based authentication consistently, so that agents can access external services securely without API keys.

#### Acceptance Criteria

1. WHEN an agent has inline `mcpServers` configurations, THE Configuration SHALL use the `mcp-remote` command pattern for OAuth-based servers
2. THE MCP server configurations SHALL include `--cache-dir` parameter for OAuth token caching
3. WHEN an agent sets `useLegacyMcpJson: true`, THE Agent SHALL inherit MCP servers from the global `.kiro/settings/mcp.json`
4. THE OAuth-based MCP servers (Neon, Cloudflare) SHALL use their respective OAuth endpoints:
    - Neon: `https://mcp.neon.tech/mcp`
    - Cloudflare Bindings: `https://bindings.mcp.cloudflare.com/mcp`
    - Cloudflare Builds: `https://builds.mcp.cloudflare.com/mcp`
    - Cloudflare Observability: `https://observability.mcp.cloudflare.com/mcp`
    - Cloudflare Docs: `https://docs.mcp.cloudflare.com/mcp`
5. WHEN updating inline MCP server configs, THE Migration SHALL add `--cache-dir` parameter if missing
