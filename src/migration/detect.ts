import type { PackageJson } from '../types.js';

export function detectExistingConfigurations(
  pkg: PackageJson
): { type: string; description: string }[] {
  const configs: { type: string; description: string }[] = [];
  if (pkg.ntl?.descriptions)
    configs.push({
      type: 'ntl',
      description: `ntl descriptions (${Object.keys(pkg.ntl.descriptions).length} scripts)`,
    });
  if (pkg.scripts) {
    const hasOrg = Object.keys(pkg.scripts).some((k) => k.startsWith('\n#'));
    if (hasOrg)
      configs.push({
        type: 'npm-scripts',
        description: 'npm-scripts organization pattern (category headers)',
      });
  }
  if (pkg['scripts-info'])
    configs.push({ type: 'scripts-info', description: 'scripts-info descriptions' });
  else if (pkg.scripts && Object.keys(pkg.scripts).some((k) => k.startsWith('?')))
    configs.push({ type: 'scripts-info', description: 'npm-scripts-info (? prefixed scripts)' });
  if (pkg['scripts-description'])
    configs.push({ type: 'scripts-description', description: 'scripts-description format' });
  if (pkg['better-scripts'])
    configs.push({
      type: 'better-scripts',
      description: `better-scripts configuration (${Object.keys(pkg['better-scripts']).length} scripts)`,
    });
  return configs;
}

export function detectConfigurationType(pkg: PackageJson): string {
  if (pkg.ntl?.descriptions) return 'ntl';
  if (pkg['scripts-info']) return 'npm-scripts-info';
  if (pkg.scripts && Object.keys(pkg.scripts).some((k) => k.startsWith('?')))
    return 'npm-scripts-info';
  if (pkg['better-scripts']) return 'better-scripts';
  if (
    pkg.scripts &&
    Object.keys(pkg.scripts).some(
      (k) => k.startsWith('\n#') || k.startsWith('comment:') || k.startsWith('# ')
    )
  )
    return 'npm-scripts-org';
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) return 'basic';
  return 'none';
}
