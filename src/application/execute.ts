import { runSmartRun } from '../index.js';

export async function executeInteractive(
  configPath?: string,
  options?: { previewCommand?: boolean; disableColors?: boolean }
): Promise<void> {
  await runSmartRun(configPath, options);
}
