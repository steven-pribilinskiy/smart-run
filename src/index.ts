import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-standalone';
import yaml from 'js-yaml';
import { getCommandPreview, prettifyCommand, shouldPrettifyCommand } from 'shiny-command-line';
import { AIService } from './ai-service.js';
import type {
  AutocompleteChoice,
  Choice,
  PackageJson,
  PackageMeta,
  ScriptConfig,
  ScriptGroup,
} from './types.js';
import { isInsideSmartRunRepo } from './core/repo.js';
import { getScriptGroups as getScriptGroupsCore } from './core/config.js';
import { getPackageJson as getPackageJsonCore } from './core/package.js';
import { detectPackageManager as detectPackageManagerCore } from './core/detect-package-manager.js';
import {
  getLifecycleScripts as getLifecycleScriptsCore,
  parseNpmScriptGroups as parseNpmScriptGroupsCore,
  getNpmScriptsInfoDescriptions as getNpmScriptsInfoDescriptionsCore,
  getNtlDescriptions as getNtlDescriptionsCore,
  extractDescriptionFromEcho as extractDescriptionFromEchoCore,
} from './core/scripts.js';

// npm-scripts-info functionality implemented directly

// Export migration functions
export { convertBetterScriptsToSmartRun } from './migration/convert/better-scripts.js';
export {
  convertNpmScriptsToSmartRun,
  convertNpmScriptsOrgToSmartRun,
} from './migration/convert/npm-scripts.js';
export {
  convertScriptsInfoToSmartRun,
  convertNpmScriptsInfoToSmartRun,
} from './migration/convert/scripts-info.js';
export { convertScriptsDescriptionToSmartRun } from './migration/convert/scripts-description.js';
export { convertNtlToSmartRun } from './migration/convert/ntl.js';
export { detectConfigurationType } from './migration/detect.js';
export { migrateToSmartRun } from './migration/main.js';

export type { AutocompleteChoice, Choice, PackageJson, PackageMeta, ScriptConfig, ScriptGroup };

/**
 * Check whether the current process is running inside the smart-run repository
 */
export { isInsideSmartRunRepo };

/**
 * Simple fuzzy matching function
 * Returns true if search term characters appear in order within the target string
 */
function _fuzzyMatch(search: string, target: string): boolean {
  if (!search) return true;
  if (!target) return false;

  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();

  let searchIndex = 0;

  for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
    if (targetLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }

  return searchIndex === searchLower.length;
}

/**
 * Score fuzzy match quality (higher score = better match)
 */
