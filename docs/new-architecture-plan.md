# Smart-Run Architecture Refactor Plan

This document outlines the architectural improvements for Smart-Run to support pluggable script organization formats, monorepo support, browser-based UI, and better separation of concerns.

---

## 1. Clean Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│ CLI (Commander) │ Browser UI (React) │ API Server (Express) │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│ Use Cases: Execute, List, Migrate, Lint, Sync, Analyze     │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
├─────────────────────────────────────────────────────────────┤
│ Entities │ Value Objects │ Domain Services │ Repositories   │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│ File System │ Process │ Network │ Database │ AI Providers  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
smart-run/
├── src/
│   ├── core/                    # Domain layer (pure business logic)
│   │   ├── entities/
│   │   │   ├── Script.ts
│   │   │   ├── ScriptGroup.ts
│   │   │   ├── Package.ts
│   │   │   └── Workspace.ts
│   │   ├── value-objects/
│   │   │   ├── ScriptId.ts
│   │   │   ├── PackageId.ts
│   │   │   └── WorkspaceId.ts
│   │   ├── services/
│   │   │   ├── ScriptDiscoveryService.ts
│   │   │   ├── ScriptGroupingService.ts
│   │   │   ├── ConfigSyncService.ts
│   │   │   └── MonorepoAggregationService.ts
│   │   ├── repositories/
│   │   │   ├── IScriptRepository.ts
│   │   │   ├── IConfigRepository.ts
│   │   │   └── IWorkspaceRepository.ts
│   │   └── formats/              # Script format plugins
│   │       ├── IScriptFormat.ts
│   │       ├── SmartRunFormat.ts
│   │       ├── NtlFormat.ts
│   │       ├── BetterScriptsFormat.ts
│   │       ├── NpmScriptsInfoFormat.ts
│   │       └── FlatKeyValueFormat.ts
│   │
│   ├── application/             # Use cases / application services
│   │   ├── ExecuteScriptUseCase.ts
│   │   ├── ListScriptsUseCase.ts
│   │   ├── MigrateConfigUseCase.ts
│   │   ├── LintConfigUseCase.ts
│   │   ├── SyncConfigUseCase.ts
│   │   ├── AnalyzeScriptsUseCase.ts
│   │   └── ReorganizeScriptsUseCase.ts
│   │
│   ├── infrastructure/          # External dependencies & adapters
│   │   ├── file-system/
│   │   │   ├── FileSystemScriptRepository.ts
│   │   │   └── FileSystemConfigRepository.ts
│   │   ├── process/
│   │   │   └── NodeProcessExecutor.ts
│   │   ├── ai/
│   │   │   ├── OpenAIProvider.ts
│   │   │   └── IAIProvider.ts
│   │   ├── monorepo/
│   │   │   ├── WorkspaceDetector.ts
│   │   │   ├── PnpmWorkspaceProvider.ts
│   │   │   ├── LernaWorkspaceProvider.ts
│   │   │   └── TurboWorkspaceProvider.ts
│   │   └── config/
│   │       ├── YamlConfigParser.ts
│   │       └── JsonConfigParser.ts
│   │
│   ├── presentation/            # UI layers
│   │   ├── cli/
│   │   │   ├── commands/
│   │   │   └── cli.ts
│   │   ├── web/
│   │   │   ├── server/
│   │   │   │   ├── app.ts
│   │   │   │   └── routes/
│   │   │   └── client/
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       └── App.tsx
│   │   └── shared/
│   │       └── presenters/
│   │
│   └── shared/                  # Cross-cutting concerns
│       ├── errors/
│       ├── logging/
│       └── utils/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    ├── architecture.md
    ├── new-architecture-plan.md
    └── plugin-development.md
```

---

## 3. Core Domain Model

### Entities

```typescript
// Script entity
interface Script {
  id: ScriptId;
  name: string;
  command: string;
  description?: string;
  category?: string;
  tags?: string[];
  packageId: PackageId;
}

// ScriptGroup entity
interface ScriptGroup {
  id: string;
  name: string;
  description?: string;
  scripts: Script[];
  subgroups?: ScriptGroup[];
}

// Package entity
interface Package {
  id: PackageId;
  name: string;
  path: string;
  scripts: Script[];
  config: ScriptConfig;
  workspaceId?: WorkspaceId;
}

// Workspace entity
interface Workspace {
  id: WorkspaceId;
  root: string;
  type: 'pnpm' | 'lerna' | 'turbo' | 'npm' | 'yarn';
  packages: Package[];
}
```

---

## 4. Plugin System for Script Formats

### Format Plugin Interface

```typescript
interface IScriptFormat {
  name: string;
  priority: number; // Detection priority
  
  detect(packageJson: any, configFiles: Map<string, any>): boolean;
  parse(packageJson: any, configFiles: Map<string, any>): ScriptGroup[];
  serialize(groups: ScriptGroup[], packageJson: any): any;
  sync(groups: ScriptGroup[], packageJson: any): any;
}
```

### Format Registry

```typescript
class FormatRegistry {
  private formats: IScriptFormat[] = [];
  
