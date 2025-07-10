import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Ensure demo directory exists
const demoDir = path.join(__dirname, '../demo');
if (!fs.existsSync(demoDir)) {
  throw new Error('Demo directory not found. Please run demo setup first.');
}

// Console output is now controlled via the silent option in runSmartRun

// Global test helpers
declare global {
  var testHelpers: {
    getDemoPath: (demoName: string) => string;
    readDemoPackageJson: (demoName: string) => Record<string, unknown>;
    readDemoPackageMeta: (demoName: string) => Record<string, unknown> | null;
  };
}

global.testHelpers = {
  getDemoPath: (demoName: string) => path.join(demoDir, demoName),
  readDemoPackageJson: (demoName: string) => {
    const packagePath = path.join(demoDir, demoName, 'package.demo.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  },
  readDemoPackageMeta: (demoName: string) => {
    const metaPath = path.join(demoDir, demoName, 'package-meta.yaml');
    if (fs.existsSync(metaPath)) {
      const result = yaml.load(fs.readFileSync(metaPath, 'utf8'));
      return result as Record<string, unknown>;
    }
    return null;
  },
};
