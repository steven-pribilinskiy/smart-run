#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demos = [
  {
    id: 'basic-scripts',
    name: 'Basic Scripts',
    description: 'Standard npm scripts without any configuration - shows raw complex command lines',
    folder: 'basic-scripts',
  },
  {
    id: 'ntl-format',
    name: 'ntl Format',
    description: 'Using ntl.descriptions to organize scripts with emojis and descriptions',
    folder: 'ntl-format',
  },
  {
    id: 'npm-scripts-org',
    name: 'npm-scripts Organization',
    description: 'Category-based organization using comment headers in scripts',
    folder: 'npm-scripts-org',
  },
  {
    id: 'npm-scripts-info',
    name: 'npm-scripts-info',
    description: 'Using scripts-info field to document scripts with emojis',
    folder: 'npm-scripts-info',
  },
  {
    id: 'better-scripts',
    name: 'better-scripts',
    description: 'Mixed format support with aliases, descriptions, and commands',
    folder: 'better-scripts',
  },
  {
    id: 'smart-run-native',
    name: 'Smart-run Native',
    description: 'Native package-meta.yaml configuration with organized groups',
    folder: 'smart-run-native',
  },
  {
    id: 'enhanced-format',
    name: 'Enhanced Format',
    description: 'Full smart-run power with titles, emojis, and detailed descriptions',
    folder: 'enhanced-format',
  },
];

function displayMenu() {
  console.log('\n🚀 Smart-run Demo Menu\n');
  console.log('Choose a demo to see how smart-run transforms complex command lines:');
  console.log('═'.repeat(70));

  demos.forEach((demo, index) => {
    console.log(`${index + 1}. ${demo.name}`);
    console.log(`   ${demo.description}`);
    console.log('');
  });

  console.log(`${demos.length + 1}. Run all demos sequentially`);
  console.log(`${demos.length + 2}. Show demo comparison`);
  console.log('0. Exit');
  console.log('═'.repeat(70));
}

function showDemoComparison() {
  console.log('\n📊 Demo Comparison\n');
  console.log(`${'Format'.padEnd(20) + 'Organization'.padEnd(15) + 'Emojis'.padEnd(8)}Migration`);
  console.log('─'.repeat(70));

  const comparisons = [
    ['Basic Scripts', 'None', 'No', 'N/A'],
    ['ntl Format', 'Descriptions', 'Yes', 'Automatic'],
    ['npm-scripts-org', 'Categories', 'No', 'Automatic'],
    ['npm-scripts-info', 'Descriptions', 'Yes', 'Automatic'],
    ['better-scripts', 'Mixed', 'Yes', 'Automatic'],
    ['Smart-run Native', 'Groups', 'Yes', 'Native'],
    ['Enhanced Format', 'Groups+Titles', 'Yes', 'Native'],
  ];

  comparisons.forEach(([format, org, emojis, migration]) => {
    console.log(format.padEnd(20) + org.padEnd(15) + emojis.padEnd(8) + migration);
  });

  console.log('\n💡 Key Benefits:');
  console.log('• Transforms overwhelming command lines into clear, organized menus');
  console.log('• Supports all major npm script organization tools');
  console.log('• Automatic migration preserves existing configurations');
  console.log('• Enhanced format provides superior UX with titles and emojis');
  console.log('');
}

function runDemo(demo) {
  const demoPath = path.join(__dirname, '../demo', demo.folder);
  const smartRunPath = path.join(__dirname, '../dist/cli.js');

  if (!fs.existsSync(demoPath)) {
    console.error(`❌ Demo folder not found: ${demoPath}`);
    return;
  }

  console.log(`\n🎯 Running ${demo.name} Demo`);
  console.log(`📁 Location: demo/${demo.folder}`);
  console.log(`📝 Description: ${demo.description}\n`);

  // Show the package.demo.json structure first
  const packagePath = path.join(demoPath, 'package.demo.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  console.log('📦 Package.demo.json scripts preview:');
  console.log('─'.repeat(50));

  const scriptEntries = Object.entries(packageJson.scripts).slice(0, 3);
  scriptEntries.forEach(([name, command]) => {
    const shortCommand = command.length > 60 ? `${command.substring(0, 60)}...` : command;
    console.log(`"${name}": "${shortCommand}"`);
  });

  if (Object.keys(packageJson.scripts).length > 3) {
    console.log(`... and ${Object.keys(packageJson.scripts).length - 3} more scripts`);
  }

  console.log('─'.repeat(50));
  console.log('\n🎮 Starting smart-run interactive demo...\n');

  try {
    // Change to demo directory and run smart-run
    process.chdir(demoPath);
    execSync(`node ${smartRunPath}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error running demo: ${error.message}`);
  } finally {
    // Return to original directory
    process.chdir(path.join(__dirname, '..'));
  }

  // Pause before returning to menu
  console.log('\n✅ Demo completed!');
  console.log('\n⏸️  Press Enter to return to the main menu...');
  execSync('read -p ""', { stdio: 'inherit', shell: '/bin/bash' });
}

function runAllDemos() {
  console.log('\n🎬 Running all demos sequentially...\n');

  demos.forEach((demo, index) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Demo ${index + 1}/${demos.length}: ${demo.name}`);
    console.log(`${'='.repeat(70)}`);

    runDemo(demo);

    if (index < demos.length - 1) {
      console.log('\n⏸️  Press Enter to continue to next demo...');
      try {
        execSync('read -p ""', { stdio: 'inherit', shell: '/bin/bash' });
      } catch (_error) {
        // Handle if read command fails
        console.log('Continuing to next demo...');
      }
    }
  });

  console.log('\n✅ All demos completed!');
}

async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Enter your choice (0-${demos.length + 2}): `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  while (true) {
    displayMenu();

    const choice = await promptUser();
    const choiceNum = parseInt(choice);

    if (choiceNum === 0) {
      console.log('\n👋 Thanks for trying smart-run demos!');
      break;
    } else if (choiceNum >= 1 && choiceNum <= demos.length) {
      runDemo(demos[choiceNum - 1]);
    } else if (choiceNum === demos.length + 1) {
      runAllDemos();
    } else if (choiceNum === demos.length + 2) {
      showDemoComparison();
      console.log('Press Enter to return to menu...');
      await promptUser();
    } else {
      console.log('❌ Invalid choice. Please try again.');
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Demo interrupted. Goodbye!');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { demos, runDemo, runAllDemos };
