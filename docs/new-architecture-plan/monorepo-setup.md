# Monorepo Setup Guide

This guide details the setup and configuration of the Smart-Run monorepo using pnpm, Turbo, and Changesets.

---

## Initial Setup

### 1. Install pnpm
```bash
npm install -g pnpm
```

### 2. Initialize Workspace

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

### 3. Root package.json
```json
{
  "name": "smart-run-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev --parallel",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^1.10.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 4. Turbo Configuration

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true,
      "inputs": ["src/**", "test/**", "vitest.config.ts"]
    },
    "lint": {
      "cache": true,
      "inputs": ["src/**", "test/**", ".eslintrc.*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    }
  }
}
```

### 5. Changesets Configuration

Initialize changesets:
```bash
pnpm changeset init
```

Update `.changeset/config.json`:
```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

## GitHub Actions Setup

### CI Workflow (.github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm lint
      
      - run: pnpm type-check
      
      - run: pnpm test
      
      - run: pnpm build
```

### Release Workflow (.github/workflows/release.yml)
```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Package Structure Template

Each package should follow this structure:

```
packages/[package-name]/
├── src/
│   └── index.ts
├── test/
│   └── index.test.ts
├── dist/              # Build output (git-ignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Package package.json Template
```json
{
  "name": "@smart-run/[package-name]",
  "version": "0.0.0",
  "description": "Package description",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "lint": "eslint src test",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

---

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Run dev mode for all packages
pnpm dev

# Run dev for specific package
pnpm --filter smart-run dev

# Build all packages
pnpm build

# Test all packages
pnpm test

# Lint all packages
pnpm lint
```

### Dependency Management
```bash
# Add dependency to specific package
pnpm --filter @smart-run/core add lodash

# Add dev dependency to root
pnpm add -D -w eslint

# Add workspace dependency
pnpm --filter smart-run-ui add @smart-run/core@workspace:*
```

### Release Management
```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm version

# Publish packages
pnpm release
```

---

## Best Practices

1. **Shared Configuration**
   - Keep shared configs (ESLint, TypeScript, Prettier) at root
   - Extend in packages as needed

2. **Dependency Management**
   - Use workspace protocol for internal dependencies
   - Keep shared dev dependencies at root
   - Package-specific dependencies in package

3. **Build Optimization**
   - Use Turbo caching aggressively
   - Configure proper inputs/outputs
   - Use remote caching in CI

4. **Release Process**
   - Always use changesets for version bumps
   - Write meaningful changeset descriptions
   - Review generated changelogs before release

---

*End of setup guide*
