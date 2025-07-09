import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import inquirer from 'inquirer';

type AliasChoice = {
  name: string;
  value: string;
  checked: boolean;
};

/**
 * Detect the user's shell and return appropriate config files
 */
function detectShellConfigs(): string[] {
  const shell = process.env.SHELL || '/bin/bash';
  const home = homedir();

  const configs: string[] = [];

  if (shell.includes('zsh')) {
    configs.push(join(home, '.zshrc'));
  } else if (shell.includes('fish')) {
    configs.push(join(home, '.config/fish/config.fish'));
  } else if (shell.includes('bash')) {
    configs.push(join(home, '.bashrc'));
    configs.push(join(home, '.bash_profile'));
  }

  // Also check for common cross-shell configs
  configs.push(join(home, '.profile'));

  return configs.filter((config) => existsSync(config));
}

/**
 * Check if an alias already exists in shell config
 */
function aliasExists(configFile: string, alias: string): boolean {
  if (!existsSync(configFile)) return false;

  try {
    const content = readFileSync(configFile, 'utf8');
    const aliasPattern = new RegExp(`alias\\s+${alias}\\s*=`, 'm');
    return aliasPattern.test(content);
  } catch {
    return false;
  }
}

/**
 * Add alias to shell config file
 */
function addAlias(configFile: string, alias: string, command: string): void {
  const aliasLine = `\n# smart-run alias\nalias ${alias}="${command}"\n`;

  try {
    appendFileSync(configFile, aliasLine);
    console.log(`✅ Added alias '${alias}' to ${configFile}`);
  } catch (error) {
    console.error(`❌ Failed to add alias to ${configFile}:`, error);
  }
}

/**
 * Run a shell command and return success status
 */
function runCommand(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/**
 * Main function to set up global aliases
 */
export async function setupGlobalAliases(): Promise<void> {
  console.log('🔧 Smart-run Global Alias Setup\n');

  // Detect shell configs
  const shellConfigs = detectShellConfigs();

  if (shellConfigs.length === 0) {
    console.log('❌ No shell configuration files found.');
    console.log('   You may need to manually add aliases to your shell config.');
    console.log('   Add these lines to your shell configuration:');
    console.log('   alias srun="smart-run"');
    console.log('   alias sr="smart-run"');
    return;
  }

  console.log(`📍 Found shell configurations:`);
  shellConfigs.forEach((config) => console.log(`   - ${config}`));
  console.log();

  // Check current global installation
  const isGloballyInstalled = await runCommand('npm', ['list', '-g', 'smart-run']);

  if (!isGloballyInstalled) {
    console.log('⚠️  smart-run is not globally installed.');

    const { shouldInstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInstall',
        message: 'Would you like to install smart-run globally first?',
        default: true,
      },
    ]);

    if (shouldInstall) {
      console.log('🔄 Installing smart-run globally...');
      const installSuccess = await runCommand('npm', ['install', '-g', 'smart-run']);

      if (!installSuccess) {
        console.log(
          '❌ Failed to install globally. You may need to run with sudo or use a different method.'
        );
        return;
      }

      console.log('✅ smart-run installed globally!');
    } else {
      console.log('⚠️  Skipping global installation. Aliases will point to npx instead.');
    }
  }

  // Choose aliases to set up
  const availableAliases: AliasChoice[] = [
    { name: 'srun - Short and sweet', value: 'srun', checked: true },
    { name: 'sr - Ultra-minimal for speed', value: 'sr', checked: true },
    { name: 'run - Simple and direct', value: 'run', checked: false },
    { name: 'menu - Descriptive name', value: 'menu', checked: false },
  ];

  // Check which aliases already exist
  const existingAliases = new Set<string>();
  for (const config of shellConfigs) {
    for (const alias of availableAliases) {
      if (aliasExists(config, alias.value)) {
        existingAliases.add(alias.value);
      }
    }
  }

  if (existingAliases.size > 0) {
    console.log('⚠️  Some aliases already exist:');
    existingAliases.forEach((alias) => console.log(`   - ${alias}`));
    console.log();
  }

  const { selectedAliases } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAliases',
      message: "Select which aliases you'd like to set up:",
      choices: availableAliases.map((alias) => ({
        ...alias,
        name: existingAliases.has(alias.value) ? `${alias.name} (already exists)` : alias.name,
        disabled: existingAliases.has(alias.value) ? 'Already exists' : false,
      })),
    },
  ]);

  if (selectedAliases.length === 0) {
    console.log('👋 No aliases selected. Setup complete!');
    return;
  }

  // Choose which shell config to use
  const { targetConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetConfig',
      message: 'Which shell configuration file should we use?',
      choices: [
        ...shellConfigs.map((config) => ({ name: config, value: config })),
        { name: 'Add to all found configs', value: 'all' },
      ],
    },
  ]);

  // Determine the command to use
  const command = isGloballyInstalled ? 'smart-run' : 'npx smart-run';

  // Add aliases
  const configsToUpdate = targetConfig === 'all' ? shellConfigs : [targetConfig];

  for (const config of configsToUpdate) {
    for (const alias of selectedAliases) {
      if (!aliasExists(config, alias)) {
        addAlias(config, alias, command);
      }
    }
  }

  console.log('\n🎉 Alias setup complete!');
  console.log('\n📝 To use the new aliases, either:');
  console.log('   1. Restart your terminal, or');
  console.log('   2. Run: source ~/.zshrc (or your shell config file)');
  console.log('\n✨ You can now use:');
  selectedAliases.forEach((alias: string) => {
    console.log(`   ${alias} - launches smart-run`);
  });
}
