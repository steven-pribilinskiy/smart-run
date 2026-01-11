import * as fs from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { isInsideSmartRunRepo } from '../core/repo.js';
import type { ScriptGroup } from '../types.js';

export async function saveConfiguration(
  scriptGroups: ScriptGroup[],
  format: 'yaml' | 'json' | 'scriptsMeta',
  source: string
): Promise<void> {
  const config = { scriptGroups };
  const comment = `Smart-run configuration (migrated from ${source})`;
  switch (format) {
    case 'yaml': {
      const yamlContent = `# ${comment}\n${yaml.dump(config)}`;
      writeFileSync('package-meta.yaml', yamlContent);
      console.log('✅ Configuration saved to package-meta.yaml');
      break;
    }
    case 'json': {
      const jsonContent = JSON.stringify(config, null, 2);
      writeFileSync('package-meta.json', jsonContent);
      console.log('✅ Configuration saved to package-meta.json');
      break;
    }
    case 'scriptsMeta': {
      let packageJsonPath = 'package.json';
      if (!fs.existsSync(packageJsonPath)) {
        const demoPath = 'package.demo.json';
        if (isInsideSmartRunRepo() && fs.existsSync(demoPath)) packageJsonPath = demoPath;
      }
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.scriptsMeta = config;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Configuration saved to scriptsMeta field in package file');
      break;
    }
  }
}
