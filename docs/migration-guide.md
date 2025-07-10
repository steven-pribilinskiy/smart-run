# Migration Guide

This guide shows you how to migrate from other npm script organization tools to smart-run's native configuration format using our built-in migration tools.

## Quick Migration

smart-run provides automatic migration tools that can detect and convert existing configurations:

```bash
# Interactive migration from main menu
smart-run
# Choose "🔄 Migrate Configuration"

# Or run migration directly
smart-run --migrate
```

## Supported Migration Sources

smart-run can automatically detect and migrate from these configurations:

### ✅ [ntl](https://github.com/ruyadorno/ntl) (npm task list)
- **Detection**: Looks for `ntl.descriptions` in package.json
- **Migration**: Converts descriptions to smart-run format
- **Enhancement**: Optional AI-powered grouping and description improvement

### ✅ npm-scripts Organization Pattern
- **Detection**: Finds category headers like `"\n# CATEGORY:"` in scripts
- **Migration**: Converts category headers to smart-run groups
- **Enhancement**: AI can improve descriptions and reorganize groups

### ✅ [npm-scripts-info](https://github.com/srph/npm-scripts-info)
- **Detection**: Looks for `scripts-info` field or `?` prefixed scripts in package.json
- **Migration**: Converts to smart-run description format
- **Enhancement**: AI grouping and enhanced descriptions

### ✅ scripts-description
- **Detection**: Finds `scripts-description` field in package.json
- **Migration**: Converts to smart-run format
- **Enhancement**: AI-powered organization and descriptions

### ✅ [better-scripts](https://github.com/iamyoki/better-scripts)
- **Detection**: Finds `better-scripts` field in package.json
- **Migration**: Converts string, array, and object formats to smart-run
- **Enhancement**: AI-powered grouping and enhanced descriptions

## Migration Process

### 1. Detection Phase
smart-run automatically scans your package.json for existing configurations:

```bash
$ smart-run --migrate
🔄 Smart-run Configuration Migration

📋 Found existing configurations:
   1. ntl descriptions (12 scripts)
   2. npm-scripts organization pattern (category headers)
```

### 2. Selection Phase
Choose which configuration to migrate:

```bash
? Which configuration would you like to migrate?
❯ ntl descriptions (12 scripts)
  npm-scripts organization pattern (category headers)
```

### 3. AI Enhancement (Optional)
If you have an OpenAI API key, you can enhance the migration:

```bash
? Would you like to enhance the configuration with AI-powered grouping and descriptions? (Y/n)
```

AI enhancement provides:
- **Intelligent Grouping**: Scripts are organized by purpose (Development, Testing, Build, etc.)
- **Enhanced Descriptions**: Clear, professional descriptions for each script
- **Best Practices**: Follows smart-run configuration best practices

### 4. Format Selection
Choose your preferred output format:

```bash
? Which format would you like to save the configuration in?
❯ 📄 YAML (package-meta.yaml) - Recommended
  📋 JSON (package-meta.json)
  📦 Embedded (scriptsMeta in package.json)
```

### 5. Completion
The migration tool saves your configuration and provides next steps:

```bash
✅ Configuration saved to package-meta.yaml
🎉 Migration complete!
🚀 You can now run: smart-run
```

## Migration Examples

### Example 1: ntl Migration

**Before** (package.json):
```json
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/",
    "deploy": "gh-pages -d dist"
  },
  "ntl": {
    "descriptions": {
      "start": "Start the development server",
      "build": "Build the project for production",
      "test": "Run all tests with Jest", 
      "lint": "Lint source code with ESLint",
      "deploy": "Deploy to GitHub Pages"
    }
  }
}
```

**After** (package-meta.yaml with AI enhancement):
```yaml
# Smart-run configuration (migrated from ntl)
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start the development server with hot reload"
      - key: build
        description: "Build the project for production deployment"
        
  - name: "Quality Assurance"
    scripts:
      - key: test
        description: "Run all tests with Jest"
      - key: lint
        description: "Lint source code with ESLint and fix issues"
        
  - name: "Deployment"
    scripts:
      - key: deploy
        description: "Deploy to GitHub Pages"
```

### Example 2: npm-scripts Organization Migration

**Before** (package.json):
```json
{
  "scripts": {
    "test": "jest",
    "build": "webpack",
    "\n# DEVELOPMENT SCRIPTS:": "",
    "start": "webpack serve",
    "dev": "webpack serve --mode development", 
    "\n# TESTING SCRIPTS:": "",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "\n# BUILD SCRIPTS:": "",
    "build:prod": "webpack --mode production"
  }
}
```

**After** (package-meta.yaml):
```yaml
# Smart-run configuration (migrated from npm-scripts organization)
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start development server"
      - key: dev
        description: "Start development server in development mode"
        
  - name: "Testing"
    scripts:
      - key: test:watch
        description: "Run tests in watch mode"
      - key: test:coverage
        description: "Run tests with coverage report"
        
  - name: "Build"
    scripts:
      - key: build:prod
        description: "Build for production"
```

