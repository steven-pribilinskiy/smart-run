import * as fs from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import { prettifyCommands, shouldPrettifyCommand } from 'shiny-command-line';
import { AIService } from './ai-service.js';
import { getPackageJson } from './index.js';

/**
 * Run AI-powered script analysis workflow
 */
export async function runAIAnalysis(options: { disableColors?: boolean } = {}): Promise<void> {
  console.log('🧠 Smart-run AI Analysis\n');

  const aiService = new AIService();
  const pkg = getPackageJson();
  const scripts = pkg.scripts || {};

  // Filter out category headers and empty scripts
  const validScripts: Record<string, string> = {};
  for (const [key, value] of Object.entries(scripts)) {
    if (typeof value === 'string' && (!key.startsWith('\n#') || value !== '')) {
      validScripts[key] = value;
    }
  }

  if (Object.keys(validScripts).length === 0) {
    console.log('❌ No scripts found in package.json');
    return;
  }

  console.log(`📋 Found ${Object.keys(validScripts).length} scripts to analyze:`);

  // Show enhanced script previews
  const scriptCommands = Object.values(validScripts);
  const shouldFormat = scriptCommands.some((cmd) => shouldPrettifyCommand(cmd));

  if (shouldFormat) {
    console.log('\n📋 Script Commands:');
    console.log('─'.repeat(60));
    for (const [script, command] of Object.entries(validScripts)) {
      console.log(`\n🔸 ${script}:`);
      if (shouldPrettifyCommand(command)) {
        const formatted = prettifyCommands([command], {
          flagsOnNewLine: true,
          maxWidth: 70,
          indent: '  ',
          disableColors: options.disableColors || false,
        });
        console.log(`  ${formatted[0]}`);
      } else {
        console.log(`  ${command}`);
      }
    }
    console.log('─'.repeat(60));
  } else {
    Object.keys(validScripts).forEach((script) => {
      console.log(`   - ${script}`);
    });
  }
  console.log();

  // Check for AI providers
  const providers = aiService.getAvailableProviders();

  if (providers.length === 0) {
    console.log('🔑 No AI API keys detected.');
    console.log('   Looking for: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY\n');
    console.log('💡 To use AI Analysis, you need to set up at least one of these API keys:');
    console.log('   1. Create a .env file in your project root with your API key(s)');
    console.log('      Example: OPENAI_API_KEY=sk-xxxxx');
    console.log('   2. Or set an environment variable before running smart-run:');
    console.log('      export OPENAI_API_KEY=sk-xxxxx');
    console.log('      smart-run ai\n');
    
    // Ask if user wants to continue with manual analysis
    const { continueMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'continueMethod',
        message: 'How would you like to proceed?',
        choices: [
          { name: '📋 Continue with Manual Prompt', value: 'manual' },
          { name: '❌ Cancel', value: 'cancel' },
        ],
      },
    ]);

    if (continueMethod === 'cancel') {
      console.log('👋 Analysis cancelled.');
      return;
    }
    
    await handleManualAnalysis(aiService, validScripts);
    return;
  }

  console.log(`🔑 Detected AI providers: ${providers.join(', ')}\n`);

  const { analysisMethod } = await inquirer.prompt([
    {
      type: 'list',
      name: 'analysisMethod',
      message: 'How would you like to analyze your scripts?',
      choices: [
        { name: '🧠 AI Analysis - Automatic analysis and grouping', value: 'ai' },
        { name: '📋 Manual Prompt - Generate prompt for external AI tools', value: 'manual' },
        { name: '❌ Cancel', value: 'cancel' },
      ],
    },
  ]);

  if (analysisMethod === 'cancel') {
    console.log('👋 Analysis cancelled.');
    return;
  }

  if (analysisMethod === 'manual') {
    await handleManualAnalysis(aiService, validScripts);
    return;
  }

  // AI Analysis workflow
  await handleAIAnalysis(aiService, validScripts);
}

/**
 * Handle AI-powered automatic analysis
 */
