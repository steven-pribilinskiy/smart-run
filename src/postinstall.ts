#!/usr/bin/env node

import inquirer from 'inquirer';

/**
 * Post-install script that offers to set up global aliases
 */
async function postInstall(): Promise<void> {
  // Only run this for global installations
  if (!process.env.npm_config_global) {
    return;
  }
  
  console.log('\n🎉 Thank you for installing smart-run!\n');
  
  const { setupAliases } = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupAliases',
    message: 'Would you like to set up convenient aliases (srun, sr) for smart-run?',
    default: true
  }]);
  
  if (setupAliases) {
    const { setupGlobalAliases } = await import('./setup-aliases.js');
    await setupGlobalAliases();
  } else {
    console.log('\n💡 You can set up aliases later by running:');
    console.log('   smart-run --setup-aliases');
    console.log('\n📚 Or check the documentation at:');
    console.log('   https://github.com/steven-pribilinskiy/smart-run#readme');
  }
  
  console.log('\n🚀 Get started by running: smart-run');
  console.log('   Or if you set up aliases: srun\n');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  postInstall().catch(() => {
    // Silent fail for post-install scripts to avoid breaking installations
  });
}

export { postInstall };
