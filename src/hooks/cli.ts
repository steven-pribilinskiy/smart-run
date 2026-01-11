import { GitHooksManager } from './manager.js';

export function runHooksCli(argv: string[]): void {
  const args = argv.slice(2);
  const command = args[0];
  const hooks = new GitHooksManager();

  switch (command) {
    case 'install': {
      const results = hooks.install({
        hooks:
          args.slice(1).filter((a) => a !== '--force').length > 0
            ? args.slice(1).filter((a) => a !== '--force')
            : ['pre-commit'],
        force: args.includes('--force'),
      });
      console.log('🔧 Git hooks installation results:');
      for (const r of results) {
        console.log(`${r.success ? '✅' : '❌'} ${r.hook}: ${r.message}`);
      }
      if (results.some((r) => r.success)) {
        console.log('\n💡 Hooks installed! Configuration will be linted on git operations.');
      }
      break;
    }
    case 'uninstall': {
      const results = hooks.uninstall({
        hooks: args.slice(1).length > 0 ? args.slice(1) : ['pre-commit'],
      });
      console.log('🔧 Git hooks uninstallation results:');
      for (const r of results) {
        console.log(`${r.success ? '✅' : '❌'} ${r.hook}: ${r.message}`);
      }
      break;
    }
    case 'status': {
      const status = hooks.status();
      console.log('📊 Git hooks status:');
      Object.entries(status).forEach(([name, s]) => {
        const icon = s.isSmartRunHook ? '✅' : s.exists ? '⚠️' : '❌';
        const message = s.isSmartRunHook
          ? 'Smart-run hook installed'
          : s.exists
            ? 'Other hook exists'
            : 'Not installed';
        console.log(`${icon} ${name}: ${message}`);
      });
      break;
    }
    default:
      console.log(`
🔧 Smart-run Git Hooks Integration

Usage: npx smart-run hooks <command>

Commands:
  install [hook...]   Install git hooks (default: pre-commit)
  uninstall [hook...] Uninstall git hooks
  status              Show hook installation status

Options:
  --force             Force overwrite existing hooks
`);
  }
}
