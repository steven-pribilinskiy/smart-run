import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type LinterRule = {
  level: 'error' | 'warning' | 'info';
  message: string;
};

type LinterIssue = {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line?: number | null;
  ruleInfo: LinterRule;
};

type LinterConfig = {
  requireScriptGroups?: boolean;
  requireDescription?: boolean;
  requireEmoji?: boolean;
  requireTitle?: boolean;
  rules?: Record<string, { level: 'error' | 'warning' | 'info' }>;
};

type ScriptConfig = {
  key: string;
  description?: string;
  title?: string;
  emoji?: string;
};

type ScriptGroup = {
  name: string;
  scripts: ScriptConfig[];
};

type PackageMeta = {
  scriptGroups?: ScriptGroup[];
  scripts?: ScriptConfig[];
  titleizeKey?: boolean;
  linter?: LinterConfig;
};

// Define proper type for package.json
type PackageJsonForLinter = {
  scripts?: Record<string, string>;
  smartRun?: {
    linter?: LinterConfig;
  };
  linter?: LinterConfig;
  [key: string]: unknown;
};

type LintReport = {
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    passed: boolean;
  };
  issues: LinterIssue[];
  rules: Record<string, LinterRule>;
};

/**
 * Configuration linter for smart-run package-meta.yaml files
 * Validates migrated configurations for best practices and common issues
 */
class ConfigLinter {
  private rules: Record<string, LinterRule>;
  private issues: LinterIssue[];
  private linterConfig: LinterConfig | null;

  constructor() {
    this.rules = {
      // Structure validation rules
      'required-fields': { level: 'error', message: 'Missing required fields' },
      'valid-structure': { level: 'error', message: 'Invalid configuration structure' },

      // Content validation rules
      'script-descriptions': {
        level: 'warning',
        message: 'Scripts should have meaningful descriptions',
      },
      'emoji-consistency': {
        level: 'warning',
        message: 'Emojis should be consistent within groups',
      },
      'title-format': { level: 'warning', message: 'Titles should be properly formatted' },
      'group-organization': { level: 'info', message: 'Scripts should be logically grouped' },

      // Best practices
      'description-length': {
        level: 'info',
        message: 'Descriptions should be concise but informative',
      },
      'duplicate-scripts': { level: 'error', message: 'Duplicate script keys found' },
      'unused-scripts': { level: 'warning', message: 'Scripts defined but not in package.json' },
      'missing-scripts': {
        level: 'warning',
        message: 'Scripts in package.json but not documented',
      },

      // Security and safety
      'dangerous-commands': { level: 'error', message: 'Potentially dangerous commands detected' },
      'hardcoded-paths': { level: 'warning', message: 'Hardcoded paths detected' },
      'environment-variables': { level: 'info', message: 'Environment variables usage' },
    };

    this.issues = [];
    this.linterConfig = null;
  }

