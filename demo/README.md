# Smart-run Configuration Demos

This folder contains demonstrations of smart-run working with various npm script organization formats. Each subdirectory showcases a different configuration approach.

## Available Demos

### 🔧 [basic-scripts/](./basic-scripts/)
**Standard npm scripts with no special configuration**
- Demonstrates smart-run working with any existing package.json
- Shows the fallback behavior when no configuration is detected
- Scripts are displayed as simple key-value pairs

### 📋 [ntl-format/](./ntl-format/)
**[ntl](https://github.com/ruyadorno/ntl) (npm task list) configuration**
- Uses `ntl.descriptions` for script descriptions
- Includes `ntl.runner` for package manager configuration
- Shows flat script list with descriptions

### 📂 [npm-scripts-org/](./npm-scripts-org/)
**npm-scripts organization pattern**
- Uses category headers like `"\n# DEVELOPMENT:"` in scripts
- Demonstrates automatic grouping based on headers
- No additional dependencies required

### 📝 [npm-scripts-info/](./npm-scripts-info/)
**[npm-scripts-info](https://github.com/srph/npm-scripts-info) configuration**
- Uses `scripts-info` field for script descriptions
- Shows compatibility with [npm-scripts-info](https://github.com/srph/npm-scripts-info) package
- Simple key-value description format

### 🎯 [better-scripts/](./better-scripts/)
**[better-scripts](https://github.com/iamyoki/better-scripts) configuration**
- Demonstrates object, array, and string formats
- Shows alias extraction to title/emoji fields
- Includes the non-standard `"scripts": "better-scripts"` approach

### 🚀 [smart-run-native/](./smart-run-native/)
**smart-run native configuration**
- Uses `package-meta.yaml` for organized script groups
- Shows the recommended configuration format
- Demonstrates logical script organization

### ✨ [enhanced-format/](./enhanced-format/)
**Enhanced smart-run configuration**
- Showcases new `title` and `emoji` fields
- Visual enhancements for better UX
- Modern approach to script presentation

## Running the Demos

### From the main project directory:

```bash
# Run individual demos
npm run demo:basic
npm run demo:ntl
npm run demo:npm-org
npm run demo:npm-info
npm run demo:better
npm run demo:native
npm run demo:enhanced

# Run all demos sequentially
npm run demo:all
```

### From within each demo directory:

```bash
cd demo/basic-scripts
npx smart-run
```

## What Each Demo Shows

| Demo | Configuration | Grouping | Descriptions | Visual Features |
|------|---------------|----------|--------------|-----------------|
| **basic-scripts** | None | ❌ | Script commands | ❌ |
| **ntl-format** | ntl.descriptions | ❌ | ✅ | ❌ |
| **npm-scripts-org** | Header comments | ✅ | Script commands | ❌ |
| **npm-scripts-info** | scripts-info field | ❌ | ✅ | ❌ |
| **better-scripts** | better-scripts field | ❌ | ✅ | Aliases |
| **smart-run-native** | package-meta.yaml | ✅ | ✅ | ❌ |
| **enhanced-format** | package-meta.yaml | ✅ | ✅ | ✅ Titles & Emojis |

## Migration Path

The demos are ordered to show a logical migration path:

1. **Start**: basic-scripts → Any existing project
2. **Add descriptions**: ntl-format or npm-scripts-info
3. **Add organization**: npm-scripts-org or smart-run-native
4. **Enhanced experience**: enhanced-format with visual improvements

## Features Demonstrated

- **Automatic detection** of different configuration formats
- **Backward compatibility** with existing npm script tools
- **Enhanced UX** with titles, emojis, and organized groups
- **Migration capabilities** from any format to smart-run native
- **Visual presentation** improvements over standard npm scripts

Each demo is self-contained and can be run independently to see how smart-run handles that specific configuration format. 