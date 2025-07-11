import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

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
  console.log('\n✨ Available commands:');
  console.log('   smart-run  - Full command name');
  console.log('   srun       - Short alias');
  console.log('   sr         - Ultra-short alias');
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
