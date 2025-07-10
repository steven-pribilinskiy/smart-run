import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import { runListScripts } from '../src/list-scripts.js';

describe('List Scripts Command', () => {
  test('should list scripts in table format', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    try {
      // Change to demo directory for testing
      const originalCwd = process.cwd();
      const demoPath = path.join(__dirname, '../demo/lifecycle-scripts');
      process.chdir(demoPath);

      await runListScripts({ disableColors: true });

      // Restore original working directory
      process.chdir(originalCwd);

      // Check that output contains expected elements
      expect(output).toContain('📋 Scripts Overview');
      expect(output).toContain('NAME');
      expect(output).toContain('TYPE');
      expect(output).toContain('GROUP');
      expect(output).toContain('SOURCE');
      expect(output).toContain('DESCRIPTION');

      // Check for lifecycle scripts
      expect(output).toContain('lifecycle');
      expect(output).toContain('regular');

      // Check for specific scripts
      expect(output).toContain('start');
      expect(output).toContain('test');
      expect(output).toContain('build');

      // Check summary
      expect(output).toContain('📊 Summary:');
      expect(output).toContain('scripts total');
    } finally {
      console.log = originalLog;
    }
  });

  test('should output JSON format when requested', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    try {
      // Change to demo directory for testing
      const originalCwd = process.cwd();
      const demoPath = path.join(__dirname, '../demo/basic-scripts');
      process.chdir(demoPath);

      await runListScripts({ json: true });

      // Restore original working directory
      process.chdir(originalCwd);

      // Should be valid JSON
      const jsonOutput = JSON.parse(output.trim());
      expect(Array.isArray(jsonOutput)).toBe(true);

      if (jsonOutput.length > 0) {
        const firstScript = jsonOutput[0];
        expect(firstScript).toHaveProperty('name');
        expect(firstScript).toHaveProperty('command');
        expect(firstScript).toHaveProperty('type');
        expect(firstScript).toHaveProperty('source');
        expect(['regular', 'lifecycle', 'missing']).toContain(firstScript.type);
      }
    } finally {
      console.log = originalLog;
    }
  });

  test('should handle projects with no scripts', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    // Mock getPackageJson to return empty scripts
    const mockPackageJson = { scripts: {} };

    try {
      // Create a temporary directory with empty package.json
      const tempDir = path.join(__dirname, '../temp-test');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(packageJsonPath, JSON.stringify(mockPackageJson, null, 2));

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      await runListScripts({ disableColors: true });

      // Restore original working directory
      process.chdir(originalCwd);

      // Clean up
      fs.unlinkSync(packageJsonPath);
      fs.rmdirSync(tempDir);

      // Should handle empty scripts gracefully
      expect(output).toContain('📋 Scripts Overview');
      expect(output).toContain('📊 Summary: 0 scripts total');
    } finally {
      console.log = originalLog;
    }
  });

  test('should categorize scripts correctly', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    try {
      // Change to demo directory that has organized scripts
      const originalCwd = process.cwd();
      const demoPath = path.join(__dirname, '../demo/lifecycle-scripts');
      process.chdir(demoPath);

      await runListScripts({ json: true });

      // Restore original working directory
      process.chdir(originalCwd);

      const jsonOutput = JSON.parse(output.trim());

      // Should have different types of scripts
      const types = jsonOutput.map((script: { type: string }) => script.type);
      const uniqueTypes = [...new Set(types)];

      expect(uniqueTypes.length).toBeGreaterThan(1);

      // Should have lifecycle scripts
      const lifecycleScripts = jsonOutput.filter(
        (script: { type: string }) => script.type === 'lifecycle'
      );
      expect(lifecycleScripts.length).toBeGreaterThan(0);

      // Lifecycle scripts should include standard npm hooks
      const lifecycleNames = lifecycleScripts.map((script: { name: string }) => script.name);
      expect(lifecycleNames).toContain('start');
      expect(lifecycleNames).toContain('test');
    } finally {
      console.log = originalLog;
    }
  });

  test('should show script sources correctly', async () => {
    // Mock console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    try {
      // Change to demo directory for testing
      const originalCwd = process.cwd();
      const demoPath = path.join(__dirname, '../demo/lifecycle-scripts');
      process.chdir(demoPath);

      await runListScripts({ json: true });

      // Restore original working directory
      process.chdir(originalCwd);

      const jsonOutput = JSON.parse(output.trim());

      // Should have different sources
      const sources = jsonOutput.map((script: { source: string }) => script.source);
      const uniqueSources = [...new Set(sources)];

      expect(uniqueSources.length).toBeGreaterThan(0);

      // Should include package-meta source (from package-meta.yaml)
      expect(uniqueSources).toContain('package-meta');
    } finally {
      console.log = originalLog;
    }
  });
});
