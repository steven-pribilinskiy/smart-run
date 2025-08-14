import inquirer from 'inquirer';
import type { PackageJson, ScriptGroup } from '../types.js';
import { getPackageJson } from '../core/package.js';
import { detectExistingConfigurations, detectConfigurationType } from './detect.js';
import {
  convertNpmScriptsToSmartRun,
  convertNpmScriptsOrgToSmartRun,
} from './convert/npm-scripts.js';
import { convertNtlToSmartRun } from './convert/ntl.js';
import {
  convertNpmScriptsInfoToSmartRun,
  convertScriptsInfoToSmartRun,
} from './convert/scripts-info.js';
import { convertScriptsDescriptionToSmartRun } from './convert/scripts-description.js';
import { convertBetterScriptsToSmartRun } from './convert/better-scripts.js';
import { enhanceWithAI } from './ai.js';
import { saveConfiguration } from './save.js';

export function migrateToSmartRun(pkg: PackageJson): {
  scripts?: Record<string, { description?: string; title?: string; emoji?: string }>;
  scriptGroups?: ScriptGroup[];
} {
  const type = detectConfigurationType(pkg);
  switch (type) {
    case 'ntl': {
      const ntl = convertNtlToSmartRun(pkg);
      const cleaned: Record<string, { description?: string }> = {};
      const descriptions = pkg.ntl?.descriptions || {};
      Object.keys(ntl.scripts).forEach((k) => {
        cleaned[k] = descriptions[k] ? { description: descriptions[k] } : {};
      });
      return { scripts: cleaned };
    }
    case 'npm-scripts-info':
      return convertNpmScriptsInfoToSmartRun(pkg);
    case 'better-scripts': {
      const better = convertBetterScriptsToSmartRun(pkg);
      return { scripts: better.scripts };
    }
    case 'npm-scripts-org':
      return convertNpmScriptsOrgToSmartRun(pkg);
    case 'basic': {
      const scripts = pkg.scripts || {};
      const result: Record<string, { description: string }> = {};
      Object.keys(scripts).forEach((k) => {
        if (!k.startsWith('\n#') && !k.startsWith('comment:') && !k.startsWith('# ')) {
          result[k] = { description: scripts[k] || `Run ${k} script` };
        }
      });
      return { scripts: result };
    }
    default:
      return { scripts: {} };
  }
}

export async function runMigration(): Promise<void> {
  console.log('🔄 Smart-run Configuration Migration\n');
  const pkg = getPackageJson();
  const existing = detectExistingConfigurations(pkg);
  if (existing.length === 0) {
    console.log('❌ No existing configurations found to migrate.');
    console.log('💡 Consider using: smart-run --ai to create a new configuration');
    return;
  }
  console.log('📋 Found existing configurations:');
  existing.forEach((c, i) => console.log(`   ${i + 1}. ${c.description}`));
  console.log();
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: 'Which configuration would you like to migrate?',
      choices: existing.map((c) => ({ name: c.description, value: c.type })),
    },
  ]);

  let scriptGroups: ScriptGroup[];
  let sourceName: string;
  switch (selectedConfig) {
    case 'ntl': {
      const ntl = convertNtlToSmartRun(pkg);
      scriptGroups = [
        {
          name: 'Available Scripts',
          scripts: Object.keys(ntl.scripts).map((k) => ({
            key: k,
            description: ntl.scripts[k].description,
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
      const better = convertBetterScriptsToSmartRun(pkg);
      scriptGroups = [
        {
          name: 'Available Scripts',
          scripts: Object.keys(better.scripts).map((k) => ({
            key: k,
            description: better.scripts[k].description,
            title: better.scripts[k].title,
            emoji: better.scripts[k].emoji,
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
  const aiService = new (await import('../ai-service.js')).AIService();
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

  console.log('\n📋 Converted configuration:');
  console.log('─'.repeat(50));
  for (const group of scriptGroups) {
    console.log(`\n📁 ${group.name}:`);
    for (const s of group.scripts) console.log(`   [${s.key}] ${s.description}`);
  }
  console.log('─'.repeat(50));

  const { format } = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Which format would you like to save the configuration in?',
      choices: [
        { name: '📄 YAML (package-meta.yaml) - Recommended', value: 'yaml' },
        { name: '📋 JSON (package-meta.json)', value: 'json' },
        { name: '📦 Embedded (scriptsMeta in package.json)', value: 'scriptsMeta' },
      ],
    },
  ]);
  await saveConfiguration(scriptGroups, format, sourceName);
  console.log('\n🎉 Migration complete!');
  console.log('🚀 You can now run: smart-run');
  if (useAI)
    console.log(
      '\n💡 Your configuration has been enhanced with AI-powered grouping and descriptions.'
    );
}