  /**
   * Titleize a script name by converting kebab-case and snake_case to title case
   * @param scriptName - The script name to titleize
   * @returns The titleized string
   */
  private titleize(scriptName: string): string {
    return scriptName
      .replace(/[-_:]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Lint a package-meta.yaml configuration
   */
  lintConfig(configPath: string, packageJsonPath: string): LintReport {
    this.issues = [];

    try {
      // Load configuration files
      const config = this.loadConfig(configPath);
      const packageJson = this.loadPackageJson(packageJsonPath);

      // Load linter configuration
      this.linterConfig = this.loadLinterConfig(config, packageJson);

      // Run validation rules
      this.validateStructure(config);
      this.validateScripts(config, packageJson);
      this.validateContent(config);
      this.validateBestPractices(config, packageJson);
      this.validateSecurity(config, packageJson);

      return this.generateReport();
    } catch (error) {
      this.addIssue(
        'error',
        'config-load-error',
        `Failed to load configuration: ${(error as Error).message}`
      );
      return this.generateReport();
    }
  }

  /**
   * Load and parse package-meta.yaml
   */
  loadConfig(configPath: string): PackageMeta {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const content = fs.readFileSync(configPath, 'utf8');
    try {
      return yaml.load(content) as PackageMeta;
    } catch (error) {
      throw new Error(`Invalid YAML syntax: ${(error as Error).message}`);
    }
  }

  /**
   * Load linter configuration from various sources
   */
  loadLinterConfig(config: PackageMeta, packageJson: PackageJsonForLinter): LinterConfig {
    // Priority order: config.linter > packageJson.smartRun?.linter > packageJson.linter
    const linterConfig = config.linter || packageJson.smartRun?.linter || packageJson.linter || {};

    // Set default values
    return {
      requireScriptGroups: linterConfig.requireScriptGroups ?? false,
      requireDescription: linterConfig.requireDescription ?? false,
      requireEmoji: linterConfig.requireEmoji ?? false,
      requireTitle: linterConfig.requireTitle ?? false,
      rules: linterConfig.rules || {},
    };
  }

  /**
   * Load and parse package.json
   */
  loadPackageJson(packageJsonPath: string): PackageJsonForLinter {
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Package.json not found: ${packageJsonPath}`);
    }

    const content = fs.readFileSync(packageJsonPath, 'utf8');
    try {
      return JSON.parse(content) as PackageJsonForLinter;
    } catch (error) {
      throw new Error(`Invalid JSON syntax: ${(error as Error).message}`);
    }
  }

  /**
   * Validate basic structure
   */
  validateStructure(config: PackageMeta): void {
    // Support both grouped and flat script formats
    const hasScriptGroups = config.scriptGroups && config.scriptGroups.length > 0;
    const hasScripts = config.scripts && config.scripts.length > 0;

    // Check if we require script groups
    if (this.linterConfig?.requireScriptGroups && !hasScriptGroups) {
      this.addIssue('error', 'required-fields', 'scriptGroups are required by configuration');
      return;
    }

    // Must have either scriptGroups or scripts
    if (!hasScriptGroups && !hasScripts) {
      this.addIssue('error', 'required-fields', 'Must have either scriptGroups or scripts field');
      return;
    }

    // Validate script groups format
    if (hasScriptGroups) {
      if (!Array.isArray(config.scriptGroups)) {
        this.addIssue('error', 'valid-structure', 'scriptGroups must be an array');
        return;
      }

      // Validate each group
      config.scriptGroups.forEach((group, groupIndex) => {
        if (!group.name) {
          this.addIssue('error', 'required-fields', `Group ${groupIndex} missing name field`);
        }

        if (!group.scripts || !Array.isArray(group.scripts)) {
          this.addIssue(
            'error',
            'valid-structure',
            `Group "${group.name}" must have scripts array`
          );
          return;
        }

        // Validate each script in group
        group.scripts.forEach((script, scriptIndex) => {
          this.validateScript(script, scriptIndex, `group "${group.name}"`, config);
        });
      });
    }

    // Validate flat scripts format
    if (hasScripts) {
      if (!Array.isArray(config.scripts)) {
        this.addIssue('error', 'valid-structure', 'scripts must be an array');
        return;
      }

      // Validate each script
      config.scripts.forEach((script, scriptIndex) => {
        this.validateScript(script, scriptIndex, 'root scripts', config);
      });
    }
  }

  /**
   * Validate individual script configuration
   */
  validateScript(
    script: ScriptConfig,
    scriptIndex: number,
    context: string,
    config: PackageMeta
  ): void {
    if (!script.key) {
      this.addIssue('error', 'required-fields', `Script ${scriptIndex} in ${context} missing key`);
    }

    // Check required fields based on linter configuration
    if (this.linterConfig?.requireDescription && !script.description) {
      this.addIssue(
        'error',
        'required-fields',
        `Script "${script.key}" missing required description`
      );
    } else if (!script.description) {
      this.addIssue('warning', 'script-descriptions', `Script "${script.key}" missing description`);
    }

    if (this.linterConfig?.requireEmoji && !script.emoji) {
      this.addIssue('error', 'required-fields', `Script "${script.key}" missing required emoji`);
    }

    if (this.linterConfig?.requireTitle && !script.title) {
      // If titleize is enabled, generate a title from the script key
      if (config.titleizeKey) {
        script.title = this.titleize(script.key);
      } else {
        this.addIssue('error', 'required-fields', `Script "${script.key}" missing required title`);
      }
    } else if (!script.title && config.titleizeKey) {
      // Auto-generate title when titleize is enabled even if not required
      script.title = this.titleize(script.key);
    }
  }

  /**
   * Validate scripts against package.json
   */
  validateScripts(config: PackageMeta, packageJson: PackageJsonForLinter): void {
    if (!packageJson.scripts) {
      this.addIssue('warning', 'missing-scripts', 'No scripts found in package.json');
      return;
    }

    const packageScripts = new Set(Object.keys(packageJson.scripts));
    const configScripts = new Set<string>();
    const duplicateScripts = new Set<string>();

    // Collect all scripts from config and check for duplicates
    const allScripts = [
      ...(config.scriptGroups?.flatMap((group) => group.scripts) || []),
      ...(config.scripts || []),
    ];

    allScripts.forEach((script) => {
      if (configScripts.has(script.key)) {
        duplicateScripts.add(script.key);
      }
      configScripts.add(script.key);
    });

    // Report duplicates
    duplicateScripts.forEach((scriptKey) => {
      this.addIssue('error', 'duplicate-scripts', `Script "${scriptKey}" defined multiple times`);
    });

    // Check for unused scripts (in config but not in package.json)
    configScripts.forEach((scriptKey) => {
      if (!packageScripts.has(scriptKey)) {
        this.addIssue(
          'warning',
          'unused-scripts',
          `Script "${scriptKey}" documented but not in package.json`
        );
      }
    });

    // Check for missing scripts (in package.json but not in config)
    packageScripts.forEach((scriptKey) => {
      if (!configScripts.has(scriptKey)) {
        this.addIssue(
          'warning',
          'missing-scripts',
          `Script "${scriptKey}" in package.json but not documented`
        );
      }
    });
  }

  /**
   * Validate content quality
   */
  validateContent(config: PackageMeta): void {
    const _allScripts = [
      ...(config.scriptGroups?.flatMap((group) => group.scripts) || []),
      ...(config.scripts || []),
    ];

    // Validate grouped scripts
    config.scriptGroups?.forEach((group) => {
      // Check group name format
      if (group.name && group.name.length > 50) {
        this.addIssue('info', 'title-format', `Group name "${group.name}" is very long`);
      }

      // Check emoji consistency within groups
      const emojis = group.scripts?.map((s) => s.emoji).filter(Boolean) || [];
      if (emojis.length > 0 && emojis.length < group.scripts?.length) {
        this.addIssue(
          'warning',
          'emoji-consistency',
          `Group "${group.name}" has inconsistent emoji usage`
        );
      }

      this.validateScriptContent(group.scripts);
    });

    // Validate flat scripts
    if (config.scripts) {
      this.validateScriptContent(config.scripts);
    }
  }

  /**
   * Validate content of scripts array
   */
  validateScriptContent(scripts: ScriptConfig[]): void {
    scripts.forEach((script) => {
      // Check description length
      if (script.description) {
        if (script.description.length < 10) {
          this.addIssue(
            'info',
            'description-length',
            `Script "${script.key}" description is very short`
          );
        } else if (script.description.length > 100) {
          this.addIssue(
            'info',
            'description-length',
            `Script "${script.key}" description is very long`
          );
        }
      }

      // Check title format
      if (script.title) {
        if (script.title === script.key) {
          this.addIssue('info', 'title-format', `Script "${script.key}" title same as key`);
        }

        if (script.title.length > 30) {
          this.addIssue('info', 'title-format', `Script "${script.key}" title is very long`);
        }
      }

      // Check emoji format
      if (script.emoji) {
        if (script.emoji.length > 2) {
          this.addIssue(
            'warning',
            'emoji-consistency',
            `Script "${script.key}" emoji appears invalid`
          );
        }
      }
    });
  }

  /**
   * Validate best practices
   */
  validateBestPractices(config: PackageMeta, _packageJson: PackageJsonForLinter): void {
    // Check group organization
    const totalScripts =
      (config.scriptGroups?.flatMap((group) => group.scripts) || []).length +
      (config.scripts || []).length;

    if (totalScripts > 5 && !config.scriptGroups?.length) {
      this.addIssue(
        'warning',
        'script-organization',
        'Consider organizing scripts into groups for better maintainability'
      );
    }

    // Check for consistent naming
    const allScripts = [
      ...(config.scriptGroups?.flatMap((group) => group.scripts) || []),
      ...(config.scripts || []),
    ];

    const naming = {
      kebab: 0,
      camel: 0,
      snake: 0,
      colon: 0,
    };

    allScripts.forEach((script) => {
      if (script.key.includes('-')) naming.kebab++;
      if (/[a-z][A-Z]/.test(script.key)) naming.camel++;
      if (script.key.includes('_')) naming.snake++;
      if (script.key.includes(':')) naming.colon++;
    });

    const total = allScripts.length;
    const maxNaming = Math.max(naming.kebab, naming.camel, naming.snake, naming.colon);
    const consistency = total > 0 ? maxNaming / total : 0;

    if (consistency < 0.8 && total > 3) {
      this.addIssue(
        'info',
        'naming-consistency',
        'Consider using consistent naming convention for scripts'
      );
    }
  }

  /**
   * Validate security and safety
   */
  validateSecurity(_config: PackageMeta, packageJson: PackageJsonForLinter): void {
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\//, message: 'Dangerous recursive delete command' },
      { pattern: /sudo\s+/, message: 'Avoid using sudo in scripts' },
      { pattern: />\s*\/dev\/null\s*2>&1/, message: 'Silencing all output may hide errors' },
    ];

    const scripts = packageJson.scripts || {};
    Object.entries(scripts).forEach(([scriptName, command]) => {
      dangerousPatterns.forEach(({ pattern, message }) => {
        if (pattern.test(command)) {
          this.addIssue('warning', 'script-security', `Script "${scriptName}": ${message}`);
        }
      });
    });
  }

  /**
   * Add an issue to the results
   */
  addIssue(
    level: 'error' | 'warning' | 'info',
    rule: string,
    message: string,
    line: number | null = null
  ): void {
    this.issues.push({
      level,
      rule,
      message,
      line,
      ruleInfo: this.rules[rule] || { level, message: 'Unknown rule' },
    });
  }

  /**
   * Generate linting report
   */
  generateReport(): LintReport {
    const errorCount = this.issues.filter((i) => i.level === 'error').length;
    const warningCount = this.issues.filter((i) => i.level === 'warning').length;
    const infoCount = this.issues.filter((i) => i.level === 'info').length;

    return {
      summary: {
        total: this.issues.length,
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
        passed: errorCount === 0 && warningCount === 0,
      },
      issues: this.issues,
      rules: this.rules,
    };
  }

  /**
   * Format report for console output
   */
  formatReport(report: LintReport): string {
    const lines: string[] = [];

    // Header
    lines.push('🔍 Smart-run Configuration Linter Report');
    lines.push('═'.repeat(50));

    // Summary
    const { summary } = report;
    if (summary.passed) {
      lines.push('✅ Configuration passed all checks!');
    } else {
      lines.push(`❌ Found ${summary.total} issues:`);
      if (summary.errors > 0) lines.push(`   • ${summary.errors} errors`);
      if (summary.warnings > 0) lines.push(`   • ${summary.warnings} warnings`);
      if (summary.info > 0) lines.push(`   • ${summary.info} info`);
    }

    lines.push('');

    // Issues by level
    (['error', 'warning', 'info'] as const).forEach((level) => {
      const levelIssues = report.issues.filter((i) => i.level === level);
      if (levelIssues.length === 0) return;

      const icon = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} ${level.toUpperCase()} (${levelIssues.length})`);
      lines.push('─'.repeat(30));

      levelIssues.forEach((issue) => {
        lines.push(`  ${issue.message}`);
        if (issue.line) lines.push(`    Line: ${issue.line}`);
      });

      lines.push('');
    });

