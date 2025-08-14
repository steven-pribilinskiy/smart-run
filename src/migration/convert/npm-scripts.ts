import type { PackageJson, ScriptGroup } from '../../types.js';

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
      if (currentGroup) groups.push(currentGroup);
      let categoryName = key;
      if (key.startsWith('comment:')) {
        categoryName = (value || key.replace('comment:', '').toUpperCase()).replace(/^#\s*/, '');
      } else if (key.startsWith('\n#')) {
        categoryName = key.replace(/^\n#\s*/, '').replace(/:?\s*$/, '');
      } else if (key.startsWith('# ')) {
        categoryName = key.replace(/^#\s*/, '').replace(/:?\s*$/, '');
      }
      currentGroup = { name: categoryName, scripts: [] };
    } else if (
      currentGroup &&
      !key.startsWith('\n#') &&
      !key.startsWith('comment:') &&
      !key.startsWith('# ')
    ) {
      currentGroup.scripts.push({ key, description: value || `Run ${key} script` });
    } else if (
      !currentGroup &&
      !key.startsWith('\n#') &&
      !key.startsWith('comment:') &&
      !key.startsWith('# ')
    ) {
      if (!groups.find((g) => g.name === 'Scripts')) groups.push({ name: 'Scripts', scripts: [] });
      const scriptsGroup = groups.find((g) => g.name === 'Scripts')!;
      scriptsGroup.scripts.push({ key, description: value || `Run ${key} script` });
    }
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

export function convertNpmScriptsOrgToSmartRun(pkg: PackageJson): { scriptGroups: ScriptGroup[] } {
  return { scriptGroups: convertNpmScriptsToSmartRun(pkg) };
}
