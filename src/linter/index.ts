import { loadConfig, loadLinterConfig, loadPackageJson } from './loader.js';
import { formatReport } from './report.js';
import { defaultRules } from './rules.js';
import type { LinterIssue, LintReport } from './types.js';
import {
  validateAgainstPackage,
  validateBestPractices,
  validateContent,
  validateStructure,
} from './validators.js';

export function lintDirectory(directory = '.'): boolean {
  const path = (p: string) => (p === '.' ? 'package-meta.yaml' : `${directory}/package-meta.yaml`);
  const configPath = path(directory);
  const packageJsonPath = directory === '.' ? 'package.json' : `${directory}/package.json`;

  try {
    const config = loadConfig(configPath);
    const pkg = loadPackageJson(packageJsonPath);
    const cfg = loadLinterConfig(config, pkg);

    const issues: LinterIssue[] = [];
    const add = (i: LinterIssue) => issues.push(i);

    validateStructure(config, cfg, add);
    validateAgainstPackage(config, pkg, add);
    validateContent(config, add);
    validateBestPractices(config, add);

    const rules = defaultRules();
    const errorCount = issues.filter((i) => i.level === 'error').length;
    const warningCount = issues.filter((i) => i.level === 'warning').length;
    const infoCount = issues.filter((i) => i.level === 'info').length;

    const report: LintReport = {
      summary: {
        total: issues.length,
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
        passed: errorCount === 0 && warningCount === 0,
      },
      issues,
      rules,
    };

    console.log(formatReport(report));
    return report.summary.passed;
  } catch (_error) {
    console.error('❌ No package-meta.yaml found in directory');
    console.log('💡 Run smart-run migration first to create configuration');
    return false;
  }
}

export function runLinterCli(argv: string[]): void {
  const args = argv.slice(2);
  const directory = args[0] || '.';
  console.log(
    `🔍 Linting smart-run configuration in: ${require('node:path').resolve(directory)}\n`
  );
  const passed = lintDirectory(directory);
  process.exit(passed ? 0 : 1);
}
