# Smart-Run Monorepo Architecture Plan

This document provides a high-level overview of the Smart-Run monorepo refactor, splitting the project into focused packages with clear boundaries and responsibilities.

---

## Monorepo Structure

```
smart-run/                          # Monorepo root
├── .changeset/                     # Changesets configuration
├── .github/                        # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── packages/
│   ├── smart-run/                  # Core CLI package
│   ├── smart-run-ui/               # Web UI package
│   ├── smart-run-core/             # Shared domain logic
│   └── smart-run-formats/          # Format plugins
├── docs/
│   └── new-architecture-plan/
│       ├── README.md              # This file
│       ├── monorepo-setup.md      # Monorepo tooling details
│       ├── smart-run-package.md   # Core CLI package plan
│       ├── smart-run-ui-package.md # Web UI package plan
│       └── release-strategy.md    # CI/CD and versioning
├── pnpm-workspace.yaml
├── .npmrc
├── turbo.json                     # Turbo for task orchestration
└── package.json                   # Root package.json
```

---

## Technology Stack

### Monorepo Management
- **pnpm workspaces** - Efficient package manager with built-in workspace support
- **Turbo** - Build system for monorepo task orchestration and caching
- **Changesets** - Versioning and changelog management
- **GitHub Actions** - CI/CD automation

### Why This Stack?

1. **pnpm** - 3x faster than npm, efficient disk usage via content-addressable storage
2. **Turbo** - Incremental builds, remote caching, parallel execution
3. **Changesets** - Automated versioning, changelog generation, and npm publishing
4. **GitHub Actions** - Native GitHub integration, free for open source

---

## Package Overview

### 1. `@smart-run/core` (New)
Shared domain logic and interfaces used by other packages.

**Key Responsibilities:**
- Domain entities (Script, ScriptGroup, Package, Workspace)
- Format plugin interfaces
- Core business logic (no I/O)
- Type definitions

[→ Detailed Plan](./smart-run-core-package.md)

### 2. `@smart-run/formats` (New)
Collection of script format plugins.

**Key Responsibilities:**
- Format detection and parsing
- Individual format implementations
- Format registry
- Migration utilities

[→ Detailed Plan](./smart-run-formats-package.md)

### 3. `smart-run` (Refactored)
The CLI tool that users install globally or as a dev dependency.

**Key Responsibilities:**
- Command-line interface
- Interactive script runner
- Monorepo support
- Configuration management

[→ Detailed Plan](./smart-run-package.md)

### 4. `smart-run-ui` (New)
Web-based UI for managing and organizing npm scripts.

**Key Responsibilities:**
- Express API server
- React SPA client
- Script visualization and management
- AI-powered features

[→ Detailed Plan](./smart-run-ui-package.md)

---

## Implementation Phases

### Phase 1: Monorepo Setup (Week 1)
- [ ] Initialize pnpm workspace
- [ ] Configure Turbo
- [ ] Set up Changesets
- [ ] Configure GitHub Actions
- [ ] Migrate existing code to packages/smart-run

### Phase 2: Core Extraction (Week 2-3)
- [ ] Create @smart-run/core package
- [ ] Extract domain models
- [ ] Create @smart-run/formats package
- [ ] Migrate format implementations

### Phase 3: CLI Refactor (Week 4-5)
- [ ] Refactor to use @smart-run/core
- [ ] Implement monorepo support
- [ ] Add configuration sync
- [ ] Update tests

### Phase 4: UI Development (Week 6-9)
- [ ] Create smart-run-ui package
- [ ] Implement Express server
- [ ] Build React application
- [ ] Integrate with @smart-run/core

### Phase 5: Polish & Release (Week 10)
- [ ] Documentation updates
- [ ] Migration guides
- [ ] Performance optimization
- [ ] Initial releases

---

## Benefits of Monorepo Approach

1. **Code Sharing** - Common logic in @smart-run/core
2. **Synchronized Releases** - Changesets manages versioning
3. **Better Testing** - Cross-package integration tests
4. **Consistent Tooling** - Shared ESLint, TypeScript, Prettier configs
5. **Atomic Changes** - Related changes across packages in one PR

---

## Migration Path for Users

1. **Backward Compatibility**
   - `smart-run` CLI maintains all existing commands
   - Deprecation warnings for changed features
   - Migration command for config updates

2. **Gradual Adoption**
   - CLI works standalone (no UI required)
   - UI is opt-in via separate installation
   - Can use both together or separately

---

## Release Strategy

### Versioning
- Independent versioning per package
- Changesets manages version bumps
- Automated changelog generation

### Publishing
- Automated npm publishing via GitHub Actions
- Pre-release versions for testing
- Canary releases for early adopters

### CI/CD Pipeline
```yaml
PR → Lint → Test → Build → Preview
Merge → Build → Test → Release → Publish
```

[→ Detailed Release Strategy](./release-strategy.md)

---

## Quick Links

- [Monorepo Setup Guide](./monorepo-setup.md)
- [Smart-Run Package Plan](./smart-run-package.md)
- [Smart-Run UI Package Plan](./smart-run-ui-package.md)
- [Smart-Run Core Package Plan](./smart-run-core-package.md)
- [Smart-Run Formats Package Plan](./smart-run-formats-package.md)
- [Release Strategy](./release-strategy.md)

---

*Last updated: [Date]*
