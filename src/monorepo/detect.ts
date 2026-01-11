import * as fs from 'node:fs';
import * as path from 'node:path';

export type WorkspaceType = 'pnpm' | 'lerna' | 'turbo' | 'npm' | 'yarn';

export type WorkspaceInfo = {
  root: string;
  type: WorkspaceType;
  configPath: string;
};

export function findWorkspaceRoot(startDir: string = process.cwd()): WorkspaceInfo | null {
  let current = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pnpm = path.join(current, 'pnpm-workspace.yaml');
    if (fs.existsSync(pnpm)) return { root: current, type: 'pnpm', configPath: pnpm };
    const lerna = path.join(current, 'lerna.json');
    if (fs.existsSync(lerna)) return { root: current, type: 'lerna', configPath: lerna };
    const turbo = path.join(current, 'turbo.json');
    if (fs.existsSync(turbo)) return { root: current, type: 'turbo', configPath: turbo };
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
          workspaces?: string[] | { packages?: string[] };
        };
        if (pkg.workspaces) {
          return {
            root: current,
            type: 'npm',
            configPath: pkgPath,
          };
        }
      } catch {
        // ignore
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
