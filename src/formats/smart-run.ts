import type { PackageJson, ScriptGroup } from '../types.js';
import type { IScriptFormat } from './registry.js';

export const SmartRunFormat: IScriptFormat = {
  name: 'smart-run',
  priority: 200,
  detect: (pkg: PackageJson): boolean => {
    // Only detect when scriptsMeta exists in provided package.json (monorepo-friendly)
    return !!pkg.scriptsMeta?.scriptGroups?.length;
  },
  parse: (pkg: PackageJson): ScriptGroup[] => {
    return pkg.scriptsMeta?.scriptGroups || [];
  },
};
