import * as path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import { listScripts } from '../src/application/list.js';

describe('Monorepo Listing', () => {
  test('lists packages in a pnpm workspace', async () => {
    const originalCwd = process.cwd();
    const demoPath = path.join(__dirname, '../demo/monorepo-workspaces/monorepo-basic');
    process.chdir(demoPath);

    let output = '';
    const originalLog = console.log;
    console.log = (...args) => {
      output += `${args.join(' ')}\n`;
    };

    try {
      await listScripts({ json: true });
      const parsed = JSON.parse(output.trim());
      expect(Array.isArray(parsed)).toBe(true);
      const names = parsed.map((p: { name: string }) => p.name).sort();
      expect(names.includes('monorepo-app')).toBe(true);
      expect(names.includes('monorepo-lib')).toBe(true);
    } finally {
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });
});
