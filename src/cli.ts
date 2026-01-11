#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { isInsideSmartRunRepo as isInsideSmartRunRepoFromIndex } from './index.js';

// Read package.json to get version and homepage
function getPackageInfo() {
  try {
    // Try package.json first, then package.demo.json for demo directories
    let packagePath = 'package.json';
    if (!existsSync(packagePath)) {
      const demoPath = 'package.demo.json';
      // Only use package.demo.json inside smart-run repo
      if (isInsideSmartRunRepoLocal() && existsSync(demoPath)) {
        packagePath = demoPath;
      }
    }
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return {
      version: packageJson.version || '1.0.0',
      homepage: packageJson.homepage || 'https://github.com/steven-pribilinskiy/smart-run#readme',
    };
  } catch (_error) {
    // Fallback values if reading fails
    return {
      version: '1.0.0',
      homepage: 'https://github.com/steven-pribilinskiy/smart-run#readme',
    };
  }
}

const packageInfo = getPackageInfo();

const program = new Command();

// Enable colors for help output
program.configureHelp({
  styleTitle: (str) => `\x1b[1m\x1b[32m${str}\x1b[0m`, // Bold green
  styleCommandText: (str) => `\x1b[36m${str}\x1b[0m`, // Cyan
  styleCommandDescription: (str) => `\x1b[37m${str}\x1b[0m`, // White
  styleOptionText: (str) => `\x1b[33m${str}\x1b[0m`, // Yellow
  styleOptionDescription: (str) => `\x1b[37m${str}\x1b[0m`, // White
  styleSubcommandText: (str) => `\x1b[36m${str}\x1b[0m`, // Cyan
  styleSubcommandDescription: (str) => `\x1b[37m${str}\x1b[0m`, // White
});

program
  .name('smart-run')
  .description(
    '🚀 AI-powered interactive CLI for running package scripts with intelligent grouping'
  )
  .version(packageInfo.version)
  .usage('[options] [command]')
  .option('-c, --config <file>', 'Specify custom config file path')
  .option('--preview-cmd', 'Show prettified command preview in interactive mode')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    try {
      // Handle first-run setup for global installations
      const { handleFirstRunSetup } = await import('./first-run-setup.js');
      await handleFirstRunSetup();
      const { executeInteractive } = await import('./application/execute.js');
      await executeInteractive(options.config, {
        previewCommand: options.previewCmd,
        disableColors: options.noColor,
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('ai')
  .description('Enable AI-powered script analysis and grouping')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    const { runAIAnalysis } = await import('./ai-analysis.js');
    await runAIAnalysis({ disableColors: options.noColor });
  });

program
  .command('migrate')
  .description('Migrate existing configurations to smart-run format')
  .action(async () => {
    const { migrate } = await import('./application/migrate.js');
    await migrate();
  });

program
  .command('preview')
  .description('Show all scripts with enhanced formatting')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    const { runPreview } = await import('./preview.js');
    await runPreview({ disableColors: options.noColor });
  });

program
  .command('lint')
  .description('Lint smart-run configuration for best practices')
  .argument('[directory]', 'Directory to lint (default: current directory)', '.')
  .action(async (directory) => {
    const { lint } = await import('./application/lint.js');
    const passed = lint(directory);
    process.exit(passed ? 0 : 1);
  });

program
  .command('ls')
  .description('List all scripts in a table format with detailed information')
  .option('--json', 'Output as JSON instead of table')
  .option('--no-colors', 'Disable colored output')
  .action(async (options) => {
    const { listScripts } = await import('./application/list.js');
    await listScripts({ json: options.json, disableColors: options.noColors });
  });
program
  .command('convert')
  .description('Convert from detected format to another')
  .option('--to <format>', 'Target format: smart-run|json|scriptsMeta', 'smart-run')
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    const { convertConfig } = await import('./application/convert.js');
    const res = convertConfig({ to: options.to, output: options.output });
    if (res.writtenTo) {
      console.log(`✅ Converted configuration written to ${res.writtenTo}`);
    } else {
      console.log('✅ Converted configuration in-memory');
    }
  });

program
  .command('hooks')
  .description('Manage git hooks for configuration linting')
  .argument('[command]', 'Hook command (install, uninstall, status, detect)')
  .argument('[hooks...]', 'Hook types to manage (pre-commit, pre-push, commit-msg)')
  .option('--force', 'Force overwrite existing hooks')
  .action(async (command, hooks, options) => {
    const { runHooksCli } = await import('./hooks/cli.js');
    const argv = ['node', 'smart-run-hooks', command || 'help', ...hooks];
    if (options.force) argv.push('--force');
    runHooksCli(argv);
  });

// Add examples and additional help
program.addHelpText(
  'after',
  `
Common Workflows:
  smart-run                    # Start interactive script menu
  smart-run --preview-cmd      # Quick access with command preview
  smart-run ai && smart-run    # AI-organize scripts, then run
  smart-run migrate            # One-time: migrate from npm-scripts-info
  
Development Integration:
  smart-run hooks install      # Enable config linting in git hooks
  smart-run lint               # Check configuration for best practices
  smart-run preview --json | jq  # Script analysis via JSON output

For more information, visit: ${packageInfo.homepage}
`
);

program.parse();

function isInsideSmartRunRepoLocal(): boolean {
  try {
    // Walk up from current file's directory to detect smart-run's own package.json
    let currentDir = process.cwd();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pkgPath = path.join(currentDir, 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name?: string };
          if (pkg && pkg.name === 'smart-run') return true;
        } catch {
          // ignore
        }
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch {
    // ignore
  }
  // Fallback to the exported helper if available
  try {
    return isInsideSmartRunRepoFromIndex();
  } catch {
    return false;
  }
}
