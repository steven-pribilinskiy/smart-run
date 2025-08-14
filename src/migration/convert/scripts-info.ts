import type { PackageJson, ScriptGroup } from '../../types.js';
import { extractDescriptionFromEcho } from '../../core/scripts.js';

export function convertNpmScriptsInfoToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; emoji?: string }>;
} {
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; emoji?: string }> = {};
  let scriptsInfo: Record<string, string> = {};
  try {
    if ('scripts-info' in pkg && pkg['scripts-info']) {
      scriptsInfo = pkg['scripts-info'] as Record<string, string>;
    } else {
      Object.keys(scripts)
        .filter((name) => name.startsWith('?'))
        .forEach((name) => {
          const actual = name.substring(1);
          const description = extractDescriptionFromEcho(scripts[name]);
          scriptsInfo[actual] = description;
        });
    }
  } catch {
    // ignore
  }
  Object.keys(scripts)
    .filter((k) => !k.startsWith('?') && !k.startsWith('\n#') && !k.startsWith('comment:'))
    .forEach((k) => {
      const description = scriptsInfo[k] || scripts[k] || `Run ${k} script`;
      result[k] = { description };
    });
  return { scripts: result };
}

export function convertScriptsInfoToSmartRun(pkg: PackageJson): ScriptGroup[] {
  const scripts = pkg.scripts || {};
  let scriptsInfo: Record<string, string> = {};
  try {
    if ('scripts-info' in pkg && pkg['scripts-info']) {
      scriptsInfo = pkg['scripts-info'] as Record<string, string>;
    } else {
      const s = pkg.scripts || {};
      Object.keys(s)
        .filter((name) => name.startsWith('?'))
        .forEach((name) => {
          const actual = name.substring(1);
          const description = extractDescriptionFromEcho(s[name]);
          scriptsInfo[actual] = description;
        });
    }
  } catch {
    scriptsInfo = {};
  }
  const scriptConfigs = Object.keys(scripts)
    .filter((k) => !k.startsWith('\n#') && !k.startsWith('?') && scripts[k] !== '')
    .map((k) => ({ key: k, description: scriptsInfo[k] || scripts[k] || `Run ${k} script` }));
  return [{ name: 'Available Scripts', scripts: scriptConfigs }];
}
