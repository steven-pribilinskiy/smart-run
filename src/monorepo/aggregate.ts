import * as fs from 'node:fs';
import type { ScriptGroup } from '../types.js';
import { createDefaultRegistry } from '../formats/registry.js';

export type PackageScripts = {
  name: string;
  path: string;
  groups: ScriptGroup[];
};

export function aggregateWorkspace(
  manifests: { path: string; packageJsonPath: string }[]
): PackageScripts[] {
  const registry = createDefaultRegistry();
  return manifests.map((m) => {
    const pkg = JSON.parse(fs.readFileSync(m.packageJsonPath, 'utf8')) as any;
    const format = registry.getBestFormat(pkg, new Map());
    const groups = format ? format.parse(pkg, new Map()) : [];
    return { name: pkg.name || m.path, path: m.path, groups };
  });
}



