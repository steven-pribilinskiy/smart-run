# Example Output

Below are sample interactive menus produced by **smart-run** under different configuration scenarios.

---

## With `package-meta.yaml` configuration

```text
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

---

## With *npm-scripts organization*

```text
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

---

## With *ntl descriptions*

```text
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
