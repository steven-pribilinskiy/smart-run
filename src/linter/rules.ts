import type { LinterRule } from './types.js';

export function defaultRules(): Record<string, LinterRule> {
  return {
    'required-fields': { level: 'error', message: 'Missing required fields' },
    'valid-structure': { level: 'error', message: 'Invalid configuration structure' },
    'script-descriptions': {
      level: 'warning',
      message: 'Scripts should have meaningful descriptions',
    },
    'emoji-consistency': { level: 'warning', message: 'Emojis should be consistent within groups' },
    'title-format': { level: 'warning', message: 'Titles should be properly formatted' },
    'group-organization': { level: 'info', message: 'Scripts should be logically grouped' },
    'description-length': {
      level: 'info',
      message: 'Descriptions should be concise but informative',
    },
    'duplicate-scripts': { level: 'error', message: 'Duplicate script keys found' },
    'unused-scripts': { level: 'warning', message: 'Scripts defined but not in package.json' },
    'missing-scripts': { level: 'warning', message: 'Scripts in package.json but not documented' },
    'dangerous-commands': { level: 'error', message: 'Potentially dangerous commands detected' },
    'hardcoded-paths': { level: 'warning', message: 'Hardcoded paths detected' },
    'environment-variables': { level: 'info', message: 'Environment variables usage' },
  };
}
