import type { PackageJson, ScriptGroup } from '../../types.js';
import { extractDescriptionFromEcho } from '../../core/scripts.js';

export function convertNtlToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; emoji?: string }>;
} {
  const descriptions = pkg.ntl?.descriptions || {};
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; emoji?: string }> = {};
  Object.keys(scripts)
    .filter((k) => !k.startsWith('\n#') && !k.startsWith('comment:') && scripts[k] !== '')
    .forEach((k) => {
      const description = descriptions[k] || scripts[k] || `Run ${k} script`;
      result[k] = { description };
    });
  return { scripts: result };
}
