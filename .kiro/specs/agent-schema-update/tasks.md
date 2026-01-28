# Implementation Plan: Agent Schema Update

## Overview

This plan covers updating all 10 Kiro agent configuration files to the new schema format. The implementation is a series of file updates that add new fields, rename deprecated fields, and update MCP server configurations.

## Tasks

- [x]   1. Update backend-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+1"`
    - Add `welcomeMessage: "🔧 Backend Engineer ready. I handle server functions, Kysely queries, and Cloudflare Workers patterns."`
    - Rename `includeMcpJson` to `useLegacyMcpJson`
    - Add `--cache-dir` to neon MCP server args
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4, 4.1, 7.2, 7.5_

- [x]   2. Update frontend-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+2"`
    - Add `welcomeMessage: "🎨 Frontend Engineer ready. I build React components, TanStack Router pages, and PWA features."`
    - No `includeMcpJson` field exists, so no `useLegacyMcpJson` needed
    - _Requirements: 1.1, 1.2, 2.3, 3.1, 3.4, 4.1_

- [x]   3. Update fullstack-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+3"`
    - Add `welcomeMessage: "🚀 Fullstack Engineer ready. I handle end-to-end features from database to UI."`
    - Rename `includeMcpJson: true` to `useLegacyMcpJson: true`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4, 4.1_

- [x]   4. Update devops-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+4"`
    - Add `welcomeMessage: "🛠️ DevOps Engineer ready. I manage Cloudflare deployments, secrets, and infrastructure."`
    - Rename `includeMcpJson` to `useLegacyMcpJson`
    - Add `--cache-dir` to all MCP server args (neon, cloudflare-bindings, cloudflare-builds, cloudflare-observability, cloudflare-docs)
    - _Requirements: 1.1, 1.2, 2.2, 3.1, 3.4, 4.1, 7.2, 7.5_

- [x]   5. Update qa-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+5"`
    - Add `welcomeMessage: "🧪 QA Engineer ready. I write property tests, unit tests, and integration tests."`
    - Rename `includeMcpJson: true` to `useLegacyMcpJson: true`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4, 4.1_

- [x]   6. Update security-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+6"`
    - Add `welcomeMessage: "🔐 Security Engineer ready. I audit auth, validate inputs, and protect user data."`
    - No `includeMcpJson` field exists, so no `useLegacyMcpJson` needed
    - _Requirements: 1.1, 1.2, 2.3, 3.1, 3.4, 4.1_

- [x]   7. Update data-analyst agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+7"`
    - Add `welcomeMessage: "📊 Data Analyst ready. I analyze batch performance, forecast growth, and generate reports."`
    - Rename `includeMcpJson` to `useLegacyMcpJson`
    - Add `--cache-dir` to neon MCP server args
    - _Requirements: 1.1, 1.2, 2.2, 3.1, 3.4, 4.1, 7.2, 7.5_

- [x]   8. Update i18n-engineer agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+8"`
    - Add `welcomeMessage: "🌍 i18n Engineer ready. I maintain translations across 15 languages."`
    - No `includeMcpJson` field exists, so no `useLegacyMcpJson` needed
    - _Requirements: 1.1, 1.2, 2.3, 3.1, 3.4, 4.1_

- [x]   9. Update livestock-specialist agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+9"`
    - Add `welcomeMessage: "🐔 Livestock Specialist ready. I provide domain expertise for poultry, fish, cattle, goats, sheep, and bees."`
    - Rename `includeMcpJson` to `useLegacyMcpJson`
    - Add `--cache-dir` to neon MCP server args
    - _Requirements: 1.1, 1.2, 2.2, 3.1, 3.4, 4.1, 7.2, 7.5_

- [x]   10. Update product-architect agent configuration
    - Add `$schema` field as first property
    - Add `keyboardShortcut: "ctrl+shift+0"`
    - Add `welcomeMessage: "📐 Product Architect ready. I organize routes, features, and enforce batch-centric design."`
    - Rename `includeMcpJson: true` to `useLegacyMcpJson: true`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4, 4.1_

- [x]   11. Checkpoint - Verify all agent configurations
    - Ensure all 10 agent files are valid JSON
    - Verify no `includeMcpJson` fields remain
    - Verify all agents have unique keyboard shortcuts
    - Ensure all tests pass, ask the user if questions arise.

- [x]   12. Write property tests for agent schema validation
    - [x] 12.1 Write property test for schema field presence
        - **Property 1: Schema Field Presence and Validity**
        - **Validates: Requirements 1.1, 1.2**
    - [x] 12.2 Write property test for deprecated field migration
        - **Property 2: Deprecated Field Migration Correctness**
        - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - [x] 12.3 Write property test for keyboard shortcut validity
        - **Property 3: Keyboard Shortcut Validity and Uniqueness**
        - **Validates: Requirements 3.1, 3.2, 3.3**
    - [x] 12.4 Write property test for welcome message format
        - **Property 4: Welcome Message Format Validity**
        - **Validates: Requirements 4.1, 4.3, 4.4**
    - [x] 12.5 Write property test for configuration completeness
        - **Property 5: Configuration Completeness and Validity**
        - **Validates: Requirements 5.1, 5.2, 5.3**
    - [x] 12.6 Write property test for field preservation
        - **Property 6: Field Preservation Invariant**
        - **Validates: Requirements 6.1-6.8**
    - [x] 12.7 Write property test for MCP server configuration
        - **Property 7: MCP Server Configuration Correctness**
        - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

- [x]   13. Final checkpoint - Ensure all configurations are valid
    - Run JSON validation on all agent files
    - Verify keyboard shortcuts are unique across all agents
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- The migration is idempotent - running it twice produces the same result
- Property tests validate universal correctness properties
- All agent configurations use the same schema reference URL
