import type { PackageJson } from '../../types.js';

type BetterScriptConfig =
  | string
  | [string, string?]
  | {
      command?: string;
      description?: string;
      alias?: string;
    };

export function convertBetterScriptsToSmartRun(pkg: PackageJson): {
  scripts: Record<string, { description: string; title?: string; emoji?: string }>;
} {
  const better = pkg['better-scripts'] || {};
  const scripts = pkg.scripts || {};
  const result: Record<string, { description: string; title?: string; emoji?: string }> = {};

  Object.keys(better).forEach((key) => {
    const config = better[key] as BetterScriptConfig;
    let description = scripts[key] || `Run ${key} script`;
    let title: string | undefined;
    let emoji: string | undefined;

    if (typeof config === 'string') {
      description = config;
    } else if (Array.isArray(config)) {
      if (config.length > 1) description = config[1] || config[0];
      else if (config.length === 1) description = config[0];
    } else if (typeof config === 'object' && config !== null) {
      if (config.description) description = config.description;
      else if (config.command) description = config.command;
      if (config.alias) {
        title = config.alias;
        const parts = config.alias.split(' ');
        if (parts.length > 1) {
          const first = parts[0];
          const hasEmoji = /[\p{Emoji}]/u.test(first) && first.length <= 4;
          if (hasEmoji) {
            emoji = first;
            title = parts.slice(1).join(' ').trim();
          }
        }
      }
    }

    const scriptConfig: { description: string; title?: string; emoji?: string } = { description };
    if (title) scriptConfig.title = title;
    if (emoji) scriptConfig.emoji = emoji;
    result[key] = scriptConfig;
  });

  return { scripts: result };
}
