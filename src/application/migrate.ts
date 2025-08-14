import { runMigration } from '../migration/main.js';

export async function migrate(): Promise<void> {
  await runMigration();
}
