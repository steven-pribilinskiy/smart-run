import { convertNpmScriptsToSmartRun } from '../migration/convert/npm-scripts.js';
import { convertNtlToSmartRun } from '../migration/convert/ntl.js';
import { convertScriptsDescriptionToSmartRun } from '../migration/convert/scripts-description.js';
import { convertScriptsInfoToSmartRun } from '../migration/convert/scripts-info.js';
import type { PackageJson, ScriptGroup } from '../types.js';
import { SmartRunFormat } from './smart-run.js';

export interface IScriptFormat {
  name: string;
  priority: number;
  detect(pkg: PackageJson, configFiles: Map<string, unknown>): boolean;
  parse(pkg: PackageJson, configFiles: Map<string, unknown>): ScriptGroup[];
}

export class FormatRegistry {
  private formats: IScriptFormat[] = [];

  register(format: IScriptFormat): void {
    this.formats.push(format);
    this.formats.sort((a, b) => b.priority - a.priority);
  }

  detect(pkg: PackageJson, configFiles: Map<string, unknown>): IScriptFormat[] {
    return this.formats.filter((f) => f.detect(pkg, configFiles));
  }

  getBestFormat(pkg: PackageJson, configFiles: Map<string, unknown>): IScriptFormat | null {
    return this.detect(pkg, configFiles)[0] || null;
  }
}

export function createDefaultRegistry(): FormatRegistry {
  const registry = new FormatRegistry();

  // Smart-Run native
  registry.register(SmartRunFormat);

  // NTL
  registry.register({
    name: 'ntl',
    priority: 100,
    detect: (pkg) => !!pkg.ntl?.descriptions,
    parse: (pkg) => {
      const res = convertNtlToSmartRun(pkg);
      return [
        {
          name: 'Available Scripts',
          scripts: Object.keys(res.scripts).map((k) => ({
            key: k,
            description: res.scripts[k].description,
          })),
        },
      ];
    },
  });

  // scripts-info
  registry.register({
    name: 'scripts-info',
    priority: 80,
    detect: (pkg) =>
      !!pkg['scripts-info'] || Object.keys(pkg.scripts || {}).some((k) => k.startsWith('?')),
    parse: (pkg) => convertScriptsInfoToSmartRun(pkg),
  });

  // scripts-description
  registry.register({
    name: 'scripts-description',
    priority: 70,
    detect: (pkg) => !!pkg['scripts-description'],
    parse: (pkg) => convertScriptsDescriptionToSmartRun(pkg),
  });

  // npm-scripts org
  registry.register({
    name: 'npm-scripts-org',
    priority: 60,
    detect: (pkg) =>
      Object.keys(pkg.scripts || {}).some(
        (k) => k.startsWith('\n#') || k.startsWith('comment:') || k.startsWith('# ')
      ),
    parse: (pkg) => convertNpmScriptsToSmartRun(pkg),
  });

  // basic fallback
  registry.register({
    name: 'basic',
    priority: 10,
    detect: (pkg) => !!pkg.scripts && Object.keys(pkg.scripts).length > 0,
    parse: (pkg) => [
      {
        name: 'Available Scripts',
        scripts: Object.keys(pkg.scripts || {})
          .filter((k) => !k.startsWith('\n#'))
          .map((k) => ({ key: k, description: pkg.scripts?.[k] ?? '' })),
      },
    ],
  });

  return registry;
}
