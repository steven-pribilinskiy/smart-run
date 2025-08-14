import fs from 'node:fs';
import path from 'node:path';

export function isGitRepository(): boolean {
  try {
    // Lightweight check
    return fs.existsSync('.git');
  } catch {
    return false;
  }
}

export function ensureHooksDirectory(hooksDir: string): void {
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });
}

export function isExecutable(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

export function resolveHookPath(hooksDir: string, name: string): string {
  return path.join(hooksDir, name);
}
