import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import yaml from 'js-yaml';

type PackageJson = {
  name: string;
  version: string;
  description: string;
  scripts: Record<string, string>;
  keywords: string[];
  author: string;
  license: string;
  ntl?: {
    descriptions: Record<string, string>;
  };
  'scripts-info'?: Record<string, string>;
  'better-scripts'?: Record<string, unknown>;
};

type ScriptConfig = {
  key: string;
  description: string;
  title?: string;
  emoji?: string;
};

type ScriptGroup = {
  name: string;
  scripts: ScriptConfig[];
};

type PackageMeta = {
  scriptGroups: ScriptGroup[];
};

describe('Demo Validation Tests', () => {
  const demoDir = path.join(__dirname, '../demo');

  describe('File Structure Validation', () => {
    test('all demo folders should exist with correct structure', () => {
      const expectedFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      expectedFolders.forEach((folder) => {
        const folderPath = path.join(demoDir, folder);
        expect(fs.existsSync(folderPath)).toBe(true);
        expect(fs.statSync(folderPath).isDirectory()).toBe(true);

        // Each folder should have package.demo.json
        const packagePath = path.join(folderPath, 'package.demo.json');
        expect(fs.existsSync(packagePath)).toBe(true);
      });
    });

    test('package-meta.yaml should exist for native demos', () => {
      const nativeDemos = [
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      nativeDemos.forEach((folder) => {
        const metaPath = path.join(demoDir, folder, 'package-meta.yaml');
        expect(fs.existsSync(metaPath)).toBe(true);

        // Should be valid YAML
        expect(() => {
          yaml.load(fs.readFileSync(metaPath, 'utf8'));
        }).not.toThrow();
      });
    });

    test('demo README should exist', () => {
      const readmePath = path.join(demoDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);

      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      expect(readmeContent).toContain('Demo');
      expect(readmeContent).toContain('smart-run');
    });
  });

  describe('Package.demo.json Validation', () => {
    test('all package.demo.json files should be valid JSON', () => {
      const demoFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');

        expect(() => {
          JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        }).not.toThrow();
      });
    });

    test('all package.demo.json files should have required fields', () => {
      const demoFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        expect(packageJson.name).toBeDefined();
        expect(packageJson.name).toContain('demo');
        expect(packageJson.version).toBeDefined();
        expect(packageJson.description).toBeDefined();
        expect(packageJson.scripts).toBeDefined();
        expect(packageJson.keywords).toBeDefined();
        expect(packageJson.keywords).toContain('smart-run');
        expect(packageJson.author).toBe('smart-run');
        expect(packageJson.license).toBe('MIT');
      });
    });

    test('all scripts should be valid commands', () => {
      const demoFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        Object.entries(packageJson.scripts).forEach(([name, command]) => {
          // Allow comment placeholders or empty commands for organization headers
          if (typeof command !== 'string' || command.trim() === '') {
            // Ensure that only comment-like script keys may have empty commands
            expect(name.startsWith('comment:') || name.startsWith('#')).toBe(true);
            return;
          }
          expect(typeof command).toBe('string');
          expect(command.trim()).toBeTruthy();
          expect(command).not.toContain('undefined');
          expect(command).not.toContain('null');

          // Should not have dangerous commands
          expect(command).not.toContain('rm -rf /');
          expect(command).not.toContain('sudo');
        });
      });
    });
  });

  describe('Configuration Format Validation', () => {
    test('ntl-format should have valid ntl configuration', () => {
      const packagePath = path.join(demoDir, 'external-formats/ntl-format/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

      expect(packageJson.ntl).toBeDefined();
      expect(packageJson.ntl!.descriptions).toBeDefined();
      expect(typeof packageJson.ntl!.descriptions).toBe('object');

      // All scripts should have descriptions
      Object.keys(packageJson.scripts).forEach((scriptName) => {
        expect(packageJson.ntl!.descriptions[scriptName]).toBeDefined();
        expect(typeof packageJson.ntl!.descriptions[scriptName]).toBe('string');
        expect(packageJson.ntl!.descriptions[scriptName].trim()).toBeTruthy();
      });
    });

    test('npm-scripts-info should have valid scripts-info configuration', () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-info/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

      expect(packageJson['scripts-info']).toBeDefined();
      expect(typeof packageJson['scripts-info']).toBe('object');

      // All scripts should have descriptions
      Object.keys(packageJson.scripts).forEach((scriptName) => {
        expect(packageJson['scripts-info']![scriptName]).toBeDefined();
        expect(typeof packageJson['scripts-info']![scriptName]).toBe('string');
        expect(packageJson['scripts-info']![scriptName].trim()).toBeTruthy();
      });
    });

    test('better-scripts should have valid better-scripts configuration', () => {
      const packagePath = path.join(demoDir, 'external-formats/better-scripts/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

      expect(packageJson.scripts.scripts).toBe('better-scripts');
      expect(packageJson['better-scripts']).toBeDefined();
      expect(typeof packageJson['better-scripts']).toBe('object');

      // Validate mixed formats
      Object.entries(packageJson['better-scripts']!).forEach(([_name, config]) => {
        if (typeof config === 'string') {
          // String format - should be valid command
          expect(config.trim()).toBeTruthy();
        } else if (Array.isArray(config)) {
          // Array format - should have command and description
          expect(config).toHaveLength(2);
          expect(typeof config[0]).toBe('string'); // command
          expect(typeof config[1]).toBe('string'); // description
        } else if (typeof config === 'object' && config !== null) {
          // Object format - should have command
          const configObj = config as Record<string, unknown>;
          expect(configObj.command).toBeDefined();
          expect(typeof configObj.command).toBe('string');
        }
      });
    });

    test('npm-scripts-org should have valid organization comments', () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-org/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

      const scriptNames = Object.keys(packageJson.scripts);
      const commentScripts = scriptNames.filter((name) => name.startsWith('comment:'));

      expect(commentScripts.length).toBeGreaterThan(0);

      commentScripts.forEach((commentScript) => {
        const commentValue = packageJson.scripts[commentScript];
        expect(commentValue).toMatch(/^# [A-Z\s]+$/);
      });
    });
  });

  describe('Package-meta.yaml Validation', () => {
    test('smart-run-native should have valid package-meta.yaml', () => {
      const metaPath = path.join(demoDir, 'smart-run-formats/smart-run-native/package-meta.yaml');
      const packageMeta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;

      expect(packageMeta.scriptGroups).toBeDefined();
      expect(Array.isArray(packageMeta.scriptGroups)).toBe(true);
      expect(packageMeta.scriptGroups.length).toBeGreaterThan(0);

      packageMeta.scriptGroups.forEach((group) => {
        expect(group.name).toBeDefined();
        expect(typeof group.name).toBe('string');
        expect(group.scripts).toBeDefined();
        expect(Array.isArray(group.scripts)).toBe(true);

        group.scripts.forEach((script) => {
          expect(script.key).toBeDefined();
          expect(script.description).toBeDefined();
          expect(typeof script.key).toBe('string');
          expect(typeof script.description).toBe('string');
        });
      });
    });

    test('enhanced-format should have valid enhanced package-meta.yaml', () => {
      const metaPath = path.join(demoDir, 'smart-run-formats/enhanced-format/package-meta.yaml');
      const packageMeta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;

      expect(packageMeta.scriptGroups).toBeDefined();
      expect(Array.isArray(packageMeta.scriptGroups)).toBe(true);

      packageMeta.scriptGroups.forEach((group) => {
        expect(group.name).toBeDefined();
        expect(group.scripts).toBeDefined();

        group.scripts.forEach((script) => {
          expect(script.key).toBeDefined();
          expect(script.description).toBeDefined();
          expect(script.title).toBeDefined();
          expect(script.emoji).toBeDefined();

          expect(typeof script.key).toBe('string');
          expect(typeof script.description).toBe('string');
          expect(typeof script.title).toBe('string');
          expect(typeof script.emoji).toBe('string');

          // Title should be different from key
          expect(script.title).not.toBe(script.key);

          // Emoji validations relaxed: allow up to 4 characters (handles complex emojis)
          if (script.emoji) {
            expect(script.emoji.length).toBeLessThanOrEqual(4);
          }
        });
      });
    });
  });

  describe('Command Complexity Validation', () => {
    const demoFolders = [
      'zero-config/basic-scripts',
      'external-formats/ntl-format',
      'external-formats/npm-scripts-org',
      'external-formats/npm-scripts-info',
      'external-formats/better-scripts',
      'smart-run-formats/smart-run-native',
      'smart-run-formats/enhanced-format',
    ];

    // Helper to fetch a command string regardless of config style
    const getCommand = (
      pkg: PackageJson & { 'better-scripts'?: Record<string, unknown> },
      key: string
    ): string | undefined => {
      // 1. Direct script
      if (pkg.scripts && typeof pkg.scripts[key] === 'string') {
        return pkg.scripts[key];
      }
      // 2. better-scripts format
      const bs = pkg['better-scripts']?.[key];
      if (!bs) return undefined;
      if (typeof bs === 'string') return bs;
      if (Array.isArray(bs)) return typeof bs[0] === 'string' ? bs[0] : undefined;
      if (typeof bs === 'object' && bs !== null && (bs as Record<string, unknown>).command) {
        return (bs as Record<string, unknown>).command as string;
      }
      return undefined;
    };

    test('all demos should have appropriately complex commands', () => {
      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        // Should have webpack commands
        const startCmd = getCommand(packageJson, 'start');
        const buildCmd = getCommand(packageJson, 'build');
        const testCmd = getCommand(packageJson, 'test');
        const deployCmd = getCommand(packageJson, 'deploy');
        const dockerBuildCmd = getCommand(packageJson, 'docker:build');

        expect(startCmd).toBeDefined();
        expect(startCmd!).toContain('webpack serve');
        expect(buildCmd).toBeDefined();
        expect(buildCmd!).toContain('webpack --config');

        // Should have jest commands
        expect(testCmd).toBeDefined();
        expect(testCmd!).toContain('jest --config');

        // Should have AWS deployment
        expect(deployCmd).toBeDefined();
        expect(deployCmd!).toContain('aws s3 sync');
        expect(deployCmd!).toContain('aws cloudfront');

        // Should have Docker commands
        expect(dockerBuildCmd).toBeDefined();
        expect(dockerBuildCmd!).toContain('docker build');

        // Commands should be sufficiently complex
        expect(startCmd!.length).toBeGreaterThan(100);
        expect(buildCmd!.length).toBeGreaterThan(100);
        expect(testCmd!.length).toBeGreaterThan(200);
        expect(deployCmd!.length).toBeGreaterThan(200);
      });
    });

    test('commands should contain realistic tools and flags', () => {
      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        const startCmd = getCommand(packageJson, 'start');
        const buildCmd = getCommand(packageJson, 'build');
        const testCmd = getCommand(packageJson, 'test');
        const lintCmd = getCommand(packageJson, 'lint');
        const typecheckCmd = getCommand(packageJson, 'typecheck');

        // Webpack flags
        expect(startCmd).toBeDefined();
        expect(startCmd!).toContain('--hot');
        expect(startCmd!).toContain('--open');
        expect(buildCmd).toBeDefined();
        expect(buildCmd!).toContain('--optimization-minimize');

        // Jest flags
        expect(testCmd).toBeDefined();
        expect(testCmd!).toContain('--coverage');
        expect(testCmd!).toContain('--ci');

        // ESLint flags
        expect(lintCmd).toBeDefined();
        expect(lintCmd!).toContain('--cache');
        expect(lintCmd!).toContain('--fix');

        // TypeScript flags
        expect(typecheckCmd).toBeDefined();
        expect(typecheckCmd!).toContain('--noEmit');
        expect(typecheckCmd!).toContain('--strict');
      });
    });
  });
});
