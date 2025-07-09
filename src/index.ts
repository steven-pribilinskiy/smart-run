import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import yaml from 'js-yaml';

export interface ScriptConfig {
  key: string;
  description: string;
}

export interface ScriptGroup {
  name: string;
  scripts: ScriptConfig[];
}

export interface PackageMeta {
  scriptGroups: ScriptGroup[];
}

export interface NtlDescriptions {
  [scriptName: string]: string;
}

export interface PackageJson {
  scripts?: Record<string, string>;
  packageManager?: string;
  ntl?: {
    descriptions?: NtlDescriptions;
    runner?: string;
    [key: string]: any;
  };
}

export interface Choice {
  name: string;
  value: string | null;
  disabled?: boolean | string;
}

/**
 * Load script groups from package-meta.yaml
 */
function getScriptGroups(configPath = 'package-meta.yaml'): ScriptGroup[] {
  const metaPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(metaPath)) {
    console.warn(`⚠️  ${configPath} not found. Creating example file...`);
    createExampleConfig(metaPath);
    return [];
  }

  try {
    const meta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;
    if (
      !meta ||
      typeof meta !== 'object' ||
      !Array.isArray(meta.scriptGroups)
    ) {
      console.error(
        `Invalid format in ${configPath}. Expected scriptGroups array.`,
      );
      return [];
    }
    return meta.scriptGroups;
  } catch (error) {
    console.error(`Error parsing ${configPath}:`, error);
    return [];
  }
}

/**
 * Load npm scripts from package.json
 */
function getNpmScripts(): Record<string, string> {
  const pkgPath = path.resolve(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found in current directory');
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.scripts || {};
  } catch (error) {
    throw new Error('Error parsing package.json');
  }
}

/**
 * Load package.json with full structure
 */
function getPackageJson(): PackageJson {
  const pkgPath = path.resolve(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found in current directory');
  }

  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (error) {
    throw new Error('Error parsing package.json');
  }
}

/**
 * Parse npm-scripts organization pattern from package.json scripts
 * Detects category headers like "\n# CATEGORY:" with empty string values
 */
