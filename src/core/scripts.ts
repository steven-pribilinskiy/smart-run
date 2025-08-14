import type { ScriptGroup, PackageJson } from '../types.js';

export function getLifecycleScripts(scripts: Record<string, string>): ScriptGroup | null {
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

  const found = lifecycleScripts
    .filter((scriptName) => scripts[scriptName])
    .map((scriptName) => ({ key: scriptName, description: scripts[scriptName] }));

  if (found.length === 0) return null;
  return { name: 'Lifecycle Scripts', scripts: found };
}

export function parseNpmScriptGroups(scripts: Record<string, string>): ScriptGroup[] {
  const groups: ScriptGroup[] = [];
  let currentGroup: ScriptGroup | null = null;

  for (const [key, value] of Object.entries(scripts)) {
    if (key.startsWith('\n#') && value === '') {
      const categoryName = key.replace(/^\n#\s*/, '').replace(/:?\s*$/, '');
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { name: categoryName, scripts: [] };
    } else if (currentGroup && !key.startsWith('\n#')) {
      currentGroup.scripts.push({ key, description: value });
    } else if (!currentGroup && !key.startsWith('\n#')) {
      if (!groups.find((g) => g.name === 'Scripts')) groups.push({ name: 'Scripts', scripts: [] });
      const scriptsGroup = groups.find((g) => g.name === 'Scripts')!;
      scriptsGroup.scripts.push({ key, description: value });
    }
  }

  if (currentGroup) groups.push(currentGroup);
  return groups;
}

export function getNtlDescriptions(pkg: PackageJson): Record<string, string> {
  return pkg.ntl?.descriptions || {};
}

export function getNpmScriptsInfoDescriptions(pkg: PackageJson): Record<string, string> {
  try {
    if ('scripts-info' in pkg && pkg['scripts-info']) {
      return pkg['scripts-info'] as Record<string, string>;
    }
    const result: Record<string, string> = {};
    const scripts = pkg.scripts || {};
    Object.keys(scripts)
      .filter((scriptName) => scriptName.startsWith('?'))
      .forEach((scriptName) => {
        const actualScriptName = scriptName.substring(1);
        const command = scripts[scriptName];
        result[actualScriptName] = extractDescriptionFromEcho(command);
      });
    return result;
  } catch {
    return {};
  }
}

export function extractDescriptionFromEcho(command: string): string {
  const echoRegex = /^\s*echo\s+/;
  const match = echoRegex.exec(command);
  if (!match) return command;
  let description = command.substring(match[0].length);
  const flagRegex = /^-[eEn]+\s+/;
  let flagMatch: RegExpExecArray | null = flagRegex.exec(description);
  while (flagMatch !== null) {
    description = description.substring(flagMatch[0].length);
    flagMatch = flagRegex.exec(description);
  }
  return description.replace(/^["']|["']$/g, '');
}
