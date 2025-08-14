import { createDefaultRegistry } from '../formats/registry.js';
import { getPackageJson } from '../core/package.js';
import type { ScriptGroup } from '../types.js';
import * as fs from 'node:fs';
import yaml from 'js-yaml';

export type ConvertOptions = {
  from?: string;
  to: 'smart-run' | 'json' | 'scriptsMeta' | 'npm-scripts-org' | 'ntl' | 'scripts-info';
  output?: string;
};

export function convertConfig(options: ConvertOptions): {
  groups: ScriptGroup[];
  writtenTo?: string;
} {
  const registry = createDefaultRegistry();
  const pkg = getPackageJson();
  const detected = registry.getBestFormat(pkg, new Map());
  if (!detected) throw new Error('No known format detected');
  const groups = detected.parse(pkg, new Map());

  // Write to destination format
  switch (options.to) {
    case 'smart-run': {
      const content = `# Smart-run configuration\n${yaml.dump({ scriptGroups: groups })}`;
      const out = options.output || 'package-meta.yaml';
      fs.writeFileSync(out, content);
      return { groups, writtenTo: out };
    }
    case 'json': {
      const out = options.output || 'package-meta.json';
      fs.writeFileSync(out, JSON.stringify({ scriptGroups: groups }, null, 2));
      return { groups, writtenTo: out };
    }
    case 'scriptsMeta': {
      const out = options.output || 'package.json';
      const packageJson = JSON.parse(fs.readFileSync(out, 'utf8'));
      packageJson.scriptsMeta = { scriptGroups: groups };
      fs.writeFileSync(out, JSON.stringify(packageJson, null, 2));
      return { groups, writtenTo: out };
    }
    default:
      // For other targets, we currently just return parsed groups; dedicated serializers can be added
      return { groups };
  }
}
