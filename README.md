# smart-run

🚀 AI-powered interactive CLI for running package scripts with intelligent organization and descriptions

[![npm version](https://badge.fury.io/js/smart-run.svg)](https://www.npmjs.com/package/smart-run)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🧠 **AI-Powered**: Automatic script analysis and intelligent grouping using an LLM
- 📋 **Interactive Menu**: Beautiful CLI interface for selecting scripts
- 🏷️ **Flexible Configuration**: Works with existing setups and multiple configuration formats
- 📝 **Rich Descriptions**: Add meaningful descriptions to your scripts
- 🔍 **Smart Script Detection**: Highlights missing scripts, ungrouped items, and scripts without descriptions
- 📦 **Automatic Package Manager Detection**: Intelligently detects npm, pnpm, bun, yarn, and other package managers
- ⚡ **Universal**: Works with npm, pnpm, bun, yarn, and any package manager
- 🎨 **Multiple Aliases**: Use `smart-run`, `srun`, or `sr` for quick access

## Installation

```bash
# Install globally
npm install -g smart-run

# Or run directly
npx smart-run
```

### Aliases

After installation, use any of these commands:
- `smart-run` - Full command name
- `srun` - Short alias
- `sr` - Ultra-short alias

## Quick Start

1. **Just run it** - smart-run works with any existing package.json:

```bash
smart-run
# or use the short aliases:
srun
# or even shorter:
sr
```

2. **Optional**: Create a `package-meta.yaml` for organized script groups:

```yaml
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start the development server"
      - key: build
        description: "Build the project for production"
```

3. Select and run your scripts interactively!

## AI-Powered Analysis

Smart-run can automatically analyze your scripts and generate intelligent configurations. See the [AI Analysis Guide](./docs/ai-analysis.md) for detailed information.

```bash
# Quick start with AI analysis
smart-run ai
```

## Configuration

Smart-run works with your existing setup and supports multiple configuration formats:

- **package-meta.yaml** - Native format (recommended)
- **npm-scripts organization** - Category headers in package.json
- **ntl descriptions** - Compatible with existing ntl setups
- **npm-scripts-info** - Compatible with scripts-info field and ? prefixed scripts
- **better-scripts** - Compatible with better-scripts configuration formats

The system automatically detects your package manager (npm, pnpm, bun, yarn) and configuration format. See the [Configuration Formats Guide](./docs/configuration-formats.md) for detailed setup options and the [Package Manager Detection Guide](./docs/package-manager-detection.md) for package manager detection details.

## CLI Options

```bash
smart-run [options] [command]

Options:
  -c, --config <file>  Specify custom config file path
  --preview-cmd        Show prettified command preview in interactive mode
  --no-color          Disable colored output
  -h, --help          Show help
  -v, --version       Show version

Commands:
  ai                  AI-powered script analysis and grouping
  migrate            Migrate existing configurations
  preview            Show all scripts with enhanced formatting
  lint               Lint smart-run configuration for best practices
  ls                 List all scripts in a table format with detailed information
  hooks              Manage git hooks for configuration linting

Examples:
  smart-run                    # Interactive menu
  srun --config my-config.yaml # Use custom config
  sr --preview-cmd             # Show command preview
  smart-run ai                 # AI analysis workflow
```

## Configuration Setup

If no configuration is found, smart-run offers several setup options:

- **🧠 AI Analysis** - Auto-generate configuration with intelligent grouping
- **📝 Manual Setup** - Generate prompt for external AI tools
- **📋 Generate Config** - Create config from package.json scripts
- **⏭️ Continue** - Use scripts without configuration

## Documentation

For detailed information about configuration and usage:

- **[AI Analysis Guide](./docs/ai-analysis.md)** - Complete guide to AI-powered script analysis and configuration generation
- **[Architecture Overview](./docs/architecture.md)** - High-level overview of the current project architecture
- **[Configuration Formats](./docs/configuration-formats.md)** - Complete guide to all supported configuration methods
- **[Package Manager Detection](./docs/package-manager-detection.md)** - How smart-run detects and works with different package managers
- **[Migration Guide](./docs/migration-guide.md)** - Step-by-step instructions for migrating from other tools  
- **[Supported Packages](./docs/supported-packages.md)** - Package compatibility and recommendations
- **[Example Output](./docs/example-output.md)** - Sample interactive menus under various configurations

## License

MIT © Steven Pribilinskiy
