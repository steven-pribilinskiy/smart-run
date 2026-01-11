import type { PackageJson } from '../types.js';
import { fileExists, readJsonFile, resolveFromCwd } from './fs.js';
import { isInsideSmartRunRepo } from './repo.js';

export function getPackageJson(): PackageJson {
  let pkgPath = resolveFromCwd('package.json');

  if (!fileExists(pkgPath) && isInsideSmartRunRepo()) {
    const demoPkgPath = resolveFromCwd('package.demo.json');
    if (fileExists(demoPkgPath)) {
      pkgPath = demoPkgPath;
    } else {
      throw new Error('package.json not found in current directory');
    }
  }

  return readJsonFile<PackageJson>(pkgPath);
}

export function getNpmScripts(): Record<string, string> {
  const pkg = getPackageJson();
  return pkg.scripts || {};
}
