# Configuration Formats

smart-run supports multiple configuration formats to provide maximum flexibility while encouraging migration to its native format.

## Supported Formats

### 1. package-meta.yaml (Recommended)

The native smart-run format provides the most control and flexibility:

```yaml
scriptGroups:
  - name: "Development"
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
```

### 2. package-meta.json

JSON alternative to the YAML format:

```json
{
  "scriptGroups": [
    {
      "name": "Development",
      "scripts": [
        {
          "key": "start",
          "description": "Start development server"
        },
        {
          "key": "build", 
          "description": "Build for production"
        }
      ]
    },
    {
      "name": "Quality Assurance",
      "scripts": [
        {
          "key": "test",
          "description": "Run test suite"
        },
        {
          "key": "lint",
          "description": "Lint code and fix issues"
        }
      ]
    }
  ]
}
```

### 3. scriptsMeta Object in package.json

Embed smart-run configuration directly in package.json:

```json
{
  "name": "my-project",
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/"
  },
  "scriptsMeta": {
    "scriptGroups": [
      {
        "name": "Development",
        "scripts": [
          {
            "key": "start",
            "description": "Start development server"
          },
          {
            "key": "build",
            "description": "Build for production"
          }
        ]
      },
      {
        "name": "Quality Assurance", 
        "scripts": [
          {
            "key": "test",
            "description": "Run test suite"
          },
          {
            "key": "lint",
            "description": "Lint code and fix issues"
          }
        ]
      }
    ]
  }
}
```

### 4. npm-scripts Organization Pattern

Organize scripts using category headers in package.json (inspired by [this article](https://dev.to/ycmjason/how-to-organise-npm-scripts-4d2m)):

```json
{
  "scripts": {
    "test": "jest",
    "build": "webpack",
  "\n# 🛠️ DEVELOPMENT SCRIPTS:": "",
    "start": "webpack serve",
    "dev": "webpack serve --mode development", 
    "dev:watch": "webpack serve --mode development --watch",
  "\n# 🧪 TESTING SCRIPTS:": "",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
  "\n# 🏗️ BUILD SCRIPTS:": "",
    "build:prod": "webpack --mode production",
    "build:analyze": "webpack-bundle-analyzer dist/stats.json"
  }
}
```

### 5. ntl Descriptions

Compatible with the [ntl](https://github.com/ruyadorno/ntl) package format:

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
  }
}
```

### 6. npm-scripts-info

Compatible with the [npm-scripts-info](https://github.com/srph/npm-scripts-info) package format:

**Method 1: Using `scripts-info` field**
```json
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/"
  },
  "scripts-info": {
    "start": "Start the development server",
    "build": "Build the project for production",
    "test": "Run all tests with Jest",
    "lint": "Lint source code with ESLint"
  }
}
```

**Method 2: Using `?` prefixed scripts**
```json
{
  "scripts": {
    "?start": "Start the development server",
    "start": "webpack serve",
    "?build": "Build the project for production", 
    "build": "webpack --mode production",
    "?test": "Run all tests with Jest",
    "test": "jest",
    "?lint": "Lint source code with ESLint",
    "lint": "eslint src/"
  }
}
```

### 7. better-scripts

Compatible with the [better-scripts](https://github.com/iamyoki/better-scripts) package format:

**Method 1: Object format with command and description**
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
    "build": {
      "command": "react-scripts build",
      "description": "Build the project for production"
    },
    "test": {
      "command": "react-scripts test",
      "description": "Run tests in watch mode"
    }
  }
}
```

**Method 2: Array format [command, description]**
```json
{
  "scripts": {
    "scripts": "better-scripts"
  },
  "better-scripts": {
    "dev": ["react-scripts start", "Start the development server"],
    "build": ["react-scripts build", "Build the project for production"],
    "test": ["react-scripts test", "Run tests in watch mode"]
  }
}
```

**Method 3: Simple string format**
```json
{
  "scripts": {
    "scripts": "better-scripts"
  },
  "better-scripts": {
    "dev": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
```

## Configuration Priority

smart-run automatically selects the best available configuration method in this order:

1. **package-meta.yaml** - Native YAML format (or custom config file specified with --config)
2. **npm-scripts organization** - Category headers in scripts  
3. **[ntl](https://github.com/ruyadorno/ntl) descriptions** - Description metadata
4. **[npm-scripts-info](https://github.com/srph/npm-scripts-info)** - Script descriptions using scripts-info field or ? prefixed scripts
5. **[better-scripts](https://github.com/iamyoki/better-scripts)** - Script descriptions using better-scripts field
6. **Raw scripts** - Direct script commands as descriptions

**Note**: package-meta.json and scriptsMeta formats are supported but need to be explicitly specified or the code needs to be updated to detect them automatically.

## Package Manager Detection

Smart-run automatically detects your package manager using a sophisticated priority system. For detailed information about how package manager detection works, see the [Package Manager Detection Guide](./package-manager-detection.md).

## Mixed Configurations

You can combine multiple formats! For example:
- Use npm-scripts organization for categories
- Add [ntl](https://github.com/ruyadorno/ntl) descriptions for better script descriptions
- smart-run will merge the categories from npm-scripts with descriptions from [ntl](https://github.com/ruyadorno/ntl)

## Benefits of Native Format

The native smart-run formats (package-meta.yaml, package-meta.json, scriptsMeta) provide:

- **Full Control**: Define exactly how scripts are grouped and described
- **Flexibility**: Easy to reorganize and maintain
- **Validation**: Clear structure with better error messages
- **Future-Proof**: New features will be added to the native format first
- **Team Collaboration**: Clear, documented script organization
- **IDE Support**: Better autocomplete and validation with JSON schema

## Migration Recommendations

If you're currently using other script organization tools, we recommend migrating to the smart-run native format for the best experience. See the [Migration Guide](./migration-guide.md) for detailed conversion instructions.
