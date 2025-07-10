# Supported npm Packages

This document outlines which npm script organization packages smart-run supports and our recommendations for migration.

## Currently Supported

smart-run provides **read-only compatibility** with these existing npm packages:

### ✅ ntl (npm task list)
- **Package**: [ntl](https://github.com/ruyadorno/ntl)
- **Support Level**: Full compatibility
- **Description**: Reads `ntl.descriptions` and `ntl.runner` from package.json
- **Pros**: 
  - Simple key-value descriptions
  - Package manager configuration
  - Standard npm scripts format
- **Cons**: 
  - No script grouping/organization
  - Limited to flat script lists
  - No visual enhancements (emoji, titles)
- **Recommendation**: Migrate to package-meta.yaml for better organization

### ✅ npm-scripts Organization Pattern  
- **Pattern**: Category headers in package.json scripts
- **Support Level**: Full compatibility
- **Description**: Recognizes `"\n# CATEGORY:"` headers in scripts
- **Pros**: 
  - Works with any package manager
  - No additional dependencies
  - Standard npm scripts format
- **Cons**: 
  - Limited to simple categorization
  - No descriptions for scripts
  - Headers clutter the scripts section
- **Recommendation**: Keep for simple projects, migrate for complex ones

### ✅ npm-scripts-info
- **Package**: [npm-scripts-info](https://github.com/srph/npm-scripts-info)
- **Support Level**: Full compatibility
- **Description**: Reads `scripts-info` field and `?` prefixed scripts from package.json
- **Pros**: 
  - Two flexible formats (field or ? prefix)
  - Works with standard npm scripts
  - Simple to implement
- **Cons**: 
  - No script grouping/organization
  - Limited to flat script lists
  - ? prefix format clutters scripts section
- **Recommendation**: Works great as-is, consider migrating for advanced grouping

### ✅ better-scripts
- **Package**: [better-scripts](https://github.com/iamyoki/better-scripts)
- **Support Level**: Full compatibility
- **Description**: Supports string, array, and object formats for script configuration
- **Pros**: 
  - Rich script configuration (descriptions, aliases, commands)
  - Multiple configuration formats
  - Visual enhancements with aliases and emojis
- **Cons**: 
  - **Non-standard approach**: Replaces all scripts with single `"scripts": "better-scripts"` entry
  - **Package manager incompatibility**: Cannot run scripts directly with `npm run` or `yarn`
  - **Tooling incompatibility**: IDE, CI/CD, and other tools expect standard npm scripts
  - **Vendor lock-in**: Difficult to migrate back to standard scripts once adopted
- **Recommendation**: Migrate to smart-run for advanced grouping and AI enhancements

## Packages We Don't Support

Instead of adding support for these packages, we recommend migrating to smart-run's native format:

### ❌ run-script-os
- **Package**: [run-script-os](https://github.com/charlesguse/run-script-os)
- **Why not supported**: Platform-specific script execution, different use case than organization
- **Alternative**: Use smart-run for organization, keep run-script-os for OS-specific logic

### ❌ npm-run-all
- **Package**: [npm-run-all](https://github.com/mysticatea/npm-run-all) / [npm-run-all2](https://github.com/bcomnes/npm-run-all2)
- **Why not supported**: Script execution tool for parallel/sequential execution, not organization
- **Alternative**: Use smart-run for organization, keep npm-run-all for complex execution patterns



## Why We Recommend Migration

### Benefits of smart-run Native Format

1. **Better Organization**: Group scripts logically instead of flat lists
2. **Future-Proof**: New features will be added to native format first
3. **Validation**: Better error messages and configuration validation
4. **IDE Support**: JSON schema support for autocomplete and validation
5. **Team Collaboration**: Clear, documented script organization
6. **Flexibility**: Easy to reorganize and maintain

### Migration Strategy

Instead of supporting every existing package, we provide:

1. **Automatic Migration Tools**: Convert existing configurations
2. **Comprehensive Documentation**: Step-by-step migration guides  
3. **Backward Compatibility**: Continue working with ntl and npm-scripts patterns
4. **AI-Powered Analysis**: Automatically suggest better organization

## Requesting Support for New Packages

If you're using a script organization package not listed here:

1. **Check if migration is better**: Most packages can be easily converted
2. **Open a discussion**: Share your use case on our GitHub repository
3. **Consider contributing**: Help us understand the value of supporting it

### Criteria for Adding Support

We'll consider adding support for packages that:
- Have significant adoption (1000+ weekly downloads)
- Provide unique functionality not available in smart-run
- Have active maintenance and community support
- Offer features that complement smart-run's goals

## Migration Tools

smart-run provides these migration utilities:

```bash
# AI-powered analysis and configuration generation
smart-run --ai

# Generate manual prompt for external AI tools
smart-run --ai  # Choose "Manual Prompt" option

# Create basic example configuration
smart-run      # Choose "Create Example" when no config found
```

## Configuration Format Comparison

| Format | Grouping | Descriptions | Package Manager | Validation | IDE Support |
|--------|----------|--------------|-----------------|------------|-------------|
| **package-meta.yaml** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **package-meta.json** | ✅ | ✅ | ✅ | ✅ | ✅ |  
| **scriptsMeta** | ✅ | ✅ | ✅ | ✅ | ✅ |
| ntl | ❌ | ✅ | ✅ | ❌ | ❌ |
| npm-scripts org | ✅ | ❌ | ❌ | ❌ | ❌ |
| npm-scripts-info | ❌ | ✅ | ❌ | ❌ | ❌ |
| scripts-description | ❌ | ✅ | ❌ | ❌ | ❌ |

## Getting Started with Migration

1. **Assess your current setup**: Run `smart-run` to see current configuration detection
2. **Choose a target format**: Usually package-meta.yaml for new projects
3. **Use AI analysis**: Run `smart-run --ai` for automatic configuration generation
4. **Test thoroughly**: Ensure all scripts work as expected
5. **Clean up**: Remove old configuration files once migration is complete

For detailed migration instructions, see our [Migration Guide](./migration-guide.md).
