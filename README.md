# smart-run

🚀 AI-powered interactive CLI for running package scripts with intelligent grouping and descriptions

[![npm version](https://badge.fury.io/js/smart-run.svg)](https://www.npmjs.com/package/smart-run)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🧠 **AI-Powered**: Automatic script analysis and intelligent grouping (coming soon)
- 📋 **Interactive Menu**: Beautiful CLI interface for selecting scripts
- 🏷️ **Multiple Configuration Methods**: Support for package-meta.yaml, npm-scripts organization, and ntl descriptions
- 📝 **Rich Descriptions**: Add meaningful descriptions to your scripts
- 🔍 **Missing Script Detection**: Shows scripts defined in metadata but missing from package.json
- ⚡ **Universal**: Works with npm, pnpm, bun, yarn, and any package manager
- 🎨 **Colorized Output**: Visual indicators for different script states
- 🔄 **Smart Fallbacks**: Automatically detects best configuration method
- ⚡ **Multiple Aliases**: Use `smart-run`, `srun`, or `sr` - whatever feels natural

## Installation

Install globally for use across all projects:

```bash
npm install -g smart-run
```

Or run directly with npx:

```bash
npx smart-run
```

### Global Aliases

After installation, you can use any of these commands:
- `smart-run` - Full command name
- `srun` - Short and sweet
- `sr` - Ultra-minimal for speed demons

All aliases work identically!

#### Setting Up Aliases

**Automatic Setup (Recommended):**
When installing globally, smart-run will automatically offer to set up aliases for you.

**Manual Setup:**
```bash
smart-run --setup-aliases
```

This interactive setup will:
- ✅ Detect your shell configuration (.bashrc, .zshrc, etc.)
- ✅ Check if smart-run is globally installed
- ✅ Let you choose which aliases to create
- ✅ Safely avoid conflicts with existing aliases
- ✅ Support multiple shell configurations

**Available Aliases:**
- `srun` - Most popular short alias
- `sr` - Ultra-short for power users
- `run` - Simple and descriptive
- `menu` - Descriptive alternative

After setup, restart your terminal or run `source ~/.bashrc` (or your shell config) to use the new aliases.

## Quick Start

1. Create a `package-meta.yaml` file in your project root:

```yaml
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start the development server"
      - key: build
        description: "Build the project for production"
  - name: "Testing"
    scripts:
      - key: test
        description: "Run all tests"
      - key: test:watch
        description: "Run tests in watch mode"
```

2. Run the menu:

```bash
smart-run
# or use the short aliases:
srun
# or even shorter:
sr
```

3. Select and run your scripts interactively!

## Configuration

smart-run supports multiple configuration methods, automatically selecting the best one available:

### 1. package-meta.yaml (Recommended)

The most flexible method with full control over grouping and descriptions:

```yaml
scriptGroups:
  - name: "Build & Development"
    scripts:
      - key: start
        description: "Start development server"
      - key: build
        description: "Build for production"
      - key: dev
        description: "Development mode with hot reload"
        
  - name: "Quality Assurance"
    scripts:
      - key: test
        description: "Run test suite"
      - key: lint
        description: "Lint code and fix issues"
      - key: type-check
        description: "Run TypeScript type checking"
        
  - name: "Deployment"
    scripts:
      - key: deploy
        description: "Deploy to production"
      - key: deploy:staging
        description: "Deploy to staging environment"
```

### 2. NPM Scripts Organization Pattern

Organize scripts directly in your `package.json` using category headers (inspired by [this article](https://dev.to/ycmjason/how-to-organise-npm-scripts-4d2m)):

```json
{
  "scripts": {
    "test": "jest",
    "build": "webpack",
    "\n# DEVELOPMENT SCRIPTS:": "",
    "start": "webpack serve",
    "dev": "webpack serve --mode development",
    "dev:watch": "webpack serve --mode development --watch",
    "\n# TESTING SCRIPTS:": "",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "\n# BUILD SCRIPTS:": "",
    "build:prod": "webpack --mode production",
    "build:analyze": "webpack-bundle-analyzer dist/stats.json"
  }
}
```

Category headers start with `\n#` and have empty string values. They create visual groups in both `npm run` output and smart-run.

### 3. NTL Descriptions

Use the [ntl](https://github.com/ruyadorno/ntl) format for script descriptions in `package.json`:

```json
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/"
  },
  "ntl": {
    "descriptions": {
      "start": "Start the development server",
      "build": "Build the project for production",
      "test": "Run all tests with Jest",
      "lint": "Lint source code with ESLint"
    },
    "runner": "yarn"
  },
  "packageManager": "yarn@3.2.1"
}
```

### Package Manager Detection

smart-run automatically detects your package manager using multiple sources in priority order:

1. **ntl.runner** - Per-project runner configuration in package.json `ntl.runner` field
2. **packageManager** - Standard `packageManager` field in package.json (npm/yarn/pnpm standard)
3. **Lock files** - Automatic detection based on lock files (pnpm-lock.yaml, bun.lockb, yarn.lock)
4. **Environment variable** - `NTL_RUNNER` environment variable (for ntl compatibility)
5. **Default fallback** - npm as the default package manager

Examples:
```json
{
  "packageManager": "pnpm@8.0.0",
  "ntl": {
    "runner": "yarn",
    "descriptions": { "start": "Start dev server" }
  }
}
```

The detected package manager will be shown in the output:
```
📦 Detected package manager: yarn
   (configured via ntl.runner)
```

### 4. Auto-Generated from Scripts

If no configuration is found, smart-run will display all scripts with their commands as descriptions.

### Configuration Priority

smart-run uses this priority order:

1. **package-meta.yaml** - Full control with grouping and descriptions
2. **npm-scripts organization** - Category headers in package.json scripts
3. **ntl descriptions** - Description metadata in package.json
4. **Raw scripts** - Direct script commands as descriptions

### Mixed Configurations

You can combine methods! For example:
- Use npm-scripts organization for categories
- Add ntl descriptions for better script descriptions
- smart-run will use the categories from npm-scripts and descriptions from ntl

### Menu Features

- **Grouped Display**: Scripts are organized by the groups you define
- **Missing Scripts**: Scripts in metadata but not in package.json are marked as `(MISSING)`
- **Extra Scripts**: Scripts in package.json but not in metadata appear in "Other Available Scripts"
- **Interactive Selection**: Use arrow keys to navigate, Enter to select

## Package Manager Support

Works seamlessly with:
- **npm**: `npm run <script>`
- **pnpm**: `pnpm run <script>`
- **bun**: `bun run <script>`
- **yarn**: `yarn <script>`

The tool automatically detects your package manager and uses the appropriate command.

## Example Output

### With package-meta.yaml configuration:
```
📦 Detected package manager: npm
📋 Using package-meta.yaml configuration

? Select an operation to run: (Use arrow keys)
❯ Development
  [start] Start development server
  [build] Build for production
  [dev] Development mode with hot reload
  
  Quality Assurance
  [test] Run test suite
  [lint] Lint code and fix issues
  [type-check] Run TypeScript type checking (MISSING)
  
  Other Available Scripts
  [prepare] husky install
  [postinstall] patch-package
  
  Exit
```

### With npm-scripts organization:
```
📦 Detected package manager: pnpm
📋 Using npm-scripts organization pattern

? Select an operation to run: (Use arrow keys)
❯ DEVELOPMENT SCRIPTS
  [start] Start the development server
  [dev] Run in development mode
  [dev:watch] Development with file watching
  
  TESTING SCRIPTS
  [test] Run all tests with Jest
  [test:watch] Run tests in watch mode
  [lint] Lint source code with ESLint
  
  Exit
```

### With ntl descriptions:
```
📦 Detected package manager: yarn
📋 Using ntl descriptions

? Select an operation to run: (Use arrow keys)
❯ Available Scripts
  [start] Start the development server
  [build] Build the project for production
  [test] Run all tests with Jest
  [lint] Lint source code with ESLint
  
  Exit
```

## CLI Options

```bash
smart-run [options]

Options:
  -h, --help       Show help
  -v, --version    Show version
  --config         Specify custom config file path
  --setup-aliases  Set up global aliases interactively
  --ai             Enable AI-powered script analysis (coming soon)
```

### Alias Management

Smart-run provides a comprehensive alias system for faster access:

```bash
# Set up aliases interactively
smart-run --setup-aliases

# After setup, use any alias:
srun              # Short alias
sr                # Ultra-short alias  
smart-run         # Full command name
```

## Why smart-run?

- **AI-Enhanced**: Future AI integration for automatic script categorization and insights
- **Better DX**: No more remembering complex script names
- **Multiple Config Methods**: Choose the approach that fits your workflow
- **Self-Documenting**: Descriptions make scripts discoverable
- **Team Friendly**: New team members can see all available commands
- **Organized**: Group related scripts together
- **Universal**: Works with any package manager or project setup
- **Compatible**: Works with existing ntl and npm-scripts organization patterns
- **Fast Access**: Multiple aliases (`smart-run`, `srun`, `sr`) for quick access

## License

MIT © Steven Pribilinskiy
