import fs from 'node:fs';
import { generateHookContent } from './content.js';
import { ensureHooksDirectory, isExecutable, isGitRepository, resolveHookPath } from './utils.js';
import type { HookResult, HookStatus, InstallOptions, UninstallOptions } from './types.js';

export class GitHooksManager {
  private hooksDir: string;
  private supportedHooks: string[];

  constructor(hooksDir = '.git/hooks') {
    this.hooksDir = hooksDir;
    this.supportedHooks = ['pre-commit', 'pre-push', 'commit-msg'];
  }

  install(options: InstallOptions = {}): HookResult[] {
    const { hooks = ['pre-commit'], force = false } = options;

    if (!isGitRepository()) throw new Error('Not a git repository');
    ensureHooksDirectory(this.hooksDir);

    const results: HookResult[] = [];
    hooks.forEach((hookName) => {
      if (!this.supportedHooks.includes(hookName)) {
        results.push({ hook: hookName, success: false, message: 'Unsupported hook type' });
        return;
      }
      try {
        const hookPath = resolveHookPath(this.hooksDir, hookName);
        if (fs.existsSync(hookPath) && !force) {
          const content = fs.readFileSync(hookPath, 'utf8');
          if (content.includes('smart-run-config-lint')) {
            throw new Error('Smart-run hook already installed');
          } else {
            throw new Error('Hook already exists (use --force to overwrite)');
          }
        }
        const hookContent = generateHookContent(hookName);
        fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
        results.push({ hook: hookName, success: true, message: 'Installed successfully' });
      } catch (error) {
        results.push({ hook: hookName, success: false, message: (error as Error).message });
      }
    });
    return results;
  }

  uninstall(options: UninstallOptions = {}): HookResult[] {
    const { hooks = ['pre-commit'] } = options;
    const results: HookResult[] = [];
    hooks.forEach((hookName) => {
      try {
        const hookPath = resolveHookPath(this.hooksDir, hookName);
        if (!fs.existsSync(hookPath)) throw new Error('Hook not found');
        const content = fs.readFileSync(hookPath, 'utf8');
        if (!content.includes('smart-run-config-lint')) throw new Error('Not a smart-run hook');
        fs.unlinkSync(hookPath);
        results.push({ hook: hookName, success: true, message: 'Uninstalled successfully' });
      } catch (error) {
        results.push({ hook: hookName, success: false, message: (error as Error).message });
      }
    });
    return results;
  }

  status(): Record<string, HookStatus> {
    const status: Record<string, HookStatus> = {};
    this.supportedHooks.forEach((hookName) => {
      const hookPath = resolveHookPath(this.hooksDir, hookName);
      const exists = fs.existsSync(hookPath);
      if (exists) {
        const content = fs.readFileSync(hookPath, 'utf8');
        status[hookName] = {
          exists: true,
          isSmartRunHook: content.includes('smart-run-config-lint'),
          executable: isExecutable(hookPath),
        };
      } else {
        status[hookName] = { exists: false, isSmartRunHook: false, executable: false };
      }
    });
    return status;
  }
}
