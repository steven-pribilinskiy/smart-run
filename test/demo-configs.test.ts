import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from '@rstest/core';
import yaml from 'js-yaml';
import {
  convertBetterScriptsToSmartRun,
  convertNpmScriptsInfoToSmartRun,
  convertNpmScriptsOrgToSmartRun,
  convertNtlToSmartRun,
  loadScriptsFromPackageJson,
  type PackageJson,
  type ScriptGroup,
} from '../src/migration.js';

type PackageMeta = {
  scriptGroups: ScriptGroup[];
};

describe('Demo Configuration Tests', () => {
  const demoDir = path.join(__dirname, '../demo');

  describe('Basic Scripts Demo', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'basic-scripts/package.demo.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    });

    test('should have correct package metadata', () => {
      const pkg = packageJson as PackageJson & {
        name?: string;
        description?: string;
        keywords?: string[];
      };
      expect(pkg.name).toBe('basic-scripts-demo');
      expect(pkg.description).toBe('Demo of smart-run with basic npm scripts (no configuration)');
      expect(pkg.keywords).toContain('smart-run');
      expect(pkg.keywords).toContain('basic-scripts');
    });

    test('should have complex command lines', () => {
      expect(packageJson.scripts!.start).toContain('webpack serve');
      expect(packageJson.scripts!.start).toContain('--hot --open --port 3000');
      expect(packageJson.scripts!.start.length).toBeGreaterThan(100);

      expect(packageJson.scripts!.build).toContain('webpack --config webpack.prod.js');
      expect(packageJson.scripts!.build).toContain('--optimization-minimize');
      expect(packageJson.scripts!.build.length).toBeGreaterThan(100);

      expect(packageJson.scripts!.test).toContain('jest --config jest.config.js');
      expect(packageJson.scripts!.test).toContain('--coverage');
      expect(packageJson.scripts!.test.length).toBeGreaterThan(200);
    });

    test('should load scripts correctly with smart-run', () => {
      const scripts = loadScriptsFromPackageJson(packageJson);
      expect(scripts).toHaveProperty('start');
      expect(scripts).toHaveProperty('build');
      expect(scripts).toHaveProperty('test');
      expect(scripts).toHaveProperty('deploy');
      expect(scripts).toHaveProperty('docker:build');

      // Should not have any descriptions since it's basic scripts
      expect(scripts.start.description).toBeUndefined();
      expect(scripts.build.description).toBeUndefined();
    });

    test('should have Docker and AWS deployment scripts', () => {
      expect(packageJson.scripts!['docker:build']).toContain('docker build');
      expect(packageJson.scripts!['docker:build']).toContain('--build-arg NODE_ENV=production');

      expect(packageJson.scripts!.deploy).toContain('aws s3 sync');
      expect(packageJson.scripts!.deploy).toContain('aws cloudfront create-invalidation');
    });

    test('should have comprehensive testing and quality scripts', () => {
      expect(packageJson.scripts!['test:watch']).toContain('--watch');
      expect(packageJson.scripts!.lint).toContain('eslint');
      expect(packageJson.scripts!.format).toContain('prettier');
      expect(packageJson.scripts!.typecheck).toContain('tsc --noEmit');
      expect(packageJson.scripts!.security).toContain('npm audit');
      expect(packageJson.scripts!.performance).toContain('lighthouse');
    });
  });

  describe('NTL Format Demo', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'ntl-format/package.demo.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    });

    test('should have ntl configuration', () => {
      expect(packageJson.ntl).toBeDefined();
      expect(packageJson.ntl!.descriptions).toBeDefined();
      expect(typeof packageJson.ntl!.descriptions).toBe('object');
    });

    test('should have emoji descriptions', () => {
      expect(packageJson.ntl!.descriptions!.start).toContain('🚀');
      expect(packageJson.ntl!.descriptions!.build).toContain('🏗️');
      expect(packageJson.ntl!.descriptions!.test).toContain('🧪');
      expect(packageJson.ntl!.descriptions!.lint).toContain('🔍');
      expect(packageJson.ntl!.descriptions!.format).toContain('✨');
    });

    test('should convert to smart-run format correctly', () => {
      const converted = convertNtlToSmartRun(packageJson);
      expect(converted.scripts).toHaveProperty('start');
      expect(converted.scripts.start.description).toContain('🚀');
      expect(converted.scripts.start.description).toContain('Start development server');

      expect(converted.scripts.build.description).toContain('🏗️');
      expect(converted.scripts.build.description).toContain('Build project for production');
    });

    test('should have all expected scripts with descriptions', () => {
      const descriptions = packageJson.ntl!.descriptions!;
      expect(descriptions).toHaveProperty('start');
      expect(descriptions).toHaveProperty('build');
      expect(descriptions).toHaveProperty('test');
      expect(descriptions).toHaveProperty('test:watch');
      expect(descriptions).toHaveProperty('lint');
      expect(descriptions).toHaveProperty('format');
      expect(descriptions).toHaveProperty('typecheck');
      expect(descriptions).toHaveProperty('deploy');
      expect(descriptions).toHaveProperty('docs');
      expect(descriptions).toHaveProperty('clean');
      expect(descriptions).toHaveProperty('docker:build');
      expect(descriptions).toHaveProperty('security');
      expect(descriptions).toHaveProperty('performance');
      expect(descriptions).toHaveProperty('e2e');
    });
  });

  describe('NPM Scripts Organization Demo', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'npm-scripts-org/package.demo.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    });

    test('should have comment-based organization', () => {
      expect(packageJson.scripts).toHaveProperty('comment:dev');
      expect(packageJson.scripts).toHaveProperty('comment:testing');
      expect(packageJson.scripts).toHaveProperty('comment:quality');
      expect(packageJson.scripts).toHaveProperty('comment:deploy');
      expect(packageJson.scripts).toHaveProperty('comment:utils');

      expect(packageJson.scripts!['comment:dev']).toBe('# DEVELOPMENT SCRIPTS');
      expect(packageJson.scripts!['comment:testing']).toBe('# TESTING SCRIPTS');
      expect(packageJson.scripts!['comment:quality']).toBe('# CODE QUALITY SCRIPTS');
    });

    test('should convert to smart-run format correctly', () => {
      const converted = convertNpmScriptsOrgToSmartRun(packageJson);
      expect(converted.scriptGroups).toBeDefined();
      expect(converted.scriptGroups.length).toBeGreaterThan(0);

      // Should have grouped scripts
      const devGroup = converted.scriptGroups.find((g) => g.name.includes('DEVELOPMENT'));
      expect(devGroup).toBeDefined();
      expect(devGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'start' }));
      expect(devGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'build' }));

      const testGroup = converted.scriptGroups.find((g) => g.name.includes('TESTING'));
      expect(testGroup).toBeDefined();
      expect(testGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'test' }));
      expect(testGroup!.scripts).toContainEqual(expect.objectContaining({ key: 'e2e' }));
    });

    test('should have proper script organization', () => {
      const scripts = Object.keys(packageJson.scripts!);

      // Development scripts should come after dev comment
      const devCommentIndex = scripts.indexOf('comment:dev');
      const startIndex = scripts.indexOf('start');
      const buildIndex = scripts.indexOf('build');

      expect(startIndex).toBeGreaterThan(devCommentIndex);
      expect(buildIndex).toBeGreaterThan(devCommentIndex);

      // Testing scripts should come after testing comment
      const testCommentIndex = scripts.indexOf('comment:testing');
      const testIndex = scripts.indexOf('test');
      const e2eIndex = scripts.indexOf('e2e');

      expect(testIndex).toBeGreaterThan(testCommentIndex);
      expect(e2eIndex).toBeGreaterThan(testCommentIndex);
    });
  });

  describe('NPM Scripts Info Demo', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'npm-scripts-info/package.demo.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    });

    test('should have scripts-info configuration', () => {
      expect(packageJson['scripts-info']).toBeDefined();
      expect(typeof packageJson['scripts-info']).toBe('object');
    });

    test('should have emoji descriptions in scripts-info', () => {
      const scriptsInfo = packageJson['scripts-info'] as Record<string, string>;
      expect(scriptsInfo.start).toContain('🚀');
      expect(scriptsInfo.build).toContain('🏗️');
      expect(scriptsInfo.test).toContain('🧪');
      expect(scriptsInfo.lint).toContain('🔍');
      expect(scriptsInfo.format).toContain('✨');
    });

    test('should convert to smart-run format correctly', () => {
      const converted = convertNpmScriptsInfoToSmartRun(packageJson);
      expect(converted.scripts).toHaveProperty('start');
      expect(converted.scripts.start.description).toContain('🚀');
      expect(converted.scripts.start.description).toContain('Start development server');

      expect(converted.scripts.build.description).toContain('🏗️');
      expect(converted.scripts.build.description).toContain('Build project for production');
    });

    test('should have descriptions for all scripts', () => {
      const scripts = Object.keys(packageJson.scripts!);
      const scriptsInfo = packageJson['scripts-info'] as Record<string, string>;

      scripts.forEach((scriptName) => {
        expect(scriptsInfo).toHaveProperty(scriptName);
        expect(scriptsInfo[scriptName]).toBeTruthy();
        expect(typeof scriptsInfo[scriptName]).toBe('string');
      });
    });
  });

  describe('Better Scripts Demo', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'better-scripts/package.demo.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
    });

    test('should have better-scripts configuration', () => {
      expect(packageJson.scripts!.scripts).toBe('better-scripts');
      expect(packageJson['better-scripts']).toBeDefined();
      expect(typeof packageJson['better-scripts']).toBe('object');
    });

    test('should have mixed format configurations', () => {
      const betterScripts = packageJson['better-scripts'] as Record<string, unknown>;

      // Object format with command, description, and alias
      const startScript = betterScripts.start as Record<string, string>;
      expect(startScript).toHaveProperty('command');
      expect(startScript).toHaveProperty('description');
      expect(startScript).toHaveProperty('alias');
      expect(startScript.alias).toContain('🚀');

      // Array format with command and description
      const testScript = betterScripts.test as [string, string];
      expect(Array.isArray(testScript)).toBe(true);
      expect(testScript).toHaveLength(2);
      expect(testScript[0]).toContain('jest');
      expect(testScript[1]).toContain('Run comprehensive test suite');

      // String format (simple command)
      expect(typeof betterScripts.clean).toBe('string');
      expect(betterScripts.clean as string).toContain('rimraf');
    });

    test('should convert to smart-run format correctly', () => {
      const converted = convertBetterScriptsToSmartRun(packageJson);
      expect(converted.scripts).toHaveProperty('start');
      expect(converted.scripts.start.description).toBeDefined();
      expect(converted.scripts.start.emoji).toBe('🚀');
      expect(converted.scripts.start.title).toBe('Dev Server');

      expect(converted.scripts.build.emoji).toBe('🏗️');
      expect(converted.scripts.build.title).toBe('Build');

      // Array format should be converted properly
      expect(converted.scripts.test.description).toContain('Run comprehensive test suite');
    });

    test('should handle alias emoji extraction', () => {
      const converted = convertBetterScriptsToSmartRun(packageJson);

      // Check that emojis are extracted from aliases
      expect(converted.scripts.start.emoji).toBe('🚀');
      expect(converted.scripts.build.emoji).toBe('🏗️');
      expect(converted.scripts.lint.emoji).toBe('🔍');
      expect(converted.scripts.typecheck.emoji).toBe('✅');
      expect(converted.scripts.deploy.emoji).toBe('🚀');
      expect(converted.scripts.docs.emoji).toBe('📚');
      expect(converted.scripts['docker:build'].emoji).toBe('🐳');
      expect(converted.scripts.e2e.emoji).toBe('🎭');
      expect(converted.scripts.performance.emoji).toBe('⚡');
    });
  });

  describe('Smart Run Native Demo', () => {
    let packageJson: PackageJson;
    let packageMeta: PackageMeta;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'smart-run-native/package.demo.json');
      const metaPath = path.join(demoDir, 'smart-run-native/package-meta.yaml');

      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
      packageMeta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;
    });

    test('should have package-meta.yaml configuration', () => {
      expect(packageMeta).toBeDefined();
      expect(packageMeta.scriptGroups).toBeDefined();
      expect(Array.isArray(packageMeta.scriptGroups)).toBe(true);
      expect(packageMeta.scriptGroups.length).toBeGreaterThan(0);
    });

    test('should have organized script groups', () => {
      const groupNames = packageMeta.scriptGroups.map((g) => g.name);
      expect(groupNames).toContain('�️ Development');
      expect(groupNames).toContain('🧪 Testing');
      expect(groupNames).toContain('✨ Code Quality');
      expect(groupNames).toContain('🚀 Deployment');
      expect(groupNames).toContain('📚 Documentation & Security');
      expect(groupNames).toContain('🧹 Maintenance');
    });

    test('should have scripts with descriptions', () => {
      const devGroup = packageMeta.scriptGroups.find((g) => g.name === '�️ Development');
      expect(devGroup!.scripts).toBeDefined();
      expect(devGroup!.scripts.length).toBeGreaterThan(0);

      const startScript = devGroup!.scripts.find(
        (s: { key: string; description?: string }) => s.key === 'start'
      );
      expect(startScript).toBeDefined();
      expect(startScript!.description).toBeDefined();
      expect(startScript!.description).toContain('development server');

      const buildScript = devGroup!.scripts.find(
        (s: { key: string; description?: string }) => s.key === 'build'
      );
      expect(buildScript).toBeDefined();
      expect(buildScript!.description).toBeDefined();
      expect(buildScript!.description).toContain('production');
    });

    test('should have matching scripts in package.demo.json', () => {
      const allScripts = packageMeta.scriptGroups.flatMap((g) => g.scripts);

      allScripts.forEach((script) => {
        expect(packageJson.scripts).toHaveProperty(script.key);
        expect(packageJson.scripts![script.key]).toBeTruthy();
        expect(packageJson.scripts![script.key].length).toBeGreaterThan(10);
      });
    });
  });

  describe('Enhanced Format Demo', () => {
    let packageJson: PackageJson;
    let packageMeta: PackageMeta;

    beforeAll(() => {
      const packagePath = path.join(demoDir, 'enhanced-format/package.demo.json');
      const metaPath = path.join(demoDir, 'enhanced-format/package-meta.yaml');

      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
      packageMeta = yaml.load(fs.readFileSync(metaPath, 'utf8')) as PackageMeta;
    });

    test('should have enhanced package-meta.yaml configuration', () => {
      expect(packageMeta).toBeDefined();
      expect(packageMeta.scriptGroups).toBeDefined();
      expect(Array.isArray(packageMeta.scriptGroups)).toBe(true);
    });

    test('should have scripts with title and emoji fields', () => {
      const devGroup = packageMeta.scriptGroups.find((g) => g.name === '🚀 Development');
      expect(devGroup).toBeDefined();

      const startScript = devGroup!.scripts.find(
        (s: { key: string; description?: string; title?: string; emoji?: string }) =>
          s.key === 'start'
      );
      expect(startScript).toBeDefined();
      expect(startScript!.title).toBe('Dev Server');
      expect(startScript!.emoji).toBe('🚀');
      expect(startScript!.description).toContain('development server');

      const buildScript = devGroup!.scripts.find(
        (s: { key: string; description?: string; title?: string; emoji?: string }) =>
          s.key === 'build'
      );
      expect(buildScript).toBeDefined();
      expect(buildScript!.title).toBe('Production Build');
      expect(buildScript!.emoji).toBe('🏗️');
      expect(buildScript!.description).toContain('production deployment');
    });

    test('should have comprehensive script coverage', () => {
      const allScripts = packageMeta.scriptGroups.flatMap((g) => g.scripts);
      const scriptKeys = allScripts.map((s) => s.key);

      expect(scriptKeys).toContain('start');
      expect(scriptKeys).toContain('build');
      expect(scriptKeys).toContain('test');
      expect(scriptKeys).toContain('test:watch');
      expect(scriptKeys).toContain('e2e');
      expect(scriptKeys).toContain('lint');
      expect(scriptKeys).toContain('format');
      expect(scriptKeys).toContain('typecheck');
      expect(scriptKeys).toContain('deploy');
      expect(scriptKeys).toContain('docker:build');
      expect(scriptKeys).toContain('docker:run');
      expect(scriptKeys).toContain('docs');
      expect(scriptKeys).toContain('security');
      expect(scriptKeys).toContain('performance');
      expect(scriptKeys).toContain('clean');
    });

    test('should have enhanced titles and emojis', () => {
      const allScripts = packageMeta.scriptGroups.flatMap((g) => g.scripts);

      allScripts.forEach((script) => {
        expect(script.title).toBeDefined();
        expect(script.emoji).toBeDefined();
        expect(script.description).toBeDefined();

        // Title should be different from key
        expect(script.title).not.toBe(script.key);

        // Emoji relaxed validation: allow up to 4 characters
        expect(script.emoji?.length || 0).toBeLessThanOrEqual(4);

        // Description should be descriptive
        expect(script.description.length).toBeGreaterThan(10);
      });
    });

    test('should have storybook script in enhanced format', () => {
      const devGroup = packageMeta.scriptGroups.find((g) => g.name === '🚀 Development');
      const storybookScript = devGroup!.scripts.find(
        (s: { key: string; description?: string; title?: string; emoji?: string }) =>
          s.key === 'storybook'
      );

      expect(storybookScript).toBeDefined();
      expect(storybookScript!.title).toBe('Storybook');
      expect(storybookScript!.emoji).toBe('📖');
      expect(storybookScript!.description).toContain('Storybook development server');

      // Should have corresponding script in package.demo.json
      expect(packageJson.scripts!.storybook).toBeDefined();
      expect(packageJson.scripts!.storybook).toContain('start-storybook');
    });
  });

  describe('Cross-Demo Validation', () => {
    // Helper to fetch command similar to other tests
    const getCommand = (
      pkg: PackageJson & { 'better-scripts'?: Record<string, unknown> },
      key: string
    ): string | undefined => {
      if (pkg.scripts && typeof pkg.scripts[key] === 'string') return pkg.scripts[key];
      const bs = pkg['better-scripts']?.[key];
      if (!bs) return undefined;
      if (typeof bs === 'string') return bs;
      if (Array.isArray(bs)) return typeof bs[0] === 'string' ? bs[0] : undefined;
      if (typeof bs === 'object' && bs !== null && (bs as Record<string, unknown>).command) {
        return (bs as Record<string, unknown>).command as string;
      }
      return undefined;
    };

    test('all demos should have consistent complex commands', () => {
      const demoFolders = [
        'basic-scripts',
        'ntl-format',
        'npm-scripts-org',
        'npm-scripts-info',
        'better-scripts',
        'smart-run-native',
        'enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        const startCmd = getCommand(packageJson, 'start');
        const buildCmd = getCommand(packageJson, 'build');
        const testCmd = getCommand(packageJson, 'test');
        expect(startCmd).toBeDefined();
        expect(startCmd!).toContain('webpack serve');
        expect(startCmd!).toContain('--hot');
        expect(startCmd!.length).toBeGreaterThan(100);
        expect(buildCmd).toBeDefined();
        expect(buildCmd!).toContain('webpack --config');
        expect(buildCmd!).toContain('--optimization-minimize');
        expect(buildCmd!.length).toBeGreaterThan(100);
        expect(testCmd).toBeDefined();
        expect(testCmd!).toContain('jest --config');
        expect(testCmd!).toContain('--coverage');
        expect(testCmd!.length).toBeGreaterThan(150);
      });
    });

    test('all demos should have AWS deployment script', () => {
      const demoFolders = [
        'basic-scripts',
        'ntl-format',
        'npm-scripts-org',
        'npm-scripts-info',
        'better-scripts',
        'smart-run-native',
        'enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        const deployCmd = getCommand(packageJson, 'deploy');
        expect(deployCmd).toBeDefined();
        expect(deployCmd!).toContain('aws s3 sync');
        expect(deployCmd!).toContain('aws cloudfront');
        expect(deployCmd!.length).toBeGreaterThan(150);
      });
    });

    test('all demos should have Docker build script', () => {
      const demoFolders = [
        'basic-scripts',
        'ntl-format',
        'npm-scripts-org',
        'npm-scripts-info',
        'better-scripts',
        'smart-run-native',
        'enhanced-format',
      ];

      demoFolders.forEach((folder) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;

        const dockerBuild = getCommand(packageJson, 'docker:build');
        expect(dockerBuild).toBeDefined();
        expect(dockerBuild!).toContain('docker build');
        expect(dockerBuild!).toContain('--build-arg');
        expect(dockerBuild!.length).toBeGreaterThan(100);
      });
    });
  });
});
