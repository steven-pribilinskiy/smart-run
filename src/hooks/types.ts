export type HookResult = {
  hook: string;
  success: boolean;
  message: string;
};

export type HookStatus = {
  exists: boolean;
  isSmartRunHook: boolean;
  executable: boolean;
};

export type HookManager = {
  name: string;
  detected: boolean;
  configFile: string;
  integration: string;
};

export type InstallOptions = {
  hooks?: string[];
  force?: boolean;
};

export type UninstallOptions = {
  hooks?: string[];
};