async function handleAIAnalysis(
  aiService: AIService,
  scripts: Record<string, string>
): Promise<void> {
  console.log('🔄 Analyzing scripts with AI...\n');

  try {
    const analysis = await aiService.analyzeScripts(scripts);

    console.log('✅ AI analysis complete!\n');
    console.log('📋 Generated configuration:');
    console.log('─'.repeat(50));

    // Display the analysis results
    for (const group of analysis.scriptGroups) {
      console.log(`\n📁 ${group.name}:`);
      for (const script of group.scripts) {
        console.log(`   [${script.key}] ${script.description}`);
      }
    }

    console.log(`\n${'─'.repeat(50)}`);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do with this configuration?',
        choices: [
          { name: '💾 Save as package-meta.yaml', value: 'save-yaml' },
          { name: '💾 Save as package-meta.json', value: 'save-json' },
          { name: '📦 Save to scriptsMeta in package.json', value: 'save-scripts-meta' },
          { name: '📋 Copy to clipboard', value: 'clipboard' },
          { name: '👁️  View YAML format', value: 'view' },
          { name: '❌ Discard', value: 'discard' },
        ],
      },
    ]);

    const yamlConfig = {
      scriptGroups: analysis.scriptGroups,
    };

    switch (action) {
      case 'save-yaml': {
        const yamlContent = `# Smart-run configuration (generated by AI)\n${yaml.dump(yamlConfig)}`;
        writeFileSync('package-meta.yaml', yamlContent);
        console.log('✅ Configuration saved to package-meta.yaml');
        console.log('🚀 You can now run: smart-run');
        break;
      }

      case 'save-json': {
        const jsonContent = JSON.stringify(yamlConfig, null, 2);
        writeFileSync('package-meta.json', jsonContent);
        console.log('✅ Configuration saved to package-meta.json');
        console.log('🚀 You can now run: smart-run');
        break;
      }

      case 'save-scripts-meta': {
        // Try package.json first, then package.demo.json for demo directories
        let packageJsonPath = 'package.json';
        if (!fs.existsSync(packageJsonPath)) {
          const demoPath = 'package.demo.json';
          if (fs.existsSync(demoPath)) {
            packageJsonPath = demoPath;
          }
        }
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        packageJson.scriptsMeta = yamlConfig;
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Configuration saved to scriptsMeta field in package file');
        console.log('🚀 You can now run: smart-run');
        break;
      }

      case 'clipboard': {
        const clipboardContent = `# Smart-run configuration (generated by AI)\n${yaml.dump(yamlConfig)}`;
        await aiService.copyToClipboard(clipboardContent);
        console.log('✅ Configuration copied to clipboard');
        break;
      }

      case 'view':
        console.log('\n📄 YAML Configuration:');
        console.log('─'.repeat(50));
        console.log(`# Smart-run configuration (generated by AI)\n${yaml.dump(yamlConfig)}`);
        console.log('─'.repeat(50));
        break;

      case 'discard':
        console.log('🗑️  Configuration discarded');
        break;
    }
  } catch (error) {
    console.error(
      '❌ AI analysis failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.log('\n💡 You can try the manual analysis option instead.');
  }
}

/**
 * Handle manual analysis workflow (generate prompt for external AI tools)
 */
async function handleManualAnalysis(
  aiService: AIService,
  scripts: Record<string, string>
): Promise<void> {
  console.log('📝 Generating analysis prompt for external AI tools...\n');

  const prompt = aiService.generatePromptForManualAnalysis(scripts);

  const { outputMethod } = await inquirer.prompt([
    {
      type: 'list',
      name: 'outputMethod',
      message: 'How would you like to receive the analysis prompt?',
      choices: [
        { name: '📋 Copy to clipboard (recommended)', value: 'clipboard' },
        { name: '🖥️  Display in terminal', value: 'display' },
        { name: '💾 Save to file', value: 'file' },
      ],
    },
  ]);

  switch (outputMethod) {
    case 'clipboard':
      try {
        await aiService.copyToClipboard(prompt);
        console.log('✅ Analysis prompt copied to clipboard!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open your preferred AI tool (ChatGPT, Claude, etc.)');
        console.log('   2. Paste the prompt (Ctrl+V / Cmd+V)');
        console.log('   3. Copy the generated YAML configuration');
        console.log('   4. Save it as package-meta.yaml in your project');
        console.log('   5. Run: smart-run');
      } catch (_error) {
        console.error('❌ Failed to copy to clipboard. Displaying in terminal instead:\n');
        console.log(prompt);
      }
      break;

    case 'display':
      console.log('📄 Analysis Prompt:');
      console.log('─'.repeat(80));
      console.log(prompt);
      console.log('─'.repeat(80));
      console.log('\n📋 Copy this prompt and use it with your preferred AI tool.');
      break;

    case 'file':
      writeFileSync('ai-analysis-prompt.txt', prompt);
      console.log('✅ Analysis prompt saved to ai-analysis-prompt.txt');
      console.log('\n📋 Open the file and copy the content to your preferred AI tool.');
      break;
  }

  console.log('\n💡 Supported AI tools:');
  console.log('   - ChatGPT (https://chat.openai.com)');
  console.log('   - Claude (https://claude.ai)');
  console.log('   - GitHub Copilot Chat (in VS Code)');
  console.log('   - Google Bard/Gemini');
  console.log('   - Any other AI assistant');
}
