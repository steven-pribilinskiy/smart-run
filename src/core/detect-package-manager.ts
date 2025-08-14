import * as fs from 'node:fs';
import type { PackageJson } from '../types.js';

export function detectPackageManager(pkg?: PackageJson): string {
  if (pkg?.ntl?.runner) return pkg.ntl.runner;
  if (pkg?.packageManager) {
    const manager = pkg.packageManager.split('@')[0];
    if (['npm', 'pnpm', 'bun', 'yarn'].includes(manager)) return manager;
  }
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  const envRunner = process.env.NTL_RUNNER;
  if (envRunner && ['npm', 'pnpm', 'bun', 'yarn'].includes(envRunner)) return envRunner;
  return 'npm';
}
