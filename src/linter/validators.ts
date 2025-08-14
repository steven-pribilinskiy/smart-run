import type {
  LinterConfig,
  LinterIssue,
  PackageJsonForLinter,
  PackageMeta,
  ScriptConfig,
  ScriptGroup,
} from './types.js';

export function validateStructure(
  config: PackageMeta,
  cfg: LinterConfig,
  add: (i: LinterIssue) => void
): void {
  const hasScriptGroups = !!config.scriptGroups?.length;
  const hasScripts = !!config.scripts?.length;
  if (cfg.requireScriptGroups && !hasScriptGroups) {
    add(issue('error', 'required-fields', 'scriptGroups are required by configuration'));
    return;
  }
  if (!hasScriptGroups && !hasScripts) {
    add(issue('error', 'required-fields', 'Must have either scriptGroups or scripts field'));
    return;
  }
  if (hasScriptGroups) {
    if (!Array.isArray(config.scriptGroups)) {
      add(issue('error', 'valid-structure', 'scriptGroups must be an array'));
      return;
    }
    config.scriptGroups.forEach((group, idx) => {
      if (!group.name) add(issue('error', 'required-fields', `Group ${idx} missing name field`));
      if (!Array.isArray(group.scripts)) {
        add(issue('error', 'valid-structure', `Group "${group.name}" must have scripts array`));
        return;
      }
      group.scripts.forEach((s, sIdx) =>
        validateScript(s, sIdx, `group "${group.name}"`, config, cfg, add)
      );
    });
  }
  if (hasScripts) {
    if (!Array.isArray(config.scripts)) {
      add(issue('error', 'valid-structure', 'scripts must be an array'));
      return;
    }
    config.scripts.forEach((s, sIdx) => validateScript(s, sIdx, 'root scripts', config, cfg, add));
  }
}

export function validateAgainstPackage(
  config: PackageMeta,
  pkg: PackageJsonForLinter,
  add: (i: LinterIssue) => void
): void {
  if (!pkg.scripts) {
    add(issue('warning', 'missing-scripts', 'No scripts found in package.json'));
    return;
  }
  const packageScripts = new Set(Object.keys(pkg.scripts));
  const configScripts = new Set<string>();
  const duplicateScripts = new Set<string>();
  const allScripts = [
    ...(config.scriptGroups?.flatMap((g) => g.scripts) || []),
    ...(config.scripts || []),
  ];
  allScripts.forEach((s) => {
    if (configScripts.has(s.key)) duplicateScripts.add(s.key);
    configScripts.add(s.key);
  });
  duplicateScripts.forEach((k) =>
    add(issue('error', 'duplicate-scripts', `Script "${k}" defined multiple times`))
  );
  configScripts.forEach((k) => {
    if (!packageScripts.has(k))
      add(issue('warning', 'unused-scripts', `Script "${k}" documented but not in package.json`));
  });
  packageScripts.forEach((k) => {
    if (!configScripts.has(k))
      add(issue('warning', 'missing-scripts', `Script "${k}" in package.json but not documented`));
  });
}

export function validateContent(config: PackageMeta, add: (i: LinterIssue) => void): void {
  config.scriptGroups?.forEach((group) => {
    if (group.name && group.name.length > 50)
      add(issue('info', 'title-format', `Group name "${group.name}" is very long`));
    const emojis = group.scripts?.map((s) => s.emoji).filter(Boolean) || [];
    if (emojis.length > 0 && emojis.length < (group.scripts?.length || 0))
      add(
        issue('warning', 'emoji-consistency', `Group "${group.name}" has inconsistent emoji usage`)
      );
    validateScriptContent(group.scripts, add);
  });
  if (config.scripts) validateScriptContent(config.scripts, add);
}

export function validateBestPractices(config: PackageMeta, add: (i: LinterIssue) => void): void {
  const total =
    (config.scriptGroups?.flatMap((g) => g.scripts) || []).length + (config.scripts || []).length;
  if (total > 5 && !config.scriptGroups?.length)
    add(
      issue(
        'warning',
        'script-organization',
        'Consider organizing scripts into groups for better maintainability'
      )
    );
  const all = [
    ...(config.scriptGroups?.flatMap((g) => g.scripts) || []),
    ...(config.scripts || []),
  ];
  const naming = { kebab: 0, camel: 0, snake: 0, colon: 0 };
  all.forEach((s) => {
    if (s.key.includes('-')) naming.kebab++;
    if (/[a-z][A-Z]/.test(s.key)) naming.camel++;
    if (s.key.includes('_')) naming.snake++;
    if (s.key.includes(':')) naming.colon++;
  });
  const consistency =
    all.length > 0
      ? Math.max(naming.kebab, naming.camel, naming.snake, naming.colon) / all.length
      : 0;
  if (consistency < 0.8 && all.length > 3)
    add(
      issue('info', 'naming-consistency', 'Consider using consistent naming convention for scripts')
    );
}

export function validateSecurity(pkg: PackageJsonForLinter, add: (i: LinterIssue) => void): void {
  const dangerous = [
    { pattern: /rm\s+-rf\s+\//, message: 'Dangerous recursive delete command' },
    { pattern: /sudo\s+/, message: 'Avoid using sudo in scripts' },
    { pattern: />\s*\/dev\/null\s*2>&1/, message: 'Silencing all output may hide errors' },
  ];
  const scripts = pkg.scripts || {};
  Object.entries(scripts).forEach(([name, cmd]) => {
    dangerous.forEach(({ pattern, message }) => {
      if (pattern.test(cmd))
        add(issue('warning', 'script-security', `Script "${name}": ${message}`));
    });
  });
}

function validateScript(
  script: ScriptConfig,
  idx: number,
  context: string,
  config: PackageMeta,
  cfg: LinterConfig,
  add: (i: LinterIssue) => void
): void {
  if (!script.key)
    add(issue('error', 'required-fields', `Script ${idx} in ${context} missing key`));
  if (cfg.requireDescription && !script.description)
    add(issue('error', 'required-fields', `Script "${script.key}" missing required description`));
  else if (!script.description)
    add(issue('warning', 'script-descriptions', `Script "${script.key}" missing description`));
  if (cfg.requireEmoji && !script.emoji)
    add(issue('error', 'required-fields', `Script "${script.key}" missing required emoji`));
  if (cfg.requireTitle && !script.title) {
    add(issue('error', 'required-fields', `Script "${script.key}" missing required title`));
  }
}

function validateScriptContent(scripts: ScriptConfig[], add: (i: LinterIssue) => void): void {
  scripts.forEach((s) => {
    if (s.description) {
      if (s.description.length < 10)
        add(issue('info', 'description-length', `Script "${s.key}" description is very short`));
      else if (s.description.length > 100)
        add(issue('info', 'description-length', `Script "${s.key}" description is very long`));
    }
    if (s.title) {
      if (s.title === s.key)
        add(issue('info', 'title-format', `Script "${s.key}" title same as key`));
      if (s.title.length > 30)
        add(issue('info', 'title-format', `Script "${s.key}" title is very long`));
    }
    if (s.emoji) {
      if (s.emoji.length > 2)
        add(issue('warning', 'emoji-consistency', `Script "${s.key}" emoji appears invalid`));
    }
  });
}

function issue(level: 'error' | 'warning' | 'info', rule: string, message: string): LinterIssue {
  return { level, rule, message, line: null, ruleInfo: { level, message: 'Unknown rule' } };
}
