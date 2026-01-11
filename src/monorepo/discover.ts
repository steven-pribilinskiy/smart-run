import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import { findWorkspaceRoot, type WorkspaceInfo } from './detect.js';

export type PackageManifest = {
  path: string;
  packageJsonPath: string;
};

export function resolveWorkspaceGlobs(info: WorkspaceInfo): string[] {
  if (info.type === 'pnpm') {
    const content = fs.readFileSync(info.configPath, 'utf8');
    const conf = yaml.load(content) as { packages?: string[] };
    return conf.packages || ['packages/*'];
  }
  if (info.type === 'lerna') {
    try {
      const conf = JSON.parse(fs.readFileSync(info.configPath, 'utf8')) as { packages?: string[] };
      return conf.packages || ['packages/*'];
    } catch {
      return ['packages/*'];
    }
  }
  if (info.type === 'turbo') return ['packages/*'];
  if (info.type === 'npm') {
    const pkg = JSON.parse(fs.readFileSync(info.configPath, 'utf8')) as {
      workspaces?: string[] | { packages?: string[] };
    };
    const ws = pkg.workspaces;
    if (Array.isArray(ws)) return ws;
    if (ws && Array.isArray(ws.packages)) return ws.packages;
    return ['packages/*'];
  }
  return ['packages/*'];
}

export function discoverPackageManifests(startDir: string = process.cwd()): PackageManifest[] {
  const info = findWorkspaceRoot(startDir);
  if (!info) return [];
  const patterns = resolveWorkspaceGlobs(info);
  const manifests: PackageManifest[] = [];

  // crude glob expansion: only single-level patterns like packages/* supported here
  patterns.forEach((pattern) => {
    const abs = path.isAbsolute(pattern) ? pattern : path.join(info.root, pattern);
    const base = abs.replace(/\*.*$/, '');
    const entries = fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }) : [];
    entries.forEach((e) => {
      if (!e.isDirectory()) return;
      const pkgPath = path.join(base, e.name, 'package.json');
      if (fs.existsSync(pkgPath)) {
        manifests.push({ path: path.dirname(pkgPath), packageJsonPath: pkgPath });
      }
    });
  });
  return manifests;
}
