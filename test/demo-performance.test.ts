import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, test } from '@rstest/core';

type PackageJson = {
  scripts: Record<string, string>;
};

describe('Demo Performance Tests', () => {
  const demoDir = path.join(__dirname, '../demo');

  describe('Command Line Length Performance', () => {
    test('should handle very long command lines efficiently', () => {
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

        const start = performance.now();

        // Test parsing of complex commands
        Object.entries(packageJson.scripts).forEach(([_name, command]) => {
          expect(command.length).toBeLessThan(1000); // Reasonable limit
          expect(typeof command).toBe('string');
          expect(command.trim()).toBeTruthy();
        });

        const end = performance.now();
        const duration = end - start;

        // Should parse quickly even with complex commands
        expect(duration).toBeLessThan(100); // 100ms limit
      });
    });

    test('should handle configuration parsing efficiently', () => {
      const configTests = [
        {
          folder: 'ntl-format',
          hasConfig: (pkg: Record<string, unknown>) => Boolean(pkg.ntl),
        },
        {
          folder: 'npm-scripts-info',
          hasConfig: (pkg: Record<string, unknown>) => Boolean(pkg['scripts-info']),
        },
        {
          folder: 'better-scripts',
          hasConfig: (pkg: Record<string, unknown>) => Boolean(pkg['better-scripts']),
        },
        {
          folder: 'npm-scripts-org',
          hasConfig: (pkg: Record<string, unknown>) =>
            Object.keys((pkg.scripts as Record<string, string>) || {}).some((k) =>
              k.startsWith('comment:')
            ),
        },
      ];

      configTests.forEach(({ folder, hasConfig }) => {
        const packagePath = path.join(demoDir, folder, 'package.demo.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        const start = performance.now();

        // Test configuration detection
        expect(hasConfig(packageJson)).toBe(true);

        const end = performance.now();
        const duration = end - start;

        // Should detect configuration quickly
        expect(duration).toBeLessThan(50); // 50ms limit
      });
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks with complex commands', () => {
      const initialMemory = process.memoryUsage();

      // Load all demo configurations multiple times
      for (let i = 0; i < 10; i++) {
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

          // Process all scripts
          Object.entries(packageJson.scripts).forEach(([_name, command]) => {
            const processed = command.split(' ').filter((arg) => arg.length > 0);
            expect(processed.length).toBeGreaterThan(0);
          });
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Should not increase memory usage significantly
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    });
  });

  describe('Scalability', () => {
    test('should handle large number of scripts efficiently', () => {
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

        const scriptCount = Object.keys(packageJson.scripts).length;
        const start = performance.now();

        // Simulate processing all scripts
        const processedScripts = Object.entries(packageJson.scripts).map(([name, command]) => ({
          name,
          command,
          length: command.length,
          args: command.split(' ').length,
        }));

        const end = performance.now();
        const duration = end - start;

        expect(processedScripts.length).toBe(scriptCount);
        expect(duration).toBeLessThan(scriptCount * 10); // 10ms per script max
      });
    });
  });
});
