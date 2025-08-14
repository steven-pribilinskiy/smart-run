import * as fs from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import { AIService } from './ai-service.js';
import { getPackageJson, type PackageJson, type ScriptGroup } from './index.js';

// Re-export types for test files
export type { PackageJson, ScriptGroup };

/**
 * Extract description from echo commands
 * e.g., "echo 'Start the server'" -> "Start the server"
 */
function extractDescriptionFromEcho(command: string): string {
  const echoRegex = /^\s*echo\s+/;
  const match = echoRegex.exec(command);

  if (!match) {
    return command;
  }

  let description = command.substring(match[0].length);

  // Remove echo flags like -e, -E, -n
  const flagRegex = /^-[eEn]+\s+/;
  let flagMatch: RegExpExecArray | null = flagRegex.exec(description);
  while (flagMatch !== null) {
    description = description.substring(flagMatch[0].length);
    flagMatch = flagRegex.exec(description);
  }

  // Remove quotes
  description = description.replace(/^["']|["']$/g, '');

  return description;
}

export type MigrationResult = {
  scriptGroups: ScriptGroup[];
  source: string;
  hasAiEnhancement: boolean;
};

export type MigrationOptions = {
  format: 'yaml' | 'json' | 'scriptsMeta';
  useAI: boolean;
  source: string;
};

/**
 * Detect existing configurations and suggest migration
 */
export function detectExistingConfigurations(
  pkg: PackageJson
): { type: string; description: string }[] {
  const configs: { type: string; description: string }[] = [];

  // Check for ntl configuration
  if (pkg.ntl?.descriptions) {
    configs.push({
      type: 'ntl',
      description: `ntl descriptions (${Object.keys(pkg.ntl.descriptions).length} scripts)`,
    });
  }

  // Check for npm-scripts organization
  if (pkg.scripts) {
    const hasOrgHeaders = Object.keys(pkg.scripts).some((key) => key.startsWith('\n#'));
    if (hasOrgHeaders) {
      configs.push({
        type: 'npm-scripts',
        description: 'npm-scripts organization pattern (category headers)',
      });
    }
  }

  // Check for scripts-info (both formats)
  if (pkg['scripts-info']) {
    configs.push({
      type: 'scripts-info',
      description: 'scripts-info descriptions',
    });
  } else if (pkg.scripts) {
    // Check for ? prefixed scripts format
    const hasQuestionScripts = Object.keys(pkg.scripts).some((key) => key.startsWith('?'));
    if (hasQuestionScripts) {
      configs.push({
        type: 'scripts-info',
        description: 'npm-scripts-info (? prefixed scripts)',
      });
    }
  }

  // Check for scripts-description
  if (pkg['scripts-description']) {
    configs.push({
      type: 'scripts-description',
      description: 'scripts-description format',
    });
  }

  // Check for better-scripts
  if (pkg['better-scripts']) {
    const betterScripts = pkg['better-scripts'];
    const scriptCount = Object.keys(betterScripts).length;
    configs.push({
      type: 'better-scripts',
      description: `better-scripts configuration (${scriptCount} scripts)`,
    });
  }

  return configs;
}

/**
 * Detect the type of configuration in package.json
 */
export function detectConfigurationType(pkg: PackageJson): string {
  // Check for ntl configuration (highest priority)
  if (pkg.ntl?.descriptions) {
    return 'ntl';
  }

  // Check for npm-scripts-info configuration
  if (pkg['scripts-info']) {
    return 'npm-scripts-info';
  }

  // Check for ? prefixed scripts format
  if (pkg.scripts) {
    const hasQuestionScripts = Object.keys(pkg.scripts).some((key) => key.startsWith('?'));
    if (hasQuestionScripts) {
      return 'npm-scripts-info';
    }
  }

  // Check for better-scripts
  if (pkg['better-scripts']) {
    return 'better-scripts';
  }

  // Check for npm-scripts organization
  if (pkg.scripts) {
    const hasOrgHeaders = Object.keys(pkg.scripts).some(
      (key) => key.startsWith('\n#') || key.startsWith('comment:') || key.startsWith('# ')
    );
    if (hasOrgHeaders) {
      return 'npm-scripts-org';
    }
  }

  // Basic scripts
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
    return 'basic';
  }

  return 'none';
}

// Add emoji mapping for common group names
const GROUP_EMOJI_MAP: Record<string, string> = {
  // Use wrench for development
  'DEVELOPMENT SCRIPTS': '🛠️ DEVELOPMENT SCRIPTS',
  DEVELOPMENT: '🛠️ DEVELOPMENT',
  DEV: '🛠️ DEV',
  'TESTING SCRIPTS': '🧪 TESTING SCRIPTS',
  TESTING: '🧪 TESTING',
  TEST: '🧪 TEST',
  'CODE QUALITY SCRIPTS': '✨ CODE QUALITY SCRIPTS',
  'CODE QUALITY': '✨ CODE QUALITY',
  QUALITY: '✨ QUALITY',
  LINT: '✨ LINT',
  'BUILD SCRIPTS': '🏗️ BUILD SCRIPTS',
  BUILD: '🏗️ BUILD',
  'DEPLOYMENT SCRIPTS': '🚀 DEPLOYMENT SCRIPTS',
  DEPLOYMENT: '🚀 DEPLOYMENT',
  DEPLOY: '🚀 DEPLOY',
  'UTILITY SCRIPTS': '🔧 UTILITY SCRIPTS',
  UTILITY: '🔧 UTILITY',
  UTILS: '🔧 UTILS',
};

/**
 * Normalize emoji to handle Unicode variants
 */
function normalizeEmoji(emoji: string): string {
  // Handle common emoji variants by normalizing to the simplest form
  const emojiMap: Record<string, string> = {
    '🏗️': '🏗️', // Keep the variant selector version
    '🏗': '🏗️', // Convert to variant selector version
  };

  return emojiMap[emoji] || emoji;
}

/**
 * Extract emoji from description and normalize it
 */
function extractEmoji(description: string): string | undefined {
  const emojiMatch = description.match(/^([\p{Emoji}]+)/u);
  if (emojiMatch) {
    return normalizeEmoji(emojiMatch[1].trim());
  }
  return undefined;
}

/**
 * Convert ntl configuration to smart-run format
 */
export function convertNtlToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; emoji?: string }>;
} {
  const descriptions = pkg.ntl?.descriptions || {};
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; emoji?: string }> = {};

  Object.keys(scripts)
    .filter((key) => !key.startsWith('\n#') && !key.startsWith('comment:') && scripts[key] !== '')
    .forEach((key) => {
      const description = descriptions[key] || scripts[key] || `Run ${key} script`;
      const scriptConfig: { description: string; emoji?: string } = { description };

      // Extract emoji from description if present
      const emoji = extractEmoji(description);
      if (emoji) {
        scriptConfig.emoji = emoji;
      }

      result[key] = scriptConfig;
    });

  return { scripts: result };
}

