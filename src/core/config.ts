import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import type { PackageMeta, ScriptGroup } from '../types.js';
import { getPackageJson } from './package.js';

export function getScriptGroups(configPath = 'package-meta.yaml'): ScriptGroup[] {
  const metaPath = path.resolve(process.cwd(), configPath);

  if (fs.existsSync(metaPath)) {
    try {
      const meta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;
      if (!meta || typeof meta !== 'object' || !Array.isArray(meta.scriptGroups)) {
        console.error(`Invalid format in ${configPath}. Expected scriptGroups array.`);
        return [];
      }
      return meta.scriptGroups;
    } catch (error) {
      console.error(`Error parsing ${configPath}:`, error);
      return [];
    }
  }

  if (configPath === 'package-meta.yaml') {
    try {
      const pkg = getPackageJson();
      if (pkg?.scriptsMeta && Array.isArray(pkg.scriptsMeta.scriptGroups)) {
        return pkg.scriptsMeta.scriptGroups;
      }
    } catch {
      // ignore
    }
  }

  return [];
}
