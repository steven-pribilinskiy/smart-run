# AI-Powered Script Analysis

Smart-run can automatically analyze your npm scripts and generate intelligent configurations using OpenAI GPT.

## Features

- 🧠 **Automatic Analysis**: Intelligent script categorization and grouping
- 📝 **Enhanced Descriptions**: AI-generated meaningful descriptions for your scripts
- 🔄 **Multiple Workflows**: Both automatic API integration and manual prompt generation
- 🌐 **Provider Support**: Works with OpenAI API and manual AI tools
- 🎯 **Smart Organization**: Logical grouping based on script purpose and complexity

## Automatic Analysis

For the fastest experience, use the integrated OpenAI API:

```bash
# Set up your OpenAI API key
export OPENAI_API_KEY="your-openai-key"

# Run AI analysis
smart-run ai
```

The AI will:
- Analyze all your package.json scripts
- Generate intelligent groupings (Development, Testing, Build, etc.)
- Create meaningful descriptions for each script
- Suggest optimal organization structure

## Manual Workflow

No API key? Generate prompts for any AI tool:

```bash
smart-run ai
# Choose "Manual Prompt" option
# Copy the generated prompt to ChatGPT, Claude, or any AI tool
```

This workflow:
1. Analyzes your scripts locally
2. Generates a comprehensive prompt
3. Copies it to your clipboard
4. Provides step-by-step instructions for external AI tools

## AI Provider Support

### Currently Supported

- **OpenAI** (GPT-3.5-turbo) - Full integration with API
- **Manual workflow** - Generate prompts for:
  - ChatGPT web interface
  - Claude
  - GitHub Copilot
  - Any other AI tool

### Setup Requirements

For automatic analysis, you need:
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Internet connection
- Node.js environment with smart-run installed

For manual workflow:
- No API key required
- Access to any AI tool (web or local)

## Configuration Output

The AI analysis can generate configurations in multiple formats:

### 1. package-meta.yaml (Recommended)
```yaml
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start the development server with hot reload"
      - key: dev
        description: "Run development mode with watch functionality"
        
  - name: "Testing"
    scripts:
      - key: test
        description: "Run the complete test suite"
      - key: test:watch
        description: "Run tests in watch mode for development"
```

### 2. package-meta.json
```json
{
  "scriptGroups": [
    {
      "name": "Development",
      "scripts": [
        {
          "key": "start",
          "description": "Start the development server with hot reload"
        }
      ]
    }
  ]
}
```

### 3. Embedded in package.json
```json
{
  "scripts": {
    "start": "npm run dev",
    "test": "jest"
  },
  "scriptsMeta": {
    "scriptGroups": [...]
  }
}
```

## AI Analysis Features

### Intelligent Grouping

The AI automatically categorizes scripts into logical groups:

- **Development**: start, dev, serve, watch commands
- **Testing**: test, spec, coverage, e2e commands  
- **Build & Deploy**: build, compile, package, deploy commands
- **Code Quality**: lint, format, typecheck commands
- **Maintenance**: clean, install, update commands

### Enhanced Descriptions

AI-generated descriptions provide:
- **Clear Purpose**: What the script does
- **Context**: When to use it
- **Dependencies**: What it requires
- **Output**: What it produces

### Smart Organization

The AI considers:
- Script complexity and length
- Command patterns and flags
- Project type and structure
- Common development workflows

## Troubleshooting

### Common Issues

**API Key Not Working**
```bash
# Check if your API key is set
echo $OPENAI_API_KEY

# Test API connectivity
smart-run ai
```

**Analysis Failed**
- Check your internet connection
- Verify API key permissions
- Try the manual workflow as fallback

**No Scripts Found**
- Ensure you're in a directory with package.json
- Check that your package.json has a "scripts" section
- Verify script format is valid

### Getting Help

1. **Use Manual Workflow**: If automatic analysis fails, try manual prompt generation
2. **Check Documentation**: Review [Configuration Formats](./configuration-formats.md)
3. **Migration Guide**: See [Migration Guide](./migration-guide.md) for existing setups
4. **Support**: Visit our [GitHub repository](https://github.com/steven-pribilinskiy/smart-run) for issues

## Best Practices

### Before Analysis
- Clean up unused scripts in package.json
- Ensure script names are descriptive
- Test that all scripts work correctly

### After Analysis
- Review generated descriptions for accuracy
- Adjust groupings if needed
- Test the configuration with `smart-run`
- Commit the configuration to version control

### Maintenance
- Re-run analysis when adding new scripts
- Update descriptions as scripts evolve
- Share configuration with team members

## Examples

### Simple Project
```bash
# Before: Basic npm scripts
{
  "scripts": {
    "start": "node server.js",
    "test": "jest",
    "build": "webpack"
  }
}

# After: AI-enhanced configuration
scriptGroups:
  - name: "Development"
    scripts:
      - key: start
        description: "Start the production server"
  - name: "Build"
    scripts:
      - key: build
        description: "Build the application for production"
  - name: "Testing"
    scripts:
      - key: test
        description: "Run the test suite with Jest"
```

### Complex Project
```bash
# Before: Many scripts without organization
{
  "scripts": {
    "start": "next start",
    "dev": "next dev",
    "build": "next build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit"
  }
}

# After: AI-organized with detailed descriptions
scriptGroups:
  - name: "Development"
    scripts:
      - key: dev
        description: "Start Next.js development server with hot reload"
      - key: start
        description: "Start Next.js production server"
        
  - name: "Build & Deploy"
    scripts:
      - key: build
        description: "Build Next.js application for production"
        
  - name: "Testing"
    scripts:
      - key: test
        description: "Run Jest test suite"
      - key: test:watch
        description: "Run tests in watch mode for development"
      - key: test:coverage
        description: "Generate test coverage report"
        
  - name: "Code Quality"
    scripts:
      - key: lint
        description: "Check code style with ESLint"
      - key: lint:fix
        description: "Fix ESLint issues automatically"
      - key: type-check
        description: "Run TypeScript type checking"
```

## Integration with Smart-run

The AI analysis integrates seamlessly with smart-run's other features:

- **Configuration Priority**: AI-generated configs take precedence
- **Migration Support**: Enhance existing configurations
- **Preview Mode**: See formatted commands with syntax highlighting
- **Multiple Formats**: Choose your preferred configuration format
- **Backwards Compatibility**: Works with existing ntl and other tools

For more information on configuration formats and migration, see:
- [Configuration Formats](./configuration-formats.md)
- [Migration Guide](./migration-guide.md)
- [Supported Packages](./supported-packages.md) 