# Smart-Run UI Package Plan

This document outlines the architecture for the `smart-run-ui` web-based interface package.

---

## Package Overview

**Name:** `smart-run-ui`  
**Type:** Web Application (Express + React)  
**Dependencies:** `@smart-run/core`, `@smart-run/formats`, `smart-run`  
**Purpose:** Visual interface for managing, organizing, and executing npm scripts

---

## Architecture

```
packages/smart-run-ui/
├── server/
│   ├── src/
│   │   ├── app.ts               # Express app setup
│   │   ├── routes/
│   │   │   ├── scripts.ts       # Script CRUD operations
│   │   │   ├── groups.ts        # Group management
│   │   │   ├── ai.ts            # AI features
│   │   │   └── workspace.ts     # Monorepo operations
│   │   ├── services/
│   │   │   ├── ScriptService.ts
│   │   │   ├── ExecutionService.ts
│   │   │   └── AIService.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── error.ts
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ScriptList/
│   │   │   ├── ScriptEditor/
│   │   │   ├── GroupManager/
│   │   │   └── AIAssistant/
│   │   ├── hooks/
│   │   │   ├── useScripts.ts
│   │   │   ├── useDragDrop.ts
│   │   │   └── useAI.ts
│   │   ├── stores/
│   │   │   ├── scriptStore.ts
│   │   │   └── uiStore.ts
│   │   └── api/
│   │       └── client.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/
│   ├── types.ts                 # Shared TypeScript types
│   └── constants.ts
├── package.json                 # Workspace package.json
└── README.md
```

---

## Server Architecture

### API Endpoints

```typescript
// Script Management
GET    /api/scripts              // List all scripts
GET    /api/scripts/:id          // Get script details
POST   /api/scripts              // Create script
PUT    /api/scripts/:id          // Update script
DELETE /api/scripts/:id          // Delete script
POST   /api/scripts/reorder      // Reorder scripts
POST   /api/scripts/:id/execute  // Execute script

// Group Management
GET    /api/groups               // List groups
POST   /api/groups               // Create group
PUT    /api/groups/:id           // Update group
DELETE /api/groups/:id           // Delete group
POST   /api/groups/reorder       // Reorder groups

// AI Features
POST   /api/ai/analyze           // Analyze all scripts
POST   /api/ai/describe/:id      // Generate description
POST   /api/ai/suggest-groups    // Suggest grouping

// Workspace (Monorepo)
GET    /api/workspaces           // List workspaces
GET    /api/workspaces/:id/packages  // List packages
```

### Service Layer

```typescript
class ScriptService {
  constructor(
    private scriptRepo: IScriptRepository,
    private formatRegistry: FormatRegistry
  ) {}

  async getScripts(filter?: ScriptFilter): Promise<Script[]>;
  async updateScript(id: string, data: UpdateScriptDto): Promise<Script>;
  async reorderScripts(order: string[]): Promise<void>;
  async executeScript(id: string): Promise<ExecutionResult>;
}
```

---

## Client Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   │   ├── WorkspaceSelector
│   │   ├── PackageFilter
│   │   └── SearchBox
│   └── MainContent
│       ├── ScriptList
│       │   ├── ScriptGroup
│       │   │   ├── GroupHeader
│       │   │   └── ScriptItem
│       │   │       ├── ScriptName
│       │   │       ├── ScriptDescription
│       │   │       └── ScriptActions
│       │   └── DragOverlay
│       ├── ScriptEditor
│       │   ├── BasicInfo
│       │   ├── CommandEditor
│       │   └── AIAssistant
│       └── ExecutionPanel
│           ├── Terminal
│           └── Controls
```

### State Management

```typescript
// Using Zustand
interface ScriptStore {
  scripts: Script[];
  groups: ScriptGroup[];
  selectedScript: Script | null;
  filter: ScriptFilter;
  
  // Actions
  fetchScripts: () => Promise<void>;
  updateScript: (id: string, data: Partial<Script>) => Promise<void>;
  reorderScripts: (sourceId: string, targetId: string) => void;
  executeScript: (id: string) => Promise<void>;
}
```

### Key Features Implementation

#### 1. Drag & Drop
```typescript
// Using @dnd-kit
function ScriptList() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={scripts}>
        {scripts.map(script => (
          <SortableScriptItem key={script.id} script={script} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### 2. Real-time Updates
```typescript
// Using Socket.io or SSE
function useRealtimeUpdates() {
  useEffect(() => {
    const socket = io('/scripts');
    
    socket.on('script:updated', (script) => {
      updateScriptInStore(script);
    });
    
    return () => socket.disconnect();
  }, []);
}
```

#### 3. AI Integration
```typescript
function AIAssistant({ scriptId }: Props) {
  const { mutate: generateDescription } = useMutation({
    mutationFn: () => api.ai.generateDescription(scriptId),
    onSuccess: (description) => {
      updateScript(scriptId, { description });
    }
  });

  return (
    <Button onClick={() => generateDescription()}>
      Generate Description with AI
    </Button>
  );
}
```

---

## UI/UX Design

### Layout
- **Sidebar**: Navigation, filters, search
- **Main Area**: Script list with groups
- **Right Panel**: Script editor (collapsible)
- **Bottom Panel**: Execution terminal (collapsible)

### Interactions
- **Drag & Drop**: Reorder scripts and groups
- **Inline Editing**: Click to edit descriptions
- **Keyboard Shortcuts**: Quick actions (⌘K for search)
- **Context Menus**: Right-click actions

### Visual Design
- **Theme**: Light/dark mode support
- **Colors**: Consistent with terminal aesthetics
- **Typography**: Monospace for commands, sans-serif for UI
- **Icons**: Lucide React for consistency

---

## Development Workflow

### Local Development
```bash
# Start both server and client
pnpm --filter smart-run-ui dev

# Start server only
pnpm --filter smart-run-ui dev:server

# Start client only
pnpm --filter smart-run-ui dev:client
```

### Production Build
```bash
# Build both server and client
pnpm --filter smart-run-ui build

# Start production server
pnpm --filter smart-run-ui start
```

---

## Deployment Options

### 1. Standalone
- Ship as separate npm package
- Users run `npx smart-run-ui`
- Opens browser automatically

### 2. Integrated
- Add `smart-run ui` command
- Starts server in background
- Opens browser to localhost

### 3. Cloud
- Deploy to Vercel/Netlify (client)
- Deploy to Railway/Render (server)
- Use remote storage for configs

---

## Security Considerations

1. **Authentication**
   - Optional auth for shared instances
   - Token-based for API access
   - Session management

2. **Authorization**
   - Read-only vs read-write modes
   - Package-level permissions
   - Script execution controls

3. **Input Validation**
   - Sanitize script commands
   - Validate file paths
   - Prevent directory traversal

---

## Performance Optimization

1. **Frontend**
   - Virtual scrolling for large lists
   - Code splitting by route
   - Optimistic UI updates
   - React Query caching

2. **Backend**
   - Response caching
   - Efficient file watching
   - Debounced sync operations
   - Connection pooling

---

*End of UI package plan*
