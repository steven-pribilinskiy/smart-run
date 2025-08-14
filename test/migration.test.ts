import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import yaml from 'js-yaml';
import {
  convertBetterScriptsToSmartRun,
  convertNpmScriptsInfoToSmartRun,
  convertNpmScriptsOrgToSmartRun,
  convertNtlToSmartRun,
  detectConfigurationType,
  migrateToSmartRun,
} from '../src/migration.js';

describe('Migration Tests', () => {
  const demoDir = path.join(__dirname, '../demo');

  describe('Configuration Type Detection', () => {
    test('should detect ntl configuration', () => {
      const packageJson = {
        scripts: { start: 'echo test' },
        ntl: { descriptions: { start: 'Test script' } },
      };
      expect(detectConfigurationType(packageJson)).toBe('ntl');
    });

    test('should detect npm-scripts-info configuration', () => {
      const packageJson = {
        scripts: { start: 'echo test' },
        'scripts-info': { start: 'Test script' },
      };
      expect(detectConfigurationType(packageJson)).toBe('npm-scripts-info');
    });

    test('should detect better-scripts configuration', () => {
      const packageJson = {
        scripts: { scripts: 'better-scripts' },
        'better-scripts': { start: 'echo test' },
      };
      expect(detectConfigurationType(packageJson)).toBe('better-scripts');
    });

    test('should detect npm-scripts-org configuration', () => {
      const packageJson = {
        scripts: {
          'comment:dev': '# DEVELOPMENT',
          start: 'echo test',
        },
      };
      expect(detectConfigurationType(packageJson)).toBe('npm-scripts-org');
    });

    test('should detect basic scripts configuration', () => {
      const packageJson = {
        scripts: { start: 'echo test' },
      };
      expect(detectConfigurationType(packageJson)).toBe('basic');
    });

    test('should prioritize configurations correctly', () => {
      const packageJson = {
        scripts: {
          scripts: 'better-scripts',
          'comment:dev': '# DEVELOPMENT',
          start: 'echo test',
        },
        ntl: { descriptions: { start: 'Test script' } },
        'scripts-info': { start: 'Test script' },
        'better-scripts': { start: 'echo test' },
      };
      // Should prioritize ntl over others
      expect(detectConfigurationType(packageJson)).toBe('ntl');
    });
  });

  describe('NTL Migration', () => {
    test('should convert ntl format to smart-run format', () => {
      const packageJson = {
        scripts: {
          start: 'webpack serve --hot',
          build: 'webpack --mode production',
          test: 'jest',
        },
        ntl: {
          descriptions: {
            start: '🚀 Start development server',
            build: '🏗️ Build for production',
            test: '🧪 Run tests',
          },
        },
      };

      const converted = convertNtlToSmartRun(packageJson);

      expect(converted.scripts.start.description).toBe('🚀 Start development server');
      expect(converted.scripts.build.description).toBe('🏗️ Build for production');
      expect(converted.scripts.test.description).toBe('🧪 Run tests');

      // Should extract emojis
      expect(converted.scripts.start.emoji).toBe('🚀');
      expect(converted.scripts.build.emoji).toBe('🏗️');
      expect(converted.scripts.test.emoji).toBe('🧪');
    });

    test('should handle ntl without emojis', () => {
      const packageJson = {
        scripts: { start: 'npm start' },
        ntl: { descriptions: { start: 'Start the application' } },
      };

      const converted = convertNtlToSmartRun(packageJson);

      expect(converted.scripts.start.description).toBe('Start the application');
      expect(converted.scripts.start.emoji).toBeUndefined();
    });

    test('should migrate real ntl-format demo', () => {
      const packagePath = path.join(demoDir, 'external-formats/ntl-format/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const converted = convertNtlToSmartRun(packageJson);

      expect(converted.scripts).toBeDefined();
      expect(converted.scripts.start).toBeDefined();
      expect(converted.scripts.start.description).toContain('🚀');
      expect(converted.scripts.start.emoji).toBe('🚀');

      // Should have all scripts from original
      Object.keys(packageJson.scripts).forEach((scriptName) => {
        expect(converted.scripts[scriptName]).toBeDefined();
        expect(converted.scripts[scriptName].description).toBeDefined();
      });
    });
  });

  describe('NPM Scripts Info Migration', () => {
    test('should convert npm-scripts-info format to smart-run format', () => {
      const packageJson = {
        scripts: {
          start: 'webpack serve --hot',
          build: 'webpack --mode production',
          test: 'jest',
        },
        'scripts-info': {
          start: '🚀 Start development server',
          build: '🏗️ Build for production',
          test: '🧪 Run tests',
        },
      };

      const converted = convertNpmScriptsInfoToSmartRun(packageJson);

      expect(converted.scripts.start.description).toBe('🚀 Start development server');
      expect(converted.scripts.build.description).toBe('🏗️ Build for production');
      expect(converted.scripts.test.description).toBe('🧪 Run tests');

      // Should extract emojis
      expect(converted.scripts.start.emoji).toBe('🚀');
      expect(converted.scripts.build.emoji).toBe('🏗️');
      expect(converted.scripts.test.emoji).toBe('🧪');
    });

    test('should migrate real npm-scripts-info demo', () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-info/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const converted = convertNpmScriptsInfoToSmartRun(packageJson);

      expect(converted.scripts).toBeDefined();
      expect(converted.scripts.start).toBeDefined();
      expect(converted.scripts.start.description).toContain('🚀');
      expect(converted.scripts.start.emoji).toBe('🚀');

      // Should have all scripts from original
      Object.keys(packageJson.scripts).forEach((scriptName) => {
        expect(converted.scripts[scriptName]).toBeDefined();
        expect(converted.scripts[scriptName].description).toBeDefined();
      });
    });
  });

  describe('Better Scripts Migration', () => {
    test('should convert better-scripts object format', () => {
      const packageJson = {
        scripts: { scripts: 'better-scripts' },
        'better-scripts': {
          start: {
            command: 'webpack serve --hot',
            description: 'Start development server',
            alias: '🚀 Dev Server',
          },
          build: {
            command: 'webpack --mode production',
            description: 'Build for production',
            alias: '🏗️ Build',
          },
        },
      };

      const converted = convertBetterScriptsToSmartRun(packageJson);

      expect(converted.scripts.start.description).toBe('Start development server');
      expect(converted.scripts.start.title).toBe('Dev Server');
      expect(converted.scripts.start.emoji).toBe('🚀');

      expect(converted.scripts.build.description).toBe('Build for production');
      expect(converted.scripts.build.title).toBe('Build');
      expect(converted.scripts.build.emoji).toBe('🏗️');
    });

    test('should convert better-scripts array format', () => {
      const packageJson = {
        scripts: { scripts: 'better-scripts' },
        'better-scripts': {
          test: ['jest --coverage', 'Run tests with coverage'],
          lint: ['eslint src/', 'Lint source code'],
        },
      };

      const converted = convertBetterScriptsToSmartRun(packageJson);

      expect(converted.scripts.test.description).toBe('Run tests with coverage');
      expect(converted.scripts.lint.description).toBe('Lint source code');
    });

    test('should convert better-scripts string format', () => {
      const packageJson = {
        scripts: { scripts: 'better-scripts' },
        'better-scripts': {
          clean: 'rimraf dist',
          docs: 'typedoc src',
        },
      };

      const converted = convertBetterScriptsToSmartRun(packageJson);

      expect(converted.scripts.clean.description).toBe('rimraf dist');
      expect(converted.scripts.docs.description).toBe('typedoc src');
    });

    test('should migrate real better-scripts demo', () => {
      const packagePath = path.join(demoDir, 'external-formats/better-scripts/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const converted = convertBetterScriptsToSmartRun(packageJson);

      expect(converted.scripts).toBeDefined();
      expect(converted.scripts.start).toBeDefined();
      expect(converted.scripts.start.title).toBe('Dev Server');
      expect(converted.scripts.start.emoji).toBe('🚀');

      // Should handle mixed formats
      expect(converted.scripts.test).toBeDefined();
      expect(converted.scripts.clean).toBeDefined();
    });
  });

  describe('NPM Scripts Organization Migration', () => {
    test('should convert npm-scripts-org format to smart-run format', () => {
      const packageJson = {
        scripts: {
          'comment:dev': '# DEVELOPMENT',
          start: 'webpack serve',
          build: 'webpack --mode production',
          'comment:test': '# TESTING',
          test: 'jest',
          'test:watch': 'jest --watch',
        },
      };

      const converted = convertNpmScriptsOrgToSmartRun(packageJson);

      expect(converted.scriptGroups).toBeDefined();
      expect(converted.scriptGroups.length).toBeGreaterThan(0);

      // Should group scripts properly
      const devGroup = converted.scriptGroups.find((g) => g.name.includes('🛠️ DEVELOPMENT'));
      expect(devGroup).toBeDefined();
      expect(devGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'start' }));
      expect(devGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'build' }));

      const testGroup = converted.scriptGroups.find((g) => g.name.includes('TESTING'));
      expect(testGroup).toBeDefined();
      expect(testGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'test' }));
      expect(testGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'test:watch' }));
    });

    test('should migrate real npm-scripts-org demo', () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-org/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const converted = convertNpmScriptsOrgToSmartRun(packageJson);

      expect(converted.scriptGroups).toBeDefined();
      expect(converted.scriptGroups.length).toBeGreaterThan(0);

      // Should have expected groups
      const groupNames = converted.scriptGroups.map((g) => g.name);
      expect(groupNames).toContain('🛠️ DEVELOPMENT SCRIPTS');
      expect(groupNames).toContain('🧪 TESTING SCRIPTS');
      expect(groupNames).toContain('✨ CODE QUALITY SCRIPTS');
    });
  });

  describe('Full Migration Workflow', () => {
    test('should migrate all demo configurations', () => {
      const demos = [
        { folder: 'external-formats/ntl-format', expectedType: 'ntl' },
        { folder: 'external-formats/npm-scripts-info', expectedType: 'npm-scripts-info' },
        { folder: 'external-formats/better-scripts', expectedType: 'better-scripts' },
        { folder: 'external-formats/npm-scripts-org', expectedType: 'npm-scripts-org' },
        { folder: 'zero-config/basic-scripts', expectedType: 'basic' },
      ];

      demos.forEach(({ folder, expectedType }) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Should detect correct type
        expect(detectConfigurationType(packageJson)).toBe(expectedType);

        // Should migrate successfully
        const migrated = migrateToSmartRun(packageJson);
        expect(migrated).toBeDefined();

        if (expectedType === 'npm-scripts-org') {
          expect(migrated.scriptGroups).toBeDefined();
        } else {
          expect(migrated.scripts).toBeDefined();
        }
      });
    });

    test('should preserve complex command lines during migration', () => {
      const packagePath = path.join(demoDir, 'external-formats/ntl-format/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const migrated = migrateToSmartRun(packageJson);

      // Original complex commands should be preserved
      expect(packageJson.scripts.start.length).toBeGreaterThan(100);
      expect(packageJson.scripts.build.length).toBeGreaterThan(100);
      expect(packageJson.scripts.test.length).toBeGreaterThan(200);

      // Migration should add descriptions but preserve commands
      expect(migrated.scripts).toBeDefined();
      expect(migrated.scripts!.start.description).toBeDefined();
      expect(migrated.scripts!.build.description).toBeDefined();
      expect(migrated.scripts!.test.description).toBeDefined();
    });

    test('should handle edge cases in migration', () => {
      // Empty configuration
      const emptyConfig = { scripts: {} };
      const emptyMigrated = migrateToSmartRun(emptyConfig);
      expect(emptyMigrated.scripts).toEqual({});

      // Configuration with no descriptions
      const noDescConfig = {
        scripts: { start: 'echo test' },
        ntl: { descriptions: {} },
      };
      const noDescMigrated = migrateToSmartRun(noDescConfig);
      expect(noDescMigrated.scripts).toBeDefined();
      expect(noDescMigrated.scripts!.start).toBeDefined();
      expect(noDescMigrated.scripts!.start.description).toBeUndefined();

      // Invalid better-scripts format
      const invalidBetterConfig = {
        scripts: { scripts: 'better-scripts' },
        'better-scripts': { start: null },
      };
      expect(() => migrateToSmartRun(invalidBetterConfig)).not.toThrow();
    });
  });

  describe('Migration Output Validation', () => {
    test('migrated configurations should be valid smart-run format', () => {
      const packagePath = path.join(demoDir, 'external-formats/better-scripts/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const migrated = migrateToSmartRun(packageJson);

      // Should have valid structure
      expect(migrated.scripts).toBeDefined();
      expect(typeof migrated.scripts).toBe('object');

      // Each script should have valid properties
      Object.entries(migrated.scripts || {}).forEach(([key, script]) => {
        expect(typeof key).toBe('string');
        expect(typeof script).toBe('object');

        if (script.description) {
          expect(typeof script.description).toBe('string');
        }

        if (script.title) {
          expect(typeof script.title).toBe('string');
        }

        if (script.emoji) {
          expect(typeof script.emoji).toBe('string');
          expect(script.emoji.length).toBeLessThanOrEqual(8); // Allow for compound emojis
        }
      });
    });

    test('should generate valid package-meta.yaml output', () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-org/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const migrated = migrateToSmartRun(packageJson);

      // Should be valid YAML structure
      expect(() => {
        yaml.dump(migrated);
      }).not.toThrow();

      // Should have valid scriptGroups structure
      expect(migrated.scriptGroups).toBeDefined();
      expect(Array.isArray(migrated.scriptGroups)).toBe(true);

      migrated.scriptGroups?.forEach((group) => {
        expect(group.name).toBeDefined();
        expect(typeof group.name).toBe('string');
        expect(group.scripts).toBeDefined();
        expect(Array.isArray(group.scripts)).toBe(true);

        group.scripts.forEach((script) => {
          expect(script.key).toBeDefined();
          expect(typeof script.key).toBe('string');
          expect(script.description).toBeDefined();
          expect(typeof script.description).toBe('string');
        });
      });
    });
  });

  describe('Migration Performance', () => {
    test('should migrate large configurations efficiently', () => {
      // Create a large configuration
      const largeConfig = {
        scripts: {},
        'scripts-info': {},
      };

      // Add 100 scripts
      for (let i = 0; i < 100; i++) {
        (largeConfig.scripts as Record<string, string>)[`script${i}`] =
          `echo "Script ${i} with very long command line that simulates real world complexity"`;
        (largeConfig['scripts-info'] as Record<string, string>)[`script${i}`] =
          `Description for script ${i}`;
      }

      const start = performance.now();
      const migrated = migrateToSmartRun(largeConfig);
      const end = performance.now();

      // Should complete quickly
      expect(end - start).toBeLessThan(1000); // 1 second

      // Should have all scripts
      expect(Object.keys(migrated.scripts || {})).toHaveLength(100);
    });
  });
});