  register(format: IScriptFormat): void;
  detect(context: ConfigContext): IScriptFormat[];
  getBestFormat(context: ConfigContext): IScriptFormat;
}
```

---

## 5. Monorepo Support Implementation

### Components

1. **Workspace Detector**
   - Walks up directory tree to find workspace root
   - Identifies workspace type (pnpm, lerna, turbo, npm/yarn workspaces)
   - Returns workspace configuration

2. **Package Discovery**
   - Uses workspace-specific glob patterns
   - Filters ignored packages
   - Returns package manifest locations

3. **Aggregation Service**
   - Builds hierarchical workspace → package → scripts model
   - Handles cross-package script dependencies
   - Provides filtering and search capabilities

4. **UI Adaptation**
   - Workspace selector in CLI menu
   - Package filter/selector
   - Aggregated script view with package indicators

---

## 6. Configuration Synchronization

### Sync Service Responsibilities

1. **Bidirectional Sync**
   - Smart-Run config → package.json scripts
   - package.json scripts → Smart-Run config
   - Conflict resolution strategies

2. **Format Transformation**
   - Groups to npm script comments (`\n# GROUP_NAME:`)
   - Flat key-value to grouped structure
   - Description preservation across formats

3. **Change Detection**
   - File watchers for real-time sync
   - Diff generation for manual review
   - Atomic updates to prevent corruption

---

## 7. Browser UI Architecture

### Server Component

```typescript
// API endpoints
POST   /api/scripts/execute
GET    /api/scripts
PUT    /api/scripts/:id
DELETE /api/scripts/:id
POST   /api/scripts/reorder
POST   /api/groups
PUT    /api/groups/:id
DELETE /api/groups/:id
POST   /api/ai/analyze
POST   /api/ai/describe/:scriptId
```

### Client Features

1. **Script Management**
   - Drag-and-drop reordering
   - Group expand/collapse
   - Inline editing
   - Bulk operations

2. **AI Integration**
   - Generate descriptions for scripts
   - Auto-group suggestions
   - Script purpose analysis

3. **Filtering & Search**
   - Text search
   - Tag filters
   - Package filters (monorepo)
   - Recent/favorite scripts

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **State Management**: Zustand or Jotai
- **UI Components**: Radix UI + Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **API Client**: TanStack Query

---

## 8. Implementation Roadmap

### Phase 1: Core Refactoring (2-3 weeks)
- [ ] Extract domain entities and value objects
- [ ] Implement repository interfaces
- [ ] Create format plugin system
- [ ] Refactor existing format support as plugins
- [ ] Add comprehensive unit tests

### Phase 2: Monorepo Support (2 weeks)
- [ ] Implement workspace detector
- [ ] Create package discovery service
- [ ] Build aggregation service
- [ ] Update CLI to support workspace selection
- [ ] Add monorepo-specific tests

### Phase 3: Flat Key-Value Format (1 week)
- [ ] Implement FlatKeyValueFormat plugin
- [ ] Add group detection from empty values
- [ ] Create migration from/to flat format
- [ ] Update documentation

### Phase 4: Configuration Sync (2 weeks)
- [ ] Implement ConfigSyncService
- [ ] Add bidirectional sync logic
- [ ] Create npm script comment transformer
- [ ] Add file watching capabilities
- [ ] Build conflict resolution UI

### Phase 5: Browser UI - MVP (3-4 weeks)
- [ ] Set up web server infrastructure
- [ ] Create REST API endpoints
- [ ] Build React application scaffold
- [ ] Implement script listing and filtering
- [ ] Add drag-and-drop reordering
- [ ] Create group management features

### Phase 6: Browser UI - AI Features (2 weeks)
- [ ] Add AI analysis endpoints
- [ ] Implement description generation UI
- [ ] Create auto-grouping suggestions
- [ ] Add batch AI operations

### Phase 7: Polish & Documentation (1 week)
- [ ] Update all documentation
- [ ] Create plugin development guide
- [ ] Add migration guides
- [ ] Performance optimization
- [ ] Security review

---

## 9. Migration Strategy

1. **Backward Compatibility**
   - Maintain existing CLI commands
   - Support all current config formats
   - Gradual deprecation with warnings

2. **Data Migration**
   - Automated migration scripts
   - Backup before migration
   - Rollback capabilities

3. **Feature Flags**
   - New features behind flags
   - Gradual rollout
   - A/B testing capabilities

---

## 10. Testing Strategy

### Unit Tests
- Domain logic (entities, services)
- Format plugins
- Use cases

### Integration Tests
- Repository implementations
- Format detection and parsing
- Monorepo scenarios

### E2E Tests
- CLI workflows
- Browser UI interactions
- Cross-format synchronization

### Performance Tests
- Large monorepo handling
- Many scripts scenarios
- Real-time sync performance

---

## 11. Security Considerations

1. **Script Execution**
   - Sanitize command inputs
   - Prevent injection attacks
   - Audit logging

2. **Web UI**
   - Authentication/authorization
   - CSRF protection
   - Rate limiting
   - Input validation

3. **AI Integration**
   - API key management
   - Request sanitization
   - Cost controls

---

## 12. Existing Tools Research

### Similar Browser-Based Tools
1. **npm-gui** - Basic npm script runner with web UI
2. **Verdaccio** - Private npm proxy with web UI
3. **npm-check-updates** - Interactive dependency updater

### Recommendation
None provide the comprehensive script organization and AI-powered features we're planning. Our browser UI would be unique in the ecosystem.

---

## 13. Technical Decisions

1. **Why Clean Architecture?**
   - Testability
   - Framework independence
   - Plugin system support
   - Future-proofing

2. **Why TypeScript?**
   - Type safety
   - Better refactoring support
   - Self-documenting code
   - IDE support

3. **Why React for Browser UI?**
   - Large ecosystem
   - Component reusability
   - Strong TypeScript support
   - Team familiarity

---

*End of plan*
