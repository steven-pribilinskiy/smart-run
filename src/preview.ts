import { existsSync, readFileSync } from 'node:fs';
import { prettifyCommands, shouldPrettifyCommand } from 'shiny-command-line';

/**
 * Show all scripts with enhanced formatting
 */
export async function runPreview(options: { disableColors?: boolean } = {}): Promise<void> {
  console.log('📋 Smart-run Script Preview\n');

  try {
    // Read package.json or package.demo.json
    let packagePath = 'package.json';
    if (!existsSync(packagePath)) {
      const demoPath = 'package.demo.json';
      const { isInsideSmartRunRepo } = await import('./index.js');
      if (isInsideSmartRunRepo() && existsSync(demoPath)) {
        packagePath = demoPath;
      }
    }
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const scripts = packageJson.scripts || {};

    // Filter out category headers and empty scripts
    const validScripts: Record<string, string> = {};
    for (const [key, value] of Object.entries(scripts)) {
      if (typeof value === 'string' && (!key.startsWith('\n#') || value !== '')) {
        validScripts[key] = value;
      }
    }

    const scriptCount = Object.keys(validScripts).length;
    if (scriptCount === 0) {
      console.log('❌ No scripts found in package file');
      return;
    }

    console.log(`📦 Found ${scriptCount} scripts:\n`);

    // Check if any scripts need formatting
    const scriptCommands = Object.values(validScripts);
    const shouldFormat = scriptCommands.some((cmd) => shouldPrettifyCommand(cmd));

    if (shouldFormat) {
      console.log('✨ Enhanced Script Preview:');
      console.log('═'.repeat(80));

      // Group scripts by complexity
      const complexScripts: Array<[string, string]> = [];
      const simpleScripts: Array<[string, string]> = [];

      for (const [script, command] of Object.entries(validScripts)) {
        if (shouldPrettifyCommand(command)) {
          complexScripts.push([script, command]);
        } else {
          simpleScripts.push([script, command]);
        }
      }

      // Show complex scripts with formatting
      if (complexScripts.length > 0) {
        console.log('\n🔧 Complex Scripts (enhanced formatting):');
        console.log('─'.repeat(60));

        for (const [script, command] of complexScripts) {
          console.log(`\n💎 ${script}:`);
          const formatted = prettifyCommands([command], {
            flagsOnNewLine: true,
            maxWidth: 70,
            indent: '  ',
            disableColors: options.disableColors || false,
          });
          console.log(`  ${formatted[0]}`);
        }
      }

      // Show simple scripts
      if (simpleScripts.length > 0) {
        console.log('\n🎯 Simple Scripts:');
        console.log('─'.repeat(60));

        for (const [script, command] of simpleScripts) {
          console.log(`\n🔹 ${script}:`);
          console.log(`  ${command}`);
        }
      }

      console.log('\n═'.repeat(80));
      console.log('\n💡 Tip: Use `smart-run --preview-cmd` to see formatting during execution');
      console.log('🚀 Run `smart-run` to start the interactive menu');
    } else {
      // All scripts are simple, show them in a clean list
      console.log('📋 All Scripts:');
      console.log('─'.repeat(60));

      for (const [script, command] of Object.entries(validScripts)) {
        console.log(`\n🔹 ${script}:`);
        console.log(`  ${command}`);
      }

      console.log('\n─'.repeat(60));
      console.log('\n🚀 Run `smart-run` to start the interactive menu');
    }
  } catch (error) {
    console.error(
      '❌ Error reading package.json:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