### Example 3: scripts-info Migration

**Before** (package.json):
```json
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "scripts-info": {
    "start": "Start the development server",
    "build": "Build the project for production",
    "test": "Run all tests with Jest"
  }
}
```

**After** (package-meta.json):
```json
{
  "scriptGroups": [
    {
      "name": "Development",
      "scripts": [
        {
          "key": "start",
          "description": "Start the development server"
        },
        {
          "key": "build",
          "description": "Build the project for production"
        }
      ]
    },
    {
      "name": "Testing",
      "scripts": [
        {
          "key": "test",
          "description": "Run all tests with Jest"
        }
      ]
    }
  ]
}
```

### Example 4: better-scripts Migration

**Before** (package.json):
```json
{
  "scripts": {
    "scripts": "better-scripts"
  },
  "better-scripts": {
    "dev": {
      "command": "react-scripts start",
      "description": "Start the development server",
      "alias": "🧑🏻‍💻 Dev"
    },
    "build": ["react-scripts build", "Build the project for production"],
    "test": "react-scripts test",
    "lint": {
      "command": "eslint src/",
      "description": "Lint source code with ESLint"
    }
  }
}
```

**After** (package-meta.yaml):
```yaml
# Smart-run configuration (migrated from better-scripts)
scriptGroups:
  - name: "Development"
    scripts:
      - key: dev
        description: "Start the development server"
      - key: build
        description: "Build the project for production"
        
  - name: "Quality Assurance"
    scripts:
      - key: test
        description: "react-scripts test"
      - key: lint
        description: "Lint source code with ESLint"
```

## Output Format Options

### 1. YAML Format (Recommended)
- **File**: `package-meta.yaml`
- **Benefits**: Human-readable, easy to edit, comments supported
- **Best for**: New projects, team collaboration

### 2. JSON Format
- **File**: `package-meta.json`
- **Benefits**: Structured, IDE support, validation
- **Best for**: Projects preferring JSON, tool integration

### 3. Embedded Format
- **File**: `package.json` (adds `scriptsMeta` field)
- **Benefits**: Single file, no additional files
- **Best for**: Minimalist setups, existing tooling constraints

## AI Enhancement Features

When you have an OpenAI API key configured, migration includes:

### Intelligent Grouping
- **Development**: start, dev, serve, watch commands
- **Testing**: test, spec, coverage, e2e commands  
- **Build & Deploy**: build, compile, package, deploy commands
- **Code Quality**: lint, format, typecheck commands
- **Maintenance**: clean, install, update commands

### Enhanced Descriptions
- **Clear Language**: Professional, developer-friendly descriptions
- **Context Aware**: Descriptions that explain the purpose, not just the command
- **Consistent Style**: Uniform description format across all scripts

### Best Practices
- **Logical Organization**: Groups follow common development workflows
- **Intuitive Naming**: Group names that developers understand immediately
- **Complete Coverage**: All scripts are properly categorized

## Troubleshooting

### No Configurations Found
If no existing configurations are detected:
```bash
❌ No existing configurations found to migrate.
💡 Consider using: smart-run --ai to create a new configuration
```

**Solutions**:
1. Use `smart-run --ai` to create a new configuration
2. Manually create a basic configuration and customize it
3. Check if your configuration format is supported

### AI Enhancement Failed
If AI enhancement encounters an error:
```bash
❌ AI enhancement failed: OpenAI API error
⏭️  Continuing with basic conversion...
```

**Solutions**:
1. Check your OpenAI API key: `export OPENAI_API_KEY="your-key"`
2. Verify API key permissions and quota
3. Use basic conversion without AI enhancement

### Format Compatibility Issues
If you encounter issues with specific formats:
- Try a different output format (YAML, JSON, or scriptsMeta)
- Check for special characters in script names or descriptions
- Verify your package.json syntax is valid

## Advanced Usage

### Custom Configuration
After migration, you can further customize your configuration:

```yaml
# Add custom metadata
scriptGroups:
  - name: "Development"
    description: "Scripts for local development"
    scripts:
      - key: start
        description: "Start development server"
        tags: ["dev", "server"]
```

### Environment-Specific Configurations
Create different configurations for different environments:

```bash
# Development environment
smart-run --config package-meta.dev.yaml

# Production environment  
smart-run --config package-meta.prod.yaml
```

### Integration with Existing Tools
smart-run migration preserves compatibility with:
- **Package Manager Detection**: Respects `packageManager` field and lock files
- **ntl Configuration**: Maintains `ntl.runner` settings
- **Existing Scripts**: All original scripts remain functional

## Getting Help

If you need assistance with migration:

1. **Check Documentation**: Review the [Configuration Formats](./configuration-formats.md) guide
2. **Use AI Analysis**: Try `smart-run --ai` for intelligent configuration suggestions
3. **Manual Setup**: Use the interactive setup when running `smart-run` without configuration
4. **Community Support**: Open an issue on the GitHub repository

For detailed configuration options, see the [Configuration Formats](./configuration-formats.md) documentation.
