import { lintDirectory } from '../linter/index.js';

export function lint(dir = '.'): boolean {
  return lintDirectory(dir);
}
