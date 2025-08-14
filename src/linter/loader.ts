import fs from 'node:fs';
import yaml from 'js-yaml';
import type { PackageJsonForLinter, PackageMeta, LinterConfig } from './types.js';

export function loadConfig(configPath: string): PackageMeta {
  if (!fs.existsSync(configPath)) throw new Error(`Configuration file not found: ${configPath}`);
  const content = fs.readFileSync(configPath, 'utf8');
  try {
    return yaml.load(content) as PackageMeta;
  } catch (error) {
    throw new Error(`Invalid YAML syntax: ${(error as Error).message}`);
  }
}

export function loadPackageJson(packageJsonPath: string): PackageJsonForLinter {
  if (!fs.existsSync(packageJsonPath))
    throw new Error(`Package.json not found: ${packageJsonPath}`);
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  try {
    return JSON.parse(content) as PackageJsonForLinter;
  } catch (error) {
    throw new Error(`Invalid JSON syntax: ${(error as Error).message}`);
  }
}

export function loadLinterConfig(
  config: PackageMeta,
  packageJson: PackageJsonForLinter
): LinterConfig {
  const linterConfig = config.linter || packageJson.smartRun?.linter || packageJson.linter || {};
  return {
    requireScriptGroups: linterConfig.requireScriptGroups ?? false,
    requireDescription: linterConfig.requireDescription ?? false,
    requireEmoji: linterConfig.requireEmoji ?? false,
    requireTitle: linterConfig.requireTitle ?? false,
    rules: linterConfig.rules || {},
  };
}