function parseNpmScriptGroups(scripts: Record<string, string>): ScriptGroup[] {
  const groups: ScriptGroup[] = [];
  let currentGroup: ScriptGroup | null = null;

  for (const [key, value] of Object.entries(scripts)) {
    // Check if this is a category header (starts with \n# and has empty value)
    if (key.startsWith('\n#') && value === '') {
      // Extract category name (remove \n# and trailing :)
      const categoryName = key.replace(/^\n#\s*/, '').replace(/:?\s*$/, '');

      if (currentGroup) {
        groups.push(currentGroup);
      }

      currentGroup = {
        name: categoryName,
        scripts: [],
      };
    } else if (currentGroup && !key.startsWith('\n#')) {
      // Add script to current group
      currentGroup.scripts.push({
        key,
        description: value, // Use the script command as description
      });
    } else if (!currentGroup && !key.startsWith('\n#')) {
      // Script without category - create "Scripts" group
      if (!groups.find(g => g.name === 'Scripts')) {
        groups.push({
          name: 'Scripts',
          scripts: [],
        });
      }
      const scriptsGroup = groups.find(g => g.name === 'Scripts')!;
      scriptsGroup.scripts.push({
        key,
        description: value,
      });
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Parse ntl descriptions from package.json
 */
function getNtlDescriptions(pkg: PackageJson): NtlDescriptions {
  return pkg.ntl?.descriptions || {};
}

/**
 * Detect package manager from multiple sources
 */
function detectPackageManager(pkg?: PackageJson): string {
  // Priority 1: ntl.runner configuration
  if (pkg?.ntl?.runner) {
    return pkg.ntl.runner;
  }

  // Priority 2: packageManager field (npm/yarn/pnpm standard)
  if (pkg?.packageManager) {
    const manager = pkg.packageManager.split('@')[0]; // Remove version if present
    if (['npm', 'pnpm', 'bun', 'yarn'].includes(manager)) {
      return manager;
    }
  }

  // Priority 3: Lock file detection
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('yarn.lock')) return 'yarn';

  // Priority 4: Environment variable (for ntl compatibility)
  const envRunner = process.env.NTL_RUNNER;
  if (envRunner && ['npm', 'pnpm', 'bun', 'yarn'].includes(envRunner)) {
    return envRunner;
  }

  // Default fallback
  return 'npm';
}

/**
 * Create example configuration file
 */
function createExampleConfig(metaPath: string): void {
  const exampleConfig = `# Smart-run configuration
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
`;

  fs.writeFileSync(metaPath, exampleConfig);
  console.log(`📝 Created example ${path.basename(metaPath)}`);
}

/**
 * Run a script using the detected package manager
 */
function runScript(scriptName: string, packageManager: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const commands = {
      npm: ['npm', 'run', scriptName],
      pnpm: ['pnpm', 'run', scriptName],
      bun: ['bun', 'run', scriptName],
      yarn: ['yarn', scriptName],
    };

    const [cmd, ...args] =
      commands[packageManager as keyof typeof commands] || commands.npm;

    console.log(`🚀 Running: ${cmd} ${args.join(' ')}\n`);

    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * Main function to run smart-run
 */
export async function runSmartRun(configPath?: string): Promise<void> {
  const pkg = getPackageJson();
  const scripts = pkg.scripts || {};
  const packageManager = detectPackageManager(pkg);

  console.log(`📦 Detected package manager: ${packageManager}`);

  // Show configuration source if explicitly configured
  if (pkg.ntl?.runner) {
    console.log(`   (configured via ntl.runner)`);
  } else if (pkg.packageManager) {
    console.log(`   (configured via packageManager field)`);
  } else if (process.env.NTL_RUNNER) {
    console.log(`   (configured via NTL_RUNNER environment variable)`);
  }
  console.log();

  // Get script groups from different sources (in priority order)
  const metaGroups = getScriptGroups(configPath);
  const npmGroups = parseNpmScriptGroups(scripts);
  const ntlDescriptions = getNtlDescriptions(pkg);

  // Filter out scripts that are actually valid (not category headers)
  const validScripts = Object.fromEntries(
    Object.entries(scripts).filter(
      ([key, value]) => !key.startsWith('\n#') || value !== '',
    ),
  );

  const allScriptKeys = new Set(Object.keys(validScripts));
  const categorizedScriptKeys = new Set<string>();
  const choices: Choice[] = [];

  // Priority 1: Use package-meta.yaml groups if they exist
  if (metaGroups.length > 0) {
    console.log('📋 Using package-meta.yaml configuration\n');

    for (const group of metaGroups) {
      if (!group || !group.name || !Array.isArray(group.scripts)) {
        console.warn('Skipping invalid group:', group);
        continue;
      }

      choices.push({
        name: `${group.name}`,
        value: null,
        disabled: true,
      });

      for (const s of group.scripts) {
        if (!s || !s.key || !s.description) {
          console.warn('Skipping invalid script:', s);
          continue;
        }

        categorizedScriptKeys.add(s.key);
        if (validScripts[s.key]) {
          choices.push({
            name: `  [${s.key}] ${s.description}`,
            value: s.key,
          });
        } else {
          choices.push({
            name: `  [${s.key}] ${s.description}`,
            value: null,
            disabled: '(MISSING)',
          });
        }
      }

      // Add spacing between groups (only if not the last group)
      if (metaGroups.indexOf(group) < metaGroups.length - 1) {
        choices.push(new inquirer.Separator(' ') as any);
      }
    }
  }
  // Priority 2: Use npm-scripts organization pattern
  else if (npmGroups.length > 0) {
    console.log('📋 Using npm-scripts organization pattern\n');

    for (const group of npmGroups) {
      choices.push({
        name: `${group.name}`,
        value: null,
        disabled: true,
      });

      for (const s of group.scripts) {
        categorizedScriptKeys.add(s.key);

        // Use ntl description if available, otherwise use script command
        const description = ntlDescriptions[s.key] || s.description;

        choices.push({
          name: `  [${s.key}] ${description}`,
          value: s.key,
        });
      }

      // Add spacing between groups (only if not the last group)
      if (npmGroups.indexOf(group) < npmGroups.length - 1) {
        choices.push(new inquirer.Separator(' ') as any);
      }
    }
  }
  // Priority 3: Use ntl descriptions without groups
  else if (Object.keys(ntlDescriptions).length > 0) {
    console.log('📋 Using ntl descriptions\n');

    choices.push({
      name: `Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const [scriptKey, scriptCommand] of Object.entries(validScripts)) {
      categorizedScriptKeys.add(scriptKey);
      const description = ntlDescriptions[scriptKey] || scriptCommand;

      choices.push({
        name: `  [${scriptKey}] ${description}`,
        value: scriptKey,
      });
    }
  }

  // Add uncategorized scripts
  const extraScripts = Array.from(allScriptKeys).filter(
    k => !categorizedScriptKeys.has(k),
  );

  if (extraScripts.length > 0) {
    // Add separator if we already have categorized scripts
    if (choices.length > 0) {
      choices.push(new inquirer.Separator(' ') as any);
    }

    choices.push({
      name: `Other Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const k of extraScripts) {
      const description = ntlDescriptions[k] || validScripts[k];
      choices.push({
        name: `  [${k}] ${description}`,
        value: k,
      });
    }
  }

  // If no scripts were found at all
  if (choices.length === 0) {
    choices.push({
      name: `Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const [scriptKey, scriptCommand] of Object.entries(validScripts)) {
      const description = ntlDescriptions[scriptKey] || scriptCommand;

      choices.push({
        name: `  [${scriptKey}] ${description}`,
        value: scriptKey,
      });
    }
  }

  choices.push(new inquirer.Separator(' ') as any);
  choices.push({
    name: 'Exit',
    value: 'exit',
  });

  const response = await inquirer.prompt([
    {
      type: 'list',
      name: 'script',
      message: 'Select an operation to run:',
      choices,
    },
  ]);

  if (!response.script || response.script === 'exit') {
    console.log('👋 Goodbye!');
    return;
  }

  await runScript(response.script, packageManager);
}
