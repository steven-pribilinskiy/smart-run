import type { PackageJson, ScriptGroup } from '../../types.js';

export function convertScriptsDescriptionToSmartRun(pkg: PackageJson): ScriptGroup[] {
  const scriptsDescription = pkg['scripts-description'] || {};
  const scripts = pkg.scripts || {};
  const scriptConfigs = Object.keys(scripts)
    .filter((k) => !k.startsWith('\n#') || scripts[k] !== '')
    .map((k) => ({
      key: k,
      description: scriptsDescription[k] || scripts[k] || `Run ${k} script`,
    }));
  return [{ name: 'Available Scripts', scripts: scriptConfigs }];
}
