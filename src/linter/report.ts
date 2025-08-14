import type { LintReport } from './types.js';

export function formatReport(report: LintReport): string {
  const lines: string[] = [];
  lines.push('🔍 Smart-run Configuration Linter Report');
  lines.push('═'.repeat(50));
  const { summary } = report;
  if (summary.passed) lines.push('✅ Configuration passed all checks!');
  else {
    lines.push(`❌ Found ${summary.total} issues:`);
    if (summary.errors > 0) lines.push(`   • ${summary.errors} errors`);
    if (summary.warnings > 0) lines.push(`   • ${summary.warnings} warnings`);
    if (summary.info > 0) lines.push(`   • ${summary.info} info`);
  }
  lines.push('');
  (['error', 'warning', 'info'] as const).forEach((level) => {
    const levelIssues = report.issues.filter((i) => i.level === level);
    if (levelIssues.length === 0) return;
    const icon = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
    lines.push(`${icon} ${level.toUpperCase()} (${levelIssues.length})`);
    lines.push('─'.repeat(30));
    levelIssues.forEach((i) => lines.push(`  ${i.message}`));
    lines.push('');
  });
  if (summary.total > 0) {
    lines.push('💡 Recommendations:');
    lines.push('─'.repeat(30));
    lines.push('• Fix all errors before committing');
    lines.push('• Review warnings for best practices');
    lines.push('• Consider info suggestions for improvements');
    lines.push('');
  }
  return lines.join('\n');
}
