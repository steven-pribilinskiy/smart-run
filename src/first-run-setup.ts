import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import inquirer from 'inquirer';

/**
 * First-run setup utilities for smart-run CLI
 */

/**
 * Check if this is the first run of smart-run
 */
function isFirstRun(): boolean {
  const configDir = path.join(os.homedir(), '.config', 'smart-run');
  const firstRunMarker = path.join(configDir, '.first-run-complete');
  return !fs.existsSync(firstRunMarker);
}

/**
 * Mark that the first run setup has been completed
 */
function markFirstRunComplete(): void {
  const configDir = path.join(os.homedir(), '.config', 'smart-run');
  const firstRunMarker = path.join(configDir, '.first-run-complete');

  // Create config directory if it doesn't exist
  fs.mkdirSync(configDir, { recursive: true });

  // Create marker file
  fs.writeFileSync(firstRunMarker, new Date().toISOString());
}

/**
 * Check if smart-run is globally installed
 */
function isGlobalInstallation(): boolean {
  // Check if we're running from a global npm installation
  const execPath = process.argv[1];
  return execPath.includes('/lib/node_modules/') || execPath.includes('\\node_modules\\');
}

/**
 * Run first-time setup workflow
 */
async function runFirstTimeSetup(): Promise<void> {
  console.log('\n🎉 Welcome to smart-run!\n');
  console.log('This appears to be your first time using smart-run globally.');

  const { setupAliases } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupAliases',
      message: 'Would you like to set up convenient aliases (srun, sr) for smart-run?',
      default: true,
    },
  ]);

  if (setupAliases) {
    try {
      const { setupGlobalAliases } = await import('./setup-aliases.js');
      await setupGlobalAliases();
    } catch (_error) {
      console.log('\n❌ Failed to set up aliases automatically.');
      console.log('💡 You can set up aliases later by running:');
      console.log('   smart-run setup-aliases');
    }
  } else {
    console.log('\n💡 You can set up aliases later by running:');
    console.log('   smart-run setup-aliases');
  }

  console.log('\n📚 Documentation: https://github.com/steven-pribilinskiy/smart-run#readme');
  console.log('\n🚀 Get started by running: smart-run\n');

  // Mark first run as complete
  markFirstRunComplete();
}

/**
 * Check and handle first-run setup if needed
 */
async function handleFirstRunSetup(): Promise<void> {
  if (isGlobalInstallation() && isFirstRun()) {
    await runFirstTimeSetup();
  }
}

export {
  isFirstRun,
  markFirstRunComplete,
  isGlobalInstallation,
  runFirstTimeSetup,
  handleFirstRunSetup,
};
