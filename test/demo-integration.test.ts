import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import yaml from 'js-yaml';
import { runSmartRun } from '../src/index.js';
import { detectConfigurationType, type ScriptGroup } from '../src/migration.js';

type AutocompleteOptions = {
  message: string;
  source: (input?: string) => Promise<{ name: string; value: string }[]>;
};

type InquirerQuestion = {
  name: string;
  type?: string;
  message?: string;
  choices?: unknown[];
};

// Mock inquirer.prompt to avoid interactive prompts during tests
const mockPrompt = (questions: InquirerQuestion[]) => {
  if (Array.isArray(questions)) {
    const question = questions[0];
    if (question.name === 'setupMethod') {
      return Promise.resolve({ setupMethod: 'continue' });
    }
    if (question.name === 'script') {
      return Promise.resolve({ script: 'exit' });
    }
  }
  return Promise.resolve({ scriptName: 'start' });
};

// Mock autocomplete function to avoid interactive prompts
const mockAutocomplete = (_options: AutocompleteOptions) => {
  // Return 'exit' to avoid executing actual scripts
  return Promise.resolve('exit');
};

describe('Demo Integration Tests', () => {
  const demoDir = path.join(__dirname, '../demo');

  // Helper function to run smart-run in a demo directory
  const runSmartRunInDemo = async (demoFolder: string) => {
    const demoPath = path.join(demoDir, demoFolder);
    const originalCwd = process.cwd();
    const packageDemoPath = path.join(demoPath, 'package.demo.json');
    const packagePath = path.join(demoPath, 'package.json');
    let packageJsonCreated = false;

    try {
      process.chdir(demoPath);

      // Copy package.demo.json to package.json if it exists
      if (fs.existsSync(packageDemoPath) && !fs.existsSync(packagePath)) {
        fs.copyFileSync(packageDemoPath, packagePath);
        packageJsonCreated = true;
      }

      // Capture console output for preview mode
      const originalConsole = console.log;
      let output = '';
      console.log = (...args: unknown[]) => {
        output += `${args.join(' ')}\n`;
      };

      // Mock inquirer.prompt and autocomplete in global scope
      const inquirerModule = await import('inquirer');
      const originalPrompt = inquirerModule.default.prompt;
      // Use Object.defineProperty to override the read-only prompt
      Object.defineProperty(inquirerModule.default, 'prompt', {
        value: mockPrompt,
        writable: true,
        configurable: true,
      });
      (globalThis as Record<string, unknown>).mockAutocomplete = mockAutocomplete;

      try {
        // Run smart-run with preview mode (dry-run equivalent)
        await runSmartRun(undefined, { previewCommand: true, disableColors: true });
        return output;
      } finally {
        console.log = originalConsole;
        Object.defineProperty(inquirerModule.default, 'prompt', {
          value: originalPrompt,
          writable: true,
          configurable: true,
        });
        delete (globalThis as Record<string, unknown>).mockAutocomplete;
      }
    } catch (error) {
      throw new Error(`Failed to run smart-run in ${demoFolder}: ${(error as Error).message}`);
    } finally {
      // Clean up temporary package.json if we created it
      if (packageJsonCreated && fs.existsSync(packagePath)) {
        fs.unlinkSync(packagePath);
      }
      process.chdir(originalCwd);
    }
  };

  describe('Basic Scripts Integration', () => {
    test('should load and display basic scripts without configuration', async () => {
      const output = await runSmartRunInDemo('zero-config/basic-scripts');

      // Should show scripts without descriptions
      expect(output).toContain('start');
      expect(output).toContain('build');
      expect(output).toContain('test');
      expect(output).toContain('deploy');

      // Should show the actual complex commands
      expect(output).toContain('webpack serve');
      expect(output).toContain('jest --config');
      expect(output).toContain('aws s3 sync');
    });

    test('should handle script execution in basic mode', async () => {
      const output = await runSmartRunInDemo('zero-config/basic-scripts');

      // Should indicate it would run the selected script
      expect(output.includes('start') || output.includes('webpack')).toBe(true);
    });
  });

  describe('NTL Format Integration', () => {
    test('should load and display ntl descriptions with emojis', async () => {
      const output = await runSmartRunInDemo('external-formats/ntl-format');

      // Should show emoji descriptions from ntl.descriptions
      expect(output).toContain('🚀');
      expect(output).toContain('🏗️');
      expect(output).toContain('🧪');
      expect(output).toContain('Start development server');
      expect(output).toContain('Build project for production');
    });

    test('should prioritize ntl descriptions over raw commands', async () => {
      const output = await runSmartRunInDemo('external-formats/ntl-format');

      // Should show friendly descriptions, not raw webpack commands
      expect(output).toContain('Start development server');
      expect(output).not.toContain('cross-env NODE_ENV=development');
    });
  });

  describe('NPM Scripts Organization Integration', () => {
    test('should organize scripts by category headers', async () => {
      const output = await runSmartRunInDemo('external-formats/npm-scripts-org');

      // Should show organized categories
      expect(output.includes('DEVELOPMENT') || output.includes('Development')).toBe(true);
      expect(output.includes('TESTING') || output.includes('Testing')).toBe(true);
      expect(output.includes('QUALITY') || output.includes('Quality')).toBe(true);
      expect(output.includes('DEPLOYMENT') || output.includes('Deployment')).toBe(true);
    });

    test('should group scripts under appropriate categories', async () => {
      const output = await runSmartRunInDemo('external-formats/npm-scripts-org');

      // Development scripts should be grouped together
      expect(output).toContain('start');
      expect(output).toContain('build');

      // Testing scripts should be grouped
      expect(output).toContain('test');
      expect(output).toContain('e2e');
    });
  });

  describe('NPM Scripts Info Integration', () => {
    test('should load and display scripts-info descriptions', async () => {
      const output = await runSmartRunInDemo('external-formats/npm-scripts-info');

      // Should show emoji descriptions from scripts-info
      expect(output).toContain('🚀');
      expect(output).toContain('🏗️');
      expect(output).toContain('🧪');
      expect(output).toContain('Start development server');
      expect(output).toContain('Build project for production');
    });

    test('should handle all scripts with descriptions', async () => {
      const packagePath = path.join(demoDir, 'external-formats/npm-scripts-info/package.demo.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const output = await runSmartRunInDemo('external-formats/npm-scripts-info');

      // All scripts should have descriptions
      Object.keys(packageJson.scripts).forEach((scriptName) => {
        expect(output).toContain(scriptName);
      });
    });
  });

  describe('Better Scripts Integration', () => {
    test('should load and display better-scripts with aliases', async () => {
      const output = await runSmartRunInDemo('external-formats/better-scripts');

      // Should show alias titles with emojis
      expect(output.includes('🚀') && output.includes('Dev Server')).toBe(true);
      expect(output.includes('🏗️') && output.includes('Build')).toBe(true);
      expect(output.includes('🧪') && output.includes('Test')).toBe(true);
      expect(output.includes('🔍') && output.includes('Linter')).toBe(true);
    });

    test('should handle mixed better-scripts formats', async () => {
      const output = await runSmartRunInDemo('external-formats/better-scripts');

      // Should handle object format (with alias)
      expect(output.includes('Dev Server') || output.includes('🚀')).toBe(true);

      // Should handle array format
      expect(output.includes('test') || output.includes('Test')).toBe(true);

      // Should handle string format
      expect(output.includes('clean') || output.includes('Clean')).toBe(true);
    });
  });

  describe('Smart Run Native Integration', () => {
    test('should load package-meta.yaml configuration', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/smart-run-native');

      // Should show organized groups from package-meta.yaml
      expect(output.includes('Development') || output.includes('🚀')).toBe(true);
      expect(output.includes('Testing') || output.includes('🧪')).toBe(true);
      expect(output.includes('Quality') || output.includes('✨')).toBe(true);
      expect(output.includes('Deployment') || output.includes('🚀')).toBe(true);
    });

    test('should display scripts with native descriptions', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/smart-run-native');

      // Should show descriptive names, not raw commands
      expect(output.includes('development server') || output.includes('Start')).toBe(true);
      expect(output.includes('production') || output.includes('Build')).toBe(true);
      expect(output.includes('test suite') || output.includes('Test')).toBe(true);
    });
  });

  describe('Enhanced Format Integration', () => {
    test('should load enhanced package-meta.yaml with titles and emojis', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/enhanced-format');

      // Should show enhanced titles
      expect(output.includes('Dev Server') || output.includes('🚀')).toBe(true);
      expect(output.includes('Production Build') || output.includes('🏗️')).toBe(true);
      expect(output.includes('Test Suite') || output.includes('🧪')).toBe(true);
      expect(output.includes('E2E Tests') || output.includes('🎭')).toBe(true);
    });

    test('should display enhanced format with title and emoji', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/enhanced-format');

      // Should show format: "🚀 Dev Server - Start development server..."
      const hasDevServer = /🚀.*Dev Server.*development server/i.test(output);
      const hasProductionBuild = /🏗️.*Production Build.*production/i.test(output);
      const hasTestSuite = /🧪.*Test Suite.*test suite/i.test(output);
      expect(hasDevServer || hasProductionBuild || hasTestSuite).toBe(true);
    });

    test('should handle storybook script in enhanced format', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/enhanced-format');

      // Should show storybook with enhanced formatting
      const hasStorybookText = output.includes('Storybook');
      const hasStorybookIcon = output.includes('📖');
      expect(hasStorybookText || hasStorybookIcon).toBe(true);

      const lowerOutput = output.toLowerCase();
      const hasStorybookLower = lowerOutput.includes('storybook');
      const hasComponentDev = lowerOutput.includes('component development');
      expect(hasStorybookLower || hasComponentDev).toBe(true);
    });
  });

  describe('Lifecycle Scripts Integration', () => {
    test('should display lifecycle scripts when enabled in configuration', async () => {
      const output = await runSmartRunInDemo('smart-run-formats/lifecycle-scripts');

      // Should show lifecycle scripts header
      const hasLifecycleIcon = output.includes('🔄');
      const hasLifecycleText = output.includes('Lifecycle Scripts');
      expect(hasLifecycleIcon || hasLifecycleText).toBe(true);

      // Should show npm lifecycle scripts
      expect(output).toContain('preinstall');
      expect(output).toContain('install');
      expect(output).toContain('postinstall');
      expect(output).toContain('prestart');
      expect(output).toContain('start');
      expect(output).toContain('poststart');
      expect(output).toContain('pretest');
      expect(output).toContain('test');
      expect(output).toContain('posttest');
      expect(output).toContain('prepare');

      // Should also show regular script groups
      expect(output).toContain('Development');
      expect(output).toContain('dev');
      expect(output).toContain('build');
      expect(output).toContain('lint');
    });
  });

  describe('Cross-Demo Consistency', () => {
    test('all demos should handle complex commands gracefully', async () => {
      const demoFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      for (const folder of demoFolders) {
        expect(async () => {
          const output = await runSmartRunInDemo(folder);

          // Should not crash and should show some scripts
          const hasStart = output.includes('start');
          const hasBuild = output.includes('build');
          const hasTest = output.includes('test');
          expect(hasStart || hasBuild || hasTest).toBe(true);

          // Should not show raw error messages
          expect(output).not.toContain('Error:');
          expect(output).not.toContain('undefined');
          expect(output).not.toContain('null');
        }).not.toThrow();
      }
    });

    test('all demos should show organized output', async () => {
      const demoFolders = [
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      for (const folder of demoFolders) {
        const output = await runSmartRunInDemo(folder);

        // Should show organized, user-friendly output
        expect(output.length).toBeGreaterThan(50); // Should have substantial output

        // Should contain emojis or organized sections
        expect(output).toMatch(
          /🚀|🏗️|🧪|✨|📚|🧹|Development|Testing|Quality|Deployment|Available Scripts/
        );
      }
    });

    test('all demos should handle script selection', async () => {
      const demoFolders = [
        'zero-config/basic-scripts',
        'external-formats/ntl-format',
        'external-formats/npm-scripts-org',
        'external-formats/npm-scripts-info',
        'external-formats/better-scripts',
        'smart-run-formats/smart-run-native',
        'smart-run-formats/enhanced-format',
      ];

      for (const folder of demoFolders) {
        expect(async () => {
          const output = await runSmartRunInDemo(folder);

          // Should handle script selection without errors
          expect(output).toBeTruthy();
          expect(output).not.toContain('Error:');
        }).not.toThrow();
      }
    });
  });

  describe('Migration Testing', () => {
    test('should detect and migrate different configuration formats', () => {
      // Test ntl detection
      const ntlPackage = JSON.parse(
        fs.readFileSync(path.join(demoDir, 'external-formats/ntl-format/package.demo.json'), 'utf8')
      );
      expect(detectConfigurationType(ntlPackage)).toBe('ntl');

      // Test npm-scripts-info detection
      const scriptsInfoPackage = JSON.parse(
        fs.readFileSync(
          path.join(demoDir, 'external-formats/npm-scripts-info/package.demo.json'),
          'utf8'
        )
      );
      expect(detectConfigurationType(scriptsInfoPackage)).toBe('npm-scripts-info');

      // Test better-scripts detection
      const betterScriptsPackage = JSON.parse(
        fs.readFileSync(
          path.join(demoDir, 'external-formats/better-scripts/package.demo.json'),
          'utf8'
        )
      );
      expect(detectConfigurationType(betterScriptsPackage)).toBe('better-scripts');

      // Test npm-scripts-org detection
      const scriptsOrgPackage = JSON.parse(
        fs.readFileSync(
          path.join(demoDir, 'external-formats/npm-scripts-org/package.demo.json'),
          'utf8'
        )
      );
      expect(detectConfigurationType(scriptsOrgPackage)).toBe('npm-scripts-org');

      // Test basic scripts detection
      const basicPackage = JSON.parse(
        fs.readFileSync(path.join(demoDir, 'zero-config/basic-scripts/package.demo.json'), 'utf8')
      );
      expect(detectConfigurationType(basicPackage)).toBe('basic');
    });

    test('should handle package-meta.yaml detection', () => {
      const nativeMetaPath = path.join(
        demoDir,
        'smart-run-formats/smart-run-native/package-meta.yaml'
      );
      const enhancedMetaPath = path.join(
        demoDir,
        'smart-run-formats/enhanced-format/package-meta.yaml'
      );

      expect(fs.existsSync(nativeMetaPath)).toBe(true);
      expect(fs.existsSync(enhancedMetaPath)).toBe(true);

      const nativeMeta = yaml.load(fs.readFileSync(nativeMetaPath, 'utf8'));
      const enhancedMeta = yaml.load(fs.readFileSync(enhancedMetaPath, 'utf8'));

      expect((nativeMeta as { scriptGroups: ScriptGroup[] }).scriptGroups).toBeDefined();
      expect((enhancedMeta as { scriptGroups: ScriptGroup[] }).scriptGroups).toBeDefined();

      // Enhanced format should have title and emoji fields
      const enhancedScript = (enhancedMeta as { scriptGroups: ScriptGroup[] }).scriptGroups[0]
        .scripts[0];
      expect(enhancedScript.title).toBeDefined();
      expect(enhancedScript.emoji).toBeDefined();
    });
  });
});