function fuzzyScore(search: string, target: string): number {
  if (!search) return 0;
  if (!target) return -1;

  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();

  let score = 0;
  let searchIndex = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
    if (targetLower[i] === searchLower[searchIndex]) {
      score += 1 + consecutiveMatches; // Bonus for consecutive matches
      consecutiveMatches++;
      searchIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // Bonus for exact prefix match
  if (targetLower.startsWith(searchLower)) {
    score += 10;
  }

  // Bonus for exact match
  if (targetLower === searchLower) {
    score += 20;
  }

  return searchIndex === searchLower.length ? score : -1;
}

/**
 * Get lifecycle scripts from package.json
 * These are npm's predefined lifecycle hooks
 */
export const getLifecycleScripts = getLifecycleScriptsCore;

/**
 * Load script groups from package-meta.yaml or package.json scriptsMeta
 */
export const getScriptGroups = getScriptGroupsCore;

/**
 * Load npm scripts from package.json or package.demo.json
 */
import { getNpmScripts as _getNpmScripts } from './core/package.js';

/**
 * Load package.json with full structure, or package.demo.json for demo directories
 */
export const getPackageJson = getPackageJsonCore;

// Export for use in other modules
// getPackageJson is already exported as a function declaration

/**
 * Parse npm-scripts organization pattern from package.json scripts
 * Detects category headers like "\n# CATEGORY:" with empty string values
 */
export const parseNpmScriptGroups = parseNpmScriptGroupsCore;

/**
 * Parse ntl descriptions from package.json
 */
export const getNtlDescriptions = getNtlDescriptionsCore;

/**
 * Get script descriptions using npm-scripts-info approach
 * Supports both scripts-info field and ? prefixed scripts
 */
export const getNpmScriptsInfoDescriptions = getNpmScriptsInfoDescriptionsCore;

/**
 * Extract description from echo commands
 * e.g., "echo 'Start the server'" -> "Start the server"
 */
// Re-export for consumers that relied on previous symbol location
export const extractDescriptionFromEcho = extractDescriptionFromEchoCore;

/**
 * Format script display name with title, emoji, and description
 */
function formatScriptDisplayName(script: ScriptConfig): string {
  const { key, description, title, emoji } = script;

  // Build display components
  const emojiPart = emoji ? `${emoji} ` : '';
  const titlePart = title || key;
  const descriptionPart = description;

  // Format: "  🚀 Dev Server - Start the development server"
  // Or:     "  [start] Start the development server" (fallback)
  if (title) {
    return `  ${emojiPart}${titlePart} - ${descriptionPart}`;
  } else {
    return `  ${emojiPart}[${key}] ${descriptionPart}`;
  }
}

/**
 * Detect package manager from multiple sources
 */
const detectPackageManager = detectPackageManagerCore;

/**
 * Offer AI analysis or manual configuration setup
 */
async function offerConfigurationSetup(
  scripts: Record<string, string>,
  options: { disableColors?: boolean } = {}
): Promise<boolean> {
  const aiService = new AIService();
  const providers = aiService.getAvailableProviders();

  console.log('⚠️  No package-meta.yaml configuration found.\n');

  const choices = [];

  // Always show AI Analysis option
  if (providers.length > 0) {
    choices.push({
      name: `🧠 AI Analysis - Auto-generate configuration (${providers.join(', ')})`,
      value: 'ai',
    });
  } else {
    choices.push({
      name: '🧠 AI Analysis - Auto-generate configuration (requires API key)',
      value: 'ai',
    });
  }

  choices.push(
    { name: '📝 Manual Setup - Generate prompt for external AI tools', value: 'manual' },
    { name: '📋 Generate Config - Create config from package.json scripts', value: 'generate' },
    { name: '⏭️  Continue - Use scripts without configuration', value: 'continue' }
  );

  const { setupMethod } = await inquirer.prompt([
    {
      type: 'list',
      name: 'setupMethod',
      message: 'How would you like to set up smart-run?',
      choices,
    },
  ]);

  switch (setupMethod) {
    case 'ai': {
      const { runAIAnalysis } = await import('./ai-analysis.js');
      await runAIAnalysis({ disableColors: options.disableColors });
      return true; // Exit after AI analysis
    }

    case 'manual': {
      console.log('\n📝 Generating analysis prompt...');
      const prompt = aiService.generatePromptForManualAnalysis(scripts);
      try {
        await aiService.copyToClipboard(prompt);
        console.log('✅ Analysis prompt copied to clipboard!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open your preferred AI tool (ChatGPT, Claude, etc.)');
        console.log('   2. Paste the prompt and get the configuration');
        console.log('   3. Save the result as package-meta.yaml');
        console.log('   4. Run smart-run again');
      } catch {
        console.log('📔 Analysis prompt:');
        console.log('─'.repeat(50));
        console.log(prompt);
        console.log('─'.repeat(50));
      }
      return true; // Exit after manual setup
    }

    case 'generate': {
      const metaPath = path.resolve(process.cwd(), 'package-meta.yaml');
      generateConfigFromPackageJson(metaPath);
      console.log('\n✅ Configuration generated from package.json!');
      console.log('📝 Edit package-meta.yaml to add descriptions and organize into groups.');
      console.log('🚀 Run smart-run again to use the configuration.');
      return true; // Exit after generating config
    }

    case 'continue':
      console.log('⏭️  Continuing without configuration...\n');
      console.log(
        '📝 You can create a package-meta.yaml configuration file to organize your scripts.'
      );
      console.log('🚀 Run smart-run again to use the configuration.');
      return false; // Continue with current flow
  }

  return false;
}
function generateConfigFromPackageJson(metaPath: string): void {
  const scripts = _getNpmScripts();
  const scriptKeys = Object.keys(scripts);

  if (scriptKeys.length === 0) {
    console.log('⚠️  No scripts found in package.json');
    return;
  }

  const configScripts = scriptKeys
    .map(
      (key) => `      - key: ${key}
        description: ""`
    )
    .join('\n');

  const config = `# Smart-run configuration
# Generated from package.json scripts
$schema: "https://raw.githubusercontent.com/steven-pribilinskiy/smart-run/main/schema.json"
scriptGroups:
  - name: "Scripts"
    scripts:
${configScripts}
`;

  fs.writeFileSync(metaPath, config);
  console.log(`📝 Generated configuration from ${scriptKeys.length} package.json scripts`);
}

/**
 * Run a script using the detected package manager
 */
function runScript(
  scriptName: string,
  packageManager: string,
  options: {
    scripts?: Record<string, string>;
    previewCommand?: boolean;
    disableColors?: boolean;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const commands = {
      npm: ['npm', 'run', scriptName],
      pnpm: ['pnpm', 'run', scriptName],
      bun: ['bun', 'run', scriptName],
      yarn: ['yarn', scriptName],
    };

    const [cmd, ...args] = commands[packageManager as keyof typeof commands] || commands.npm;
    const fullCommand = `${cmd} ${args.join(' ')}`;

    // Show enhanced command preview if enabled
    if (options.previewCommand && options.scripts && options.scripts[scriptName]) {
      const scriptCommand = options.scripts[scriptName];

      // Show the runner command with formatting
      if (shouldPrettifyCommand(fullCommand)) {
        console.log(
          `🚀 Running: ${prettifyCommand(fullCommand, {
            flagsOnNewLine: true,
            disableColors: options.disableColors || false,
          })}\n`
        );
      } else {
        console.log(`🚀 Running: ${fullCommand}\n`);
      }

      // Show script command preview
      const preview = getCommandPreview(scriptCommand, {
        showPretty: true,
        flagsOnNewLine: true,
        maxWidth: 80,
        disableColors: options.disableColors || false,
      });

      if (preview.shouldPrettify && preview.pretty) {
        console.log('📋 Script command preview:');
        console.log('─'.repeat(50));
        console.log(preview.pretty);
        console.log('─'.repeat(50));
        console.log();
      } else if (scriptCommand.length > 50) {
        console.log('📋 Script command:');
        console.log('─'.repeat(50));
        console.log(scriptCommand);
        console.log('─'.repeat(50));
        console.log();
      }
    } else {
      console.log(`🚀 Running: ${fullCommand}\n`);
    }

    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
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
export async function runSmartRun(
  configPath?: string,
  options: {
    previewCommand?: boolean;
    disableColors?: boolean;
  } = {}
): Promise<void> {
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

  // If no package-meta.yaml exists, offer setup options
  if (
    metaGroups.length === 0 &&
    !fs.existsSync(path.resolve(process.cwd(), configPath || 'package-meta.yaml'))
  ) {
    const shouldExit = await offerConfigurationSetup(scripts, {
      disableColors: options.disableColors,
    });
    if (shouldExit) {
      return; // Exit if user chose AI analysis or manual setup
    }
  }

  const npmGroups = parseNpmScriptGroups(scripts);
  const ntlDescriptions = getNtlDescriptions(pkg);
  const npmScriptsInfoDescriptions = getNpmScriptsInfoDescriptions(pkg);

  // Check if lifecycle scripts should be included (from config file)
  let includeLifecycleScripts = false;
  // Try to read from package-meta.yaml or package.json
  const metaPath = path.resolve(process.cwd(), configPath || 'package-meta.yaml');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;
      includeLifecycleScripts = meta?.includeLifecycleScripts === true;
    } catch (_error) {
      // Ignore errors when reading config
    }
  } else {
    // Try to read from package.json scriptsMeta
    try {
      const pkg = getPackageJson();
      if (pkg?.scriptsMeta) {
        includeLifecycleScripts = pkg.scriptsMeta.includeLifecycleScripts === true;
      }
    } catch (_error) {
      // Ignore errors
    }
  }

  // Get lifecycle scripts if enabled
  const lifecycleGroup = includeLifecycleScripts ? getLifecycleScripts(scripts) : null;

  // Filter out scripts that are actually valid (not category headers)
  const validScripts = Object.fromEntries(
    Object.entries(scripts).filter(([key, value]) => !key.startsWith('\n#') || value !== '')
  );

  const allScriptKeys = new Set(Object.keys(validScripts));
  const categorizedScriptKeys = new Set<string>();
  const choices: unknown[] = [];

  // Add lifecycle scripts at the top if enabled and available
  if (lifecycleGroup && lifecycleGroup.scripts.length > 0) {
    choices.push({
      name: `🔄 ${lifecycleGroup.name}`,
      value: null,
      disabled: true,
    });

    for (const script of lifecycleGroup.scripts) {
      categorizedScriptKeys.add(script.key);
      choices.push({
        name: `  [${script.key}] ${script.description}`,
        value: script.key,
      });
    }

    choices.push(new inquirer.Separator(' '));
  }

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
            name: formatScriptDisplayName(s),
            value: s.key,
          });
        } else {
          choices.push({
            name: formatScriptDisplayName(s),
            value: null,
            disabled: '(MISSING)',
          });
        }
      }

      // Add spacing between groups (only if not the last group)
      if (metaGroups.indexOf(group) < metaGroups.length - 1) {
        choices.push(new inquirer.Separator(' '));
      }
    }
  }
  // Priority 2: Use better-scripts configuration if available
  else if (pkg['better-scripts']) {
    console.log('📋 Using better-scripts configuration\n');

    const { convertBetterScriptsToSmartRun } = await import('./migration.js');
    const betterScriptsConfig = convertBetterScriptsToSmartRun(pkg);

    // Group better-scripts by category or show them all under "Scripts"
    const betterScriptsGroup = {
      name: 'Scripts',
      scripts: Object.entries(betterScriptsConfig.scripts).map(([key, config]) => ({
        key,
        description: config.description,
        title: config.title,
        emoji: config.emoji,
      })),
    };

    choices.push({
      name: `${betterScriptsGroup.name}`,
      value: null,
      disabled: true,
    });

    for (const s of betterScriptsGroup.scripts) {
      categorizedScriptKeys.add(s.key);
      if (validScripts[s.key]) {
        choices.push({
          name: formatScriptDisplayName(s),
          value: s.key,
        });
      } else {
        choices.push({
          name: formatScriptDisplayName(s),
          value: null,
          disabled: '(MISSING)',
        });
      }
    }
  }
  // Priority 3: Use npm-scripts organization pattern
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

        // Use descriptions with priority: ntl > npm-scripts-info > script command
        const description =
          ntlDescriptions[s.key] || npmScriptsInfoDescriptions[s.key] || s.description;

        choices.push({
          name: `  [${s.key}] ${description}`,
          value: s.key,
        });
      }

      // Add spacing between groups (only if not the last group)
      if (npmGroups.indexOf(group) < npmGroups.length - 1) {
        choices.push(new inquirer.Separator(' '));
      }
    }
  }
  // Priority 4: Use ntl descriptions without groups
  else if (Object.keys(ntlDescriptions).length > 0) {
    console.log('📋 Using ntl descriptions\n');

    choices.push({
      name: `Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const [scriptKey, scriptCommand] of Object.entries(validScripts)) {
      categorizedScriptKeys.add(scriptKey);
      const description =
        ntlDescriptions[scriptKey] || npmScriptsInfoDescriptions[scriptKey] || scriptCommand;

      choices.push({
        name: `  [${scriptKey}] ${description}`,
        value: scriptKey,
      });
    }
  }
  // Priority 5: Use npm-scripts-info descriptions without groups
  else if (Object.keys(npmScriptsInfoDescriptions).length > 0) {
    console.log('📋 Using npm-scripts-info descriptions\n');

    choices.push({
      name: `Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const [scriptKey, scriptCommand] of Object.entries(validScripts)) {
      categorizedScriptKeys.add(scriptKey);
      const description = npmScriptsInfoDescriptions[scriptKey] || scriptCommand;

      choices.push({
        name: `  [${scriptKey}] ${description}`,
        value: scriptKey,
      });
    }
  }

  // Add uncategorized scripts
  const extraScripts = Array.from(allScriptKeys).filter((k) => !categorizedScriptKeys.has(k));

  if (extraScripts.length > 0) {
    // Add separator if we already have categorized scripts
    if (choices.length > 0) {
      choices.push(new inquirer.Separator(' '));
    }

    choices.push({
      name: `Other Available Scripts`,
      value: null,
      disabled: true,
    });

    for (const k of extraScripts) {
      const description = ntlDescriptions[k] || npmScriptsInfoDescriptions[k] || validScripts[k];
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
      const description =
        ntlDescriptions[scriptKey] || npmScriptsInfoDescriptions[scriptKey] || scriptCommand;

      choices.push({
        name: `  [${scriptKey}] ${description}`,
        value: scriptKey,
      });
    }
  }

  if (options.previewCommand) {
    console.log('📋 Available Scripts (preview)');
    choices.forEach((choice) => {
      if (typeof choice === 'string') {
        console.log(String(choice).trim());
      } else if (typeof choice === 'object' && choice !== null && 'name' in choice) {
        console.log(String((choice as Choice).name).trim());
      }
    });
    console.log();
  }
  // Add special actions
  const specialActions = [
    {
      name: '🔄 Migrate Configuration - Convert existing configurations to smart-run format',
      value: 'migrate',
      description: 'Convert existing configurations to smart-run format',
    },
    {
      name: `👁️ Toggle Command Preview - ${options.previewCommand ? 'Currently ON' : 'Currently OFF'}`,
      value: 'toggle-preview',
      description: 'Toggle command preview mode',
    },
    {
      name: 'Exit',
      value: 'exit',
      description: 'Exit smart-run',
    },
  ];

  // Filter out disabled choices and separators for autocomplete
  const autocompleteChoices: AutocompleteChoice[] = choices
    .filter((choice): choice is Choice => {
      if (typeof choice !== 'object' || choice === null) return false;
      if ('value' in choice && 'name' in choice) {
        const c = choice as Choice;
        return c.value !== null && !c.disabled;
      }
      return false;
    })
    .map(
      (choice): AutocompleteChoice => ({
        name: choice.name,
        value: choice.value,
        description: choice.name, // Use the name as description for better search
      })
    );

  // Add special actions to autocomplete choices
  autocompleteChoices.push(...specialActions);

  // Create fuzzy search source function
  const searchSource = async (input?: string): Promise<AutocompleteChoice[]> => {
    if (!input) {
      return autocompleteChoices;
    }

    // Filter and sort by fuzzy match score
    const filtered = autocompleteChoices
      .map((choice) => ({
        ...choice,
        score: fuzzyScore(input, choice.name),
      }))
      .filter((choice) => choice.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...choice }) => choice);

    return filtered;
  };

  // Define proper type for mock global
  type MockGlobal = {
    mockAutocomplete?: (options: {
      message: string;
      source: (input?: string) => Promise<AutocompleteChoice[]>;
    }) => Promise<string>;
  };

  const script = (globalThis as MockGlobal).mockAutocomplete
    ? await (globalThis as MockGlobal).mockAutocomplete!({
        message: 'Select an operation to run (type to search):',
        source: searchSource,
      })
    : await autocomplete({
        message: 'Select an operation to run (type to search):',
        source: searchSource,
      });

  const response = { script };

  if (!response.script || response.script === 'exit') {
    console.log('👋 Goodbye!');
    return;
  }

  if (response.script === 'migrate') {
    const { runMigration } = await import('./migration.js');
    await runMigration();
    return;
  }

  if (response.script === 'toggle-preview') {
    // Toggle command preview and restart the menu
    await runSmartRun(configPath, {
      previewCommand: !options.previewCommand,
      disableColors: options.disableColors,
    });
    return;
  }

  await runScript(response.script, packageManager, {
    scripts: validScripts,
    previewCommand: options.previewCommand,
    disableColors: options.disableColors,
  });
}
