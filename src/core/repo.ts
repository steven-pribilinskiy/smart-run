import * as fs from 'node:fs';
import * as path from 'node:path';

export function isInsideSmartRunRepo(): boolean {
  try {
    let currentDir = process.cwd();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pkgPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
          if (pkg && pkg.name === 'smart-run') return true;
        } catch {
          // ignore
        }
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch {
    // ignore
  }
  return false;
}