/**
 * Convert npm-scripts organization to smart-run format
 */
export function convertNpmScriptsToSmartRun(pkg: PackageJson): ScriptGroup[] {
  const scripts = pkg.scripts || {};
  const groups: ScriptGroup[] = [];
  let currentGroup: ScriptGroup | null = null;

  for (const [key, value] of Object.entries(scripts)) {
    if (
      key.startsWith('\n#') ||
      key.startsWith('comment:') ||
      (key.startsWith('# ') && value === '')
    ) {
      // This is a category header
      if (currentGroup) {
        groups.push(currentGroup);
      }

      let categoryName = key;
      if (key.startsWith('comment:')) {
        // Use provided comment value and strip leading '#'
        categoryName = (value || key.replace('comment:', '').toUpperCase()).replace(/^#\s*/, '');
      } else if (key.startsWith('\n#')) {
        categoryName = key.replace(/^\n#\s*/, '').replace(/:?\s*$/, '');
      } else if (key.startsWith('# ')) {
        categoryName = key.replace(/^#\s*/, '').replace(/:?\s*$/, '');
      }

      // Apply emoji mapping if available
      const normalizedName = categoryName.replace(/^#\s*/, '').toUpperCase();
      const mappedName = GROUP_EMOJI_MAP[normalizedName] || categoryName;

      currentGroup = {
        name: mappedName,
        scripts: [],
      };
    } else if (
      currentGroup &&
      !key.startsWith('\n#') &&
      !key.startsWith('comment:') &&
      !key.startsWith('# ')
    ) {
      // Regular script in a category
      currentGroup.scripts.push({
        key,
        description: value || `Run ${key} script`,
      });
    } else if (
      !currentGroup &&
      !key.startsWith('\n#') &&
      !key.startsWith('comment:') &&
      !key.startsWith('# ')
    ) {
      // Script without category
      if (!groups.find((g) => g.name === 'Scripts')) {
        groups.push({
          name: 'Scripts',
          scripts: [],
        });
      }
      const scriptsGroup = groups.find((g) => g.name === 'Scripts')!;
      scriptsGroup.scripts.push({
        key,
        description: value || `Run ${key} script`,
      });
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Convert npm-scripts-info format to smart-run format
 */
export function convertNpmScriptsInfoToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; emoji?: string }>;
} {
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; emoji?: string }> = {};

  // Get npm-scripts-info descriptions (handles both formats)
  let scriptsInfo: Record<string, string> = {};
  try {
    // Check for scripts-info property
    if ('scripts-info' in pkg && pkg['scripts-info']) {
      scriptsInfo = pkg['scripts-info'] as Record<string, string>;
    } else {
      // Look for ? prefixed scripts (description scripts)
      Object.keys(scripts)
        .filter((scriptName) => scriptName.startsWith('?'))
        .forEach((scriptName) => {
          const actualScriptName = scriptName.substring(1);
          const description = scripts[scriptName];
          if (description) {
            scriptsInfo[actualScriptName] = extractDescriptionFromEcho(description);
          }
        });
    }
  } catch (error) {
    console.error('Error parsing scripts-info:', error);
  }

  // Create script configs
  Object.keys(scripts)
    .filter((key) => !key.startsWith('?') && !key.startsWith('\n#') && !key.startsWith('comment:'))
    .forEach((key) => {
      const description = scriptsInfo[key] || scripts[key] || `Run ${key} script`;
      const scriptConfig: { description: string; emoji?: string } = { description };

      // Extract emoji from description if present
      const emoji = extractEmoji(description);
      if (emoji) {
        scriptConfig.emoji = emoji;
      }

      result[key] = scriptConfig;
    });

  return { scripts: result };
}

/**
 * Convert npm-scripts organization to smart-run format
 */
export function convertNpmScriptsOrgToSmartRun(pkg: PackageJson): { scriptGroups: ScriptGroup[] } {
  const groups = convertNpmScriptsToSmartRun(pkg);
  return { scriptGroups: groups };
}

/**
 * Convert scripts-info format to smart-run format
 */
export function convertScriptsInfoToSmartRun(pkg: PackageJson): ScriptGroup[] {
  const scripts = pkg.scripts || {};

  // Get npm-scripts-info descriptions (handles both formats)
  let scriptsInfo: Record<string, string> = {};
  try {
    // Check for scripts-info property
    if ('scripts-info' in pkg && pkg['scripts-info']) {
      scriptsInfo = pkg['scripts-info'] as Record<string, string>;
    } else {
      // Look for ? prefixed scripts (description scripts)
      const scripts = pkg.scripts || {};

      Object.keys(scripts)
        .filter((scriptName) => scriptName.startsWith('?'))
        .forEach((scriptName) => {
          const actualScriptName = scriptName.substring(1);
          const description = extractDescriptionFromEcho(scripts[scriptName]);
          scriptsInfo[actualScriptName] = description;
        });
    }
  } catch (_error) {
    // If parsing fails, return empty object
    scriptsInfo = {};
  }

  const scriptConfigs = Object.keys(scripts)
    .filter((key) => !key.startsWith('\n#') && !key.startsWith('?') && scripts[key] !== '')
    .map((key) => ({
      key,
      description: scriptsInfo[key] || scripts[key] || `Run ${key} script`,
    }));

  return [
    {
      name: 'Available Scripts',
      scripts: scriptConfigs,
    },
  ];
}

/**
 * Convert scripts-description format to smart-run format
 */
export function convertScriptsDescriptionToSmartRun(pkg: PackageJson): ScriptGroup[] {
  const scriptsDescription = pkg['scripts-description'] || {};
  const scripts = pkg.scripts || {};

  const scriptConfigs = Object.keys(scripts)
    .filter((key) => !key.startsWith('\n#') || scripts[key] !== '')
    .map((key) => ({
      key,
      description: scriptsDescription[key] || scripts[key] || `Run ${key} script`,
    }));

  return [
    {
      name: 'Available Scripts',
      scripts: scriptConfigs,
    },
  ];
}

// Define types for better-scripts format
type BetterScriptConfig =
  | string
  | [string, string?]
  | {
      command?: string;
      description?: string;
      alias?: string;
    };

/**
 * Convert better-scripts format to smart-run format
 */
export function convertBetterScriptsToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; title?: string; emoji?: string }>;
} {
  const betterScripts = pkg['better-scripts'] || {};
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; title?: string; emoji?: string }> = {};

  Object.keys(betterScripts).forEach((key) => {
    const config = betterScripts[key] as BetterScriptConfig;
    let description = scripts[key] || `Run ${key} script`;
    let title: string | undefined;
    let emoji: string | undefined;

    // Handle different better-scripts formats
    if (typeof config === 'string') {
      // Simple string format: "dev": "react-scripts start"
      description = config;
    } else if (Array.isArray(config)) {
      // Array format: "dev": ["react-scripts start", "Start development server"]
      if (config.length > 1) {
        description = config[1] || config[0]; // Use the description from array, fallback to command
      } else if (config.length === 1) {
        description = config[0]; // Use the command as description
      }
    } else if (typeof config === 'object' && config !== null) {
      // Object format: "dev": { "command": "react-scripts start", "description": "Start dev server", "alias": "🧑🏻‍💻 Dev" }
      if (config.description) {
        description = config.description;
      } else if (config.command) {
        description = config.command;
      }

      // Map alias to title (preserving emoji if present)
      if (config.alias) {
        title = config.alias;
        // Simple approach: split on first space and check if first part looks like emoji
        const parts = config.alias.split(' ');
        if (parts.length > 1) {
          const firstPart = parts[0];
          // Check if first part contains emoji characters (simple heuristic)
          const hasEmoji = /[\p{Emoji}]/u.test(firstPart) && firstPart.length <= 4;
          if (hasEmoji) {
            emoji = firstPart;
            title = parts.slice(1).join(' ').trim();
          }
        }
      }
    }

    const scriptConfig: { description: string; title?: string; emoji?: string } = { description };

    if (title) scriptConfig.title = title;
    if (emoji) scriptConfig.emoji = emoji;

    result[key] = scriptConfig;
  });

  return { scripts: result };
}

/**
 * Enhance script groups with AI-generated descriptions and grouping
 */
export async function enhanceWithAI(scriptGroups: ScriptGroup[]): Promise<ScriptGroup[]> {
  const aiService = new AIService();

  if (!aiService.hasApiKey()) {
    throw new Error('AI enhancement requires an OpenAI API key');
  }

  // Flatten all scripts for AI analysis
  const allScripts: Record<string, string> = {};
  const pkg = getPackageJson();

  for (const group of scriptGroups) {
    for (const script of group.scripts) {
      allScripts[script.key] = pkg.scripts?.[script.key] || script.description;
    }
  }

  // Get AI analysis
  const analysis = await aiService.analyzeScripts(allScripts);
  return analysis.scriptGroups;
}

/**
 * Save configuration in the specified format
 */
export async function saveConfiguration(
  scriptGroups: ScriptGroup[],
  format: 'yaml' | 'json' | 'scriptsMeta',
  source: string
): Promise<void> {
  const config = { scriptGroups };
  const comment = `Smart-run configuration (migrated from ${source})`;

  switch (format) {
    case 'yaml': {
      const yamlContent = `# ${comment}\n${yaml.dump(config)}`;
      writeFileSync('package-meta.yaml', yamlContent);
      console.log('✅ Configuration saved to package-meta.yaml');
      break;
    }

    case 'json': {
      const jsonContent = JSON.stringify(config, null, 2);
      writeFileSync('package-meta.json', jsonContent);
      console.log('✅ Configuration saved to package-meta.json');
      break;
    }

    case 'scriptsMeta': {
      // Try package.json first, then package.demo.json for demo directories
      let packageJsonPath = 'package.json';
      if (!fs.existsSync(packageJsonPath)) {
        const demoPath = 'package.demo.json';
        const { isInsideSmartRunRepo } = await import('./index.js');
        if (isInsideSmartRunRepo() && fs.existsSync(demoPath)) {
          packageJsonPath = demoPath;
        }
      }
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.scriptsMeta = config;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Configuration saved to scriptsMeta field in package file');
      break;
    }
  }
}

/**
 * Main migration workflow
 */
export async function runMigration(): Promise<void> {
  console.log('🔄 Smart-run Configuration Migration\n');

  const pkg = getPackageJson();
  const existingConfigs = detectExistingConfigurations(pkg);

  if (existingConfigs.length === 0) {
    console.log('❌ No existing configurations found to migrate.');
    console.log('💡 Consider using: smart-run --ai to create a new configuration');
    return;
  }

  console.log('📋 Found existing configurations:');
  existingConfigs.forEach((config, index) => {
    console.log(`   ${index + 1}. ${config.description}`);
  });
  console.log();

  // Select configuration to migrate
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: 'Which configuration would you like to migrate?',
      choices: existingConfigs.map((config, _index) => ({
        name: config.description,
        value: config.type,
      })),
    },
  ]);

  // Convert the selected configuration
  let scriptGroups: ScriptGroup[];
  let sourceName: string;

  switch (selectedConfig) {
    case 'ntl': {
      const ntlResult = convertNtlToSmartRun(pkg);
      // Convert scripts to ScriptGroup format
      scriptGroups = [
        {
          name: 'Available Scripts',
          scripts: Object.keys(ntlResult.scripts).map((key) => ({
            key,
            description: ntlResult.scripts[key].description,
            emoji: ntlResult.scripts[key].emoji,
          })),
        },
      ];
      sourceName = 'ntl';
      break;
    }
    case 'npm-scripts':
      scriptGroups = convertNpmScriptsToSmartRun(pkg);
      sourceName = 'npm-scripts organization';
      break;
    case 'scripts-info':
      scriptGroups = convertScriptsInfoToSmartRun(pkg);
      sourceName = 'scripts-info';
      break;
    case 'scripts-description':
      scriptGroups = convertScriptsDescriptionToSmartRun(pkg);
      sourceName = 'scripts-description';
      break;
    case 'better-scripts': {
      const betterResult = convertBetterScriptsToSmartRun(pkg);
      // Convert scripts to ScriptGroup format
      scriptGroups = [
        {
          name: 'Available Scripts',
          scripts: Object.keys(betterResult.scripts).map((key) => ({
            key,
            description: betterResult.scripts[key].description,
            title: betterResult.scripts[key].title,
            emoji: betterResult.scripts[key].emoji,
          })),
        },
      ];
      sourceName = 'better-scripts';
      break;
    }
    default:
      throw new Error('Unknown configuration type');
  }

  console.log(`\n🔄 Converting ${sourceName} configuration...`);

  // Ask about AI enhancement
  const aiService = new AIService();
  const hasAiKey = aiService.hasApiKey();
  let useAI = false;

  if (hasAiKey) {
    const { enhanceWithAI: enhance } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enhanceWithAI',
        message:
          'Would you like to enhance the configuration with AI-powered grouping and descriptions?',
        default: true,
      },
    ]);
    useAI = enhance;
  }

  // Apply AI enhancement if requested
  if (useAI) {
    console.log('\n🧠 Enhancing configuration with AI...');
    try {
      scriptGroups = await enhanceWithAI(scriptGroups);
      console.log('✅ AI enhancement complete!');
    } catch (error) {
      console.error(
        '❌ AI enhancement failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      console.log('⏭️  Continuing with basic conversion...');
    }
  }

  // Display the converted configuration
  console.log('\n📋 Converted configuration:');
  console.log('─'.repeat(50));
  for (const group of scriptGroups) {
    console.log(`\n📁 ${group.name}:`);
    for (const script of group.scripts) {
      console.log(`   [${script.key}] ${script.description}`);
    }
  }
  console.log('─'.repeat(50));

  // Choose output format
  const { format } = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Which format would you like to save the configuration in?',
      choices: [
        { name: '�� YAML (package-meta.yaml) - Recommended', value: 'yaml' },
        { name: '📋 JSON (package-meta.json)', value: 'json' },
        { name: '📦 Embedded (scriptsMeta in package.json)', value: 'scriptsMeta' },
      ],
    },
  ]);

  // Save the configuration
  await saveConfiguration(scriptGroups, format, sourceName);

  console.log('\n🎉 Migration complete!');
  console.log('🚀 You can now run: smart-run');

  if (useAI) {
    console.log(
      '\n💡 Your configuration has been enhanced with AI-powered grouping and descriptions.'
    );
  }
}

