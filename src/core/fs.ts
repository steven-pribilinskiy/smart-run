import * as fs from 'node:fs';
import * as path from 'node:path';

export function readJsonFile<T>(filePath: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    throw new Error(`Error parsing JSON file: ${filePath}`);
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function resolveFromCwd(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

export function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
}