    // Recommendations
    if (summary.total > 0) {
      lines.push('💡 Recommendations:');
      lines.push('─'.repeat(30));
      lines.push('• Fix all errors before committing');
      lines.push('• Review warnings for best practices');
      lines.push('• Consider info suggestions for improvements');
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Lint configuration files in a directory
 */
function _lintDirectory(directory: string = '.'): boolean {
  const linter = new ConfigLinter();
  const configPath = path.join(directory, 'package-meta.yaml');
  const packageJsonPath = path.join(directory, 'package.json');

  if (!fs.existsSync(configPath)) {
    console.error('❌ No package-meta.yaml found in directory');
    console.log('💡 Run smart-run migration first to create configuration');
    return false;
  }

  const report = linter.lintConfig(configPath, packageJsonPath);
  console.log(linter.formatReport(report));

  return report.summary.passed;
}

/**
 * CLI interface
 */
function _cli(): void {
  const args = process.argv.slice(2);
  const directory = args[0] || '.';

  console.log(`🔍 Linting smart-run configuration in: ${path.resolve(directory)}\n`);

  const passed = _lintDirectory(directory);
  process.exit(passed ? 0 : 1);
}

export { ConfigLinter, _lintDirectory as lintDirectory, _cli as cli };

// Run CLI if called directly
if (require.main === module) {
  _cli();
}