/**
 * Main migration function that detects configuration type and converts appropriately
 */
export function migrateToSmartRun(pkg: PackageJson): {
  scripts?: Record<string, { description?: string; title?: string; emoji?: string }>;
  scriptGroups?: ScriptGroup[];
} {
  const configType = detectConfigurationType(pkg);

  switch (configType) {
    case 'ntl': {
      const ntlResult = convertNtlToSmartRun(pkg);
      // Include all scripts but only provide descriptions if they exist in ntl.descriptions
      const cleanedScripts: Record<string, { description?: string }> = {};
      const descriptions = pkg.ntl?.descriptions || {};

      Object.keys(ntlResult.scripts).forEach((key) => {
        if (descriptions[key]) {
          cleanedScripts[key] = { description: descriptions[key] };
        } else {
          cleanedScripts[key] = {}; // Include script without description
        }
      });

      return { scripts: cleanedScripts };
    }

    case 'npm-scripts-info':
      return convertNpmScriptsInfoToSmartRun(pkg);

    case 'better-scripts': {
      const betterResult = convertBetterScriptsToSmartRun(pkg);
      return { scripts: betterResult.scripts };
    }

    case 'npm-scripts-org':
      return convertNpmScriptsOrgToSmartRun(pkg);

    case 'basic': {
      const scripts = pkg.scripts || {};
      const result: Record<string, { description: string }> = {};
      Object.keys(scripts).forEach((key) => {
        if (!key.startsWith('\n#') && !key.startsWith('comment:') && !key.startsWith('# ')) {
          result[key] = {
            description: scripts[key] || `Run ${key} script`,
          };
        }
      });
      return { scripts: result };
    }

    default:
      return { scripts: {} };
  }
}

/**
 * Load scripts from package.json
 */
export function loadScriptsFromPackageJson(
  pkg: PackageJson
): Record<string, { description?: string }> {
  const scripts = pkg.scripts || {};
  const result: Record<string, { description?: string }> = {};

  Object.keys(scripts).forEach((key) => {
    if (!key.startsWith('\n#') && !key.startsWith('comment:') && !key.startsWith('# ')) {
      result[key] = {}; // Basic scripts don't have descriptions
    }
  });

  return result;
}
