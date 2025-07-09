import {
  getLifecycleScripts,
  getNpmScriptsInfoDescriptions,
  getNtlDescriptions,
  getPackageJson,
  getScriptGroups,
  parseNpmScriptGroups,
} from './index.js';

export type ScriptInfo = {
  name: string;
  command: string;
  description?: string;
  group?: string;
  type: 'regular' | 'lifecycle' | 'missing';
  source: 'package.json' | 'ntl' | 'npm-scripts-info' | 'package-meta' | 'computed';
  emoji?: string;
  title?: string;
};

/**
 * Get comprehensive information about all scripts
 */
function getAllScriptInfo(): ScriptInfo[] {
  const pkg = getPackageJson();
  const scripts = pkg.scripts || {};
  const scriptInfos: ScriptInfo[] = [];

  // Get all description sources
  const ntlDescriptions = getNtlDescriptions(pkg);
  const npmScriptsInfoDescriptions = getNpmScriptsInfoDescriptions(pkg);

  // Get grouping information
  const metaGroups = getScriptGroups();
  const npmGroups = parseNpmScriptGroups(scripts);
  const lifecycleGroup = getLifecycleScripts(scripts);

  // Create a map of script names to their group info
  const scriptToGroup = new Map<
    string,
    { group: string; description?: string; emoji?: string; title?: string }
  >();

  // Add meta groups
  for (const group of metaGroups) {
    for (const script of group.scripts) {
      scriptToGroup.set(script.key, {
        group: group.name,
        description: script.description,
        emoji: script.emoji,
        title: script.title,
      });
    }
  }

  // Add npm organization groups
  for (const group of npmGroups) {
    for (const script of group.scripts) {
      if (!scriptToGroup.has(script.key)) {
        scriptToGroup.set(script.key, {
          group: group.name,
          description: script.description,
        });
      }
    }
  }

  // Add lifecycle scripts
  if (lifecycleGroup) {
    for (const script of lifecycleGroup.scripts) {
      if (!scriptToGroup.has(script.key)) {
        scriptToGroup.set(script.key, {
          group: 'Lifecycle Scripts',
          description: script.description,
        });
      }
    }
  }

  // Get all script names (including missing ones from config)
  const allScriptNames = new Set<string>();

  // Add scripts from package.json
  Object.keys(scripts).forEach((name) => {
    if (!name.startsWith('\n#') || scripts[name] !== '') {
      allScriptNames.add(name);
    }
  });

  // Add scripts from configurations (even if missing)
  scriptToGroup.forEach((_, name) => allScriptNames.add(name));

  // Build script info for each script
  for (const scriptName of allScriptNames) {
    const command = scripts[scriptName];
    const groupInfo = scriptToGroup.get(scriptName);
    const isLifecycle = isLifecycleScript(scriptName);

    // Determine the best description with priority
    let description: string | undefined;
    let source: ScriptInfo['source'] = 'package.json';

    if (groupInfo?.description) {
      description = groupInfo.description;
      source = 'package-meta';
    } else if (ntlDescriptions[scriptName]) {
      description = ntlDescriptions[scriptName];
      source = 'ntl';
    } else if (npmScriptsInfoDescriptions[scriptName]) {
      description = npmScriptsInfoDescriptions[scriptName];
      source = 'npm-scripts-info';
    } else if (command) {
      description = command.length > 100 ? `${command.substring(0, 97)}...` : command;
      source = 'package.json';
    }

    scriptInfos.push({
      name: scriptName,
      command: command || '(missing)',
      description,
      group: groupInfo?.group,
      type: !command ? 'missing' : isLifecycle ? 'lifecycle' : 'regular',
      source,
      emoji: groupInfo?.emoji,
      title: groupInfo?.title,
    });
  }

  // Sort by group, then by type (lifecycle first), then by name
  return scriptInfos.sort((a, b) => {
    // First sort by group
    const groupA = a.group || 'Ungrouped';
    const groupB = b.group || 'Ungrouped';

    if (groupA !== groupB) {
      // Lifecycle Scripts first, then alphabetical
      if (groupA === 'Lifecycle Scripts') return -1;
      if (groupB === 'Lifecycle Scripts') return 1;
      return groupA.localeCompare(groupB);
    }

    // Within same group, sort by type (lifecycle first)
    if (a.type !== b.type) {
      if (a.type === 'lifecycle') return -1;
      if (b.type === 'lifecycle') return 1;
      if (a.type === 'missing') return 1;
      if (b.type === 'missing') return -1;
    }

    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Check if a script name is a lifecycle script
 */
function isLifecycleScript(scriptName: string): boolean {
  const lifecycleScripts = [
    'preinstall',
    'install',
    'postinstall',
    'preuninstall',
    'uninstall',
    'postuninstall',
    'preversion',
    'version',
    'postversion',
    'pretest',
    'test',
    'posttest',
    'prestop',
    'stop',
    'poststop',
    'prestart',
    'start',
    'poststart',
    'prerestart',
    'restart',
    'postrestart',
    'prepublish',
    'publish',
    'postpublish',
    'prepublishOnly',
    'prepare',
    'prepack',
    'postpack',
    'preprepare',
    'postprepare',
    'dependencies',
  ];

  return lifecycleScripts.includes(scriptName);
}

/**
 * Format script info as a table
 */
function formatAsTable(
  scriptInfos: ScriptInfo[],
  options: { disableColors?: boolean } = {}
): string {
  if (scriptInfos.length === 0) {
    return 'No scripts found.';
  }

  const { disableColors = false } = options;

  // Define colors
  const colors = disableColors
    ? {
        reset: '',
        bright: '',
        dim: '',
        red: '',
        green: '',
        yellow: '',
        blue: '',
        magenta: '',
        cyan: '',
        gray: '',
      }
    : {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        gray: '\x1b[90m',
      };

  // Calculate column widths
  const nameWidth = Math.max(4, Math.max(...scriptInfos.map((s) => s.name.length)));
  const typeWidth = Math.max(4, Math.max(...scriptInfos.map((s) => s.type.length)));
  const groupWidth = Math.max(5, Math.max(...scriptInfos.map((s) => (s.group || '').length)));
  const sourceWidth = Math.max(6, Math.max(...scriptInfos.map((s) => s.source.length)));
  const descWidth = Math.max(
    11,
    Math.min(60, Math.max(...scriptInfos.map((s) => (s.description || '').length)))
  );

  // Helper function to pad text
  const pad = (text: string, width: number) => text.padEnd(width);
  const truncate = (text: string, width: number) =>
    text.length > width ? `${text.substring(0, width - 3)}...` : text;

  // Build header
  const header = [
    `${colors.bright}${pad('NAME', nameWidth)}${colors.reset}`,
    `${colors.bright}${pad('TYPE', typeWidth)}${colors.reset}`,
    `${colors.bright}${pad('GROUP', groupWidth)}${colors.reset}`,
    `${colors.bright}${pad('SOURCE', sourceWidth)}${colors.reset}`,
    `${colors.bright}${pad('DESCRIPTION', descWidth)}${colors.reset}`,
  ].join(' │ ');

  const separator =
    '─'.repeat(nameWidth) +
    '─┼─' +
    '─'.repeat(typeWidth) +
    '─┼─' +
    '─'.repeat(groupWidth) +
    '─┼─' +
    '─'.repeat(sourceWidth) +
    '─┼─' +
    '─'.repeat(descWidth);

  // Build rows
  const rows: string[] = [];
  let currentGroup = '';

  for (const script of scriptInfos) {
    // Add group separator
    if (script.group && script.group !== currentGroup) {
      if (rows.length > 0) {
        rows.push(''); // Empty line between groups
      }
      currentGroup = script.group;
    }

    // Color based on type
    let nameColor = colors.reset;
    let typeColor = colors.reset;

    switch (script.type) {
      case 'lifecycle':
        nameColor = colors.cyan;
        typeColor = colors.cyan;
        break;
      case 'missing':
        nameColor = colors.red;
        typeColor = colors.red;
        break;
      default:
        nameColor = colors.green;
        typeColor = colors.blue;
    }

    const displayName = script.emoji ? `${script.emoji} ${script.name}` : script.name;
    const displayTitle = script.title ? ` (${script.title})` : '';
    const fullName = `${displayName}${displayTitle}`;

    const row = [
      `${nameColor}${pad(truncate(fullName, nameWidth), nameWidth)}${colors.reset}`,
      `${typeColor}${pad(script.type, typeWidth)}${colors.reset}`,
      `${colors.gray}${pad(script.group || '', groupWidth)}${colors.reset}`,
      `${colors.gray}${pad(script.source, sourceWidth)}${colors.reset}`,
      `${colors.dim}${pad(truncate(script.description || '', descWidth), descWidth)}${colors.reset}`,
    ].join(' │ ');

    rows.push(row);
  }

  return [header, separator, ...rows].join('\n');
}

/**
 * Main function to run the list scripts command
 */
export async function runListScripts(
  options: { json?: boolean; disableColors?: boolean } = {}
): Promise<void> {
  try {
    const scriptInfos = getAllScriptInfo();

    if (options.json) {
      console.log(JSON.stringify(scriptInfos, null, 2));
    } else {
      console.log(`\n📋 Scripts Overview\n`);
      console.log(formatAsTable(scriptInfos, { disableColors: options.disableColors }));

      // Summary
      const counts = {
        total: scriptInfos.length,
        regular: scriptInfos.filter((s) => s.type === 'regular').length,
        lifecycle: scriptInfos.filter((s) => s.type === 'lifecycle').length,
        missing: scriptInfos.filter((s) => s.type === 'missing').length,
      };

      console.log(`\n📊 Summary: ${counts.total} scripts total`);
      console.log(`   • ${counts.regular} regular scripts`);
      console.log(`   • ${counts.lifecycle} lifecycle scripts`);
      if (counts.missing > 0) {
        console.log(`   • ${counts.missing} missing scripts (configured but not in package.json)`);
      }
    }
  } catch (error) {
    console.error('Error listing scripts:', error);
    process.exit(1);
  }
}
