# Smart-run Configuration Demos

This folder contains demonstrations of smart-run working with various npm script organization formats. Demos are organized by category for clarity.

## Categories

### zero-config
- 🔧 [basic-scripts/](./zero-config/basic-scripts/)
  - Standard npm scripts with no special configuration
  - Shows fallback behavior when no configuration is detected

### external-formats
- 📋 [ntl-format/](./external-formats/ntl-format/)
  - ntl.descriptions-based descriptions
- 📂 [npm-scripts-org/](./external-formats/npm-scripts-org/)
  - Comment header-based grouping
- 📝 [npm-scripts-info/](./external-formats/npm-scripts-info/)
  - scripts-info field for descriptions
- 🎯 [better-scripts/](./external-formats/better-scripts/)
  - Mixed object/array/string definitions with aliases

### smart-run-formats
- 🚀 [smart-run-native/](./smart-run-formats/smart-run-native/)
  - Native package-meta.yaml organized groups
- ✨ [enhanced-format/](./smart-run-formats/enhanced-format/)
  - Titles and emojis for improved UX
- 🧩 [lifecycle-scripts/](./smart-run-formats/lifecycle-scripts/)
  - Lifecycle vs regular script categorization

### monorepo-workspaces
- 🧭 [monorepo-basic/](./monorepo-workspaces/monorepo-basic/)
  - Basic pnpm workspace illustrating package discovery

## Running the Demos

Use the interactive menu:

```bash
npm run demo
```

Or run inside a specific demo directory, for example:

```bash
cd demo/zero-config/basic-scripts
npx smart-run
```

## What Each Demo Shows

| Demo | Configuration | Grouping | Descriptions | Visual Features |
|------|---------------|----------|--------------|-----------------|
| zero-config/basic-scripts | None | ❌ | Script commands | ❌ |
| external-formats/ntl-format | ntl.descriptions | ❌ | ✅ | ❌ |
| external-formats/npm-scripts-org | Header comments | ✅ | Script commands | ❌ |
| external-formats/npm-scripts-info | scripts-info field | ❌ | ✅ | ❌ |
| external-formats/better-scripts | better-scripts field | ❌ | ✅ | Aliases |
| smart-run-formats/smart-run-native | package-meta.yaml | ✅ | ✅ | ❌ |
| smart-run-formats/enhanced-format | package-meta.yaml | ✅ | ✅ | ✅ Titles & Emojis |

## Migration Path

1. Start: zero-config/basic-scripts → Any existing project
2. Add descriptions: external-formats/ntl-format or external-formats/npm-scripts-info
3. Add organization: external-formats/npm-scripts-org or smart-run-formats/smart-run-native
4. Enhanced UX: smart-run-formats/enhanced-format with titles and emojis

Each demo is self-contained and can be run independently to see how smart-run handles that specific configuration format.