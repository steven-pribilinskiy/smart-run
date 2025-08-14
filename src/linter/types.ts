export type LinterRule = { level: 'error' | 'warning' | 'info'; message: string };
export type LinterIssue = {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line?: number | null;
  ruleInfo: LinterRule;
};
export type LinterConfig = {
  requireScriptGroups?: boolean;
  requireDescription?: boolean;
  requireEmoji?: boolean;
  requireTitle?: boolean;
  rules?: Record<string, { level: 'error' | 'warning' | 'info' }>;
};
export type ScriptConfig = { key: string; description?: string; title?: string; emoji?: string };
export type ScriptGroup = { name: string; scripts: ScriptConfig[] };
export type PackageMeta = {
  scriptGroups?: ScriptGroup[];
  scripts?: ScriptConfig[];
  titleizeKey?: boolean;
  linter?: LinterConfig;
};
export type PackageJsonForLinter = {
  scripts?: Record<string, string>;
  smartRun?: { linter?: LinterConfig };
  linter?: LinterConfig;
  [key: string]: unknown;
};
export type LintReport = {
  summary: { total: number; errors: number; warnings: number; info: number; passed: boolean };
  issues: LinterIssue[];
  rules: Record<string, LinterRule>;
};
