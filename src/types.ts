export type ScriptConfig = {
  key: string;
  description: string;
  title?: string;
  emoji?: string;
};

export type ScriptGroup = {
  name: string;
  scripts: ScriptConfig[];
};

export type PackageMeta = {
  scriptGroups: ScriptGroup[];
  includeLifecycleScripts?: boolean;
};

export type NtlDescriptions = {
  [scriptName: string]: string;
};

export type PackageJson = {
  scripts?: Record<string, string>;
  packageManager?: string;
  ntl?: {
    descriptions?: NtlDescriptions;
    runner?: string;
    [key: string]: unknown;
  };
  scriptsMeta?: {
    scriptGroups?: ScriptGroup[];
    includeLifecycleScripts?: boolean;
  };
  'scripts-info'?: Record<string, string>;
  'scripts-description'?: Record<string, string>;
  'better-scripts'?: Record<string, unknown>;
  smartRun?: {
    linter?: {
      requireScriptGroups?: boolean;
      requireDescription?: boolean;
      requireEmoji?: boolean;
      requireTitle?: boolean;
      rules?: Record<string, { level: 'error' | 'warning' | 'info' }>;
    };
  };
  linter?: {
    requireScriptGroups?: boolean;
    requireDescription?: boolean;
    requireEmoji?: boolean;
    requireTitle?: boolean;
    rules?: Record<string, { level: 'error' | 'warning' | 'info' }>;
  };
};

export type Choice = {
  name: string;
  value: string | null;
  disabled?: boolean | string;
};

export type AutocompleteChoice = {
  name: string;
  value: string | null;
  description?: string;
  disabled?: boolean | string;
};
