#!/usr/bin/env node

import { runSmartRun } from './index.js';

const args = process.argv.slice(2);

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
smart-run v1.0.0

🚀 AI-powered interactive CLI for running package scripts with intelligent grouping

Usage:
  smart-run [options]
  srun [options]
  sr [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number
  --config <file>  Specify custom config file path
  --setup-aliases  Set up global aliases interactively
  --ai             Enable AI-powered script analysis (coming soon)

Examples:
  smart-run                    # Interactive menu
  srun --config my-config.yaml # Use custom config
  sr                           # Ultra-short alias
  smart-run --setup-aliases    # Configure global aliases

For more information, visit: https://github.com/steven-pribilinskiy/smart-run
`);
  process.exit(0);
}

// Handle version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log('1.0.0');
  process.exit(0);
}

// Handle alias setup
if (args.includes('--setup-aliases')) {
  const { setupGlobalAliases } = await import('./setup-aliases.js');
  await setupGlobalAliases();
  process.exit(0);
}

// Extract config path if provided
let configPath: string | undefined;
const configIndex = args.findIndex(arg => arg === '--config');
if (configIndex !== -1 && args[configIndex + 1]) {
  configPath = args[configIndex + 1];
}

runSmartRun(configPath).catch((error: Error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
