import { runListScripts } from '../list-scripts.js';
import { createDefaultRegistry } from '../formats/registry.js';
import { findWorkspaceRoot } from '../monorepo/detect.js';
import { discoverPackageManifests } from '../monorepo/discover.js';
import { aggregateWorkspace } from '../monorepo/aggregate.js';

export async function listScripts(
  options: { json?: boolean; disableColors?: boolean } = {}
): Promise<void> {
  void createDefaultRegistry();
  const ws = findWorkspaceRoot();
  if (!ws) {
    await runListScripts(options);
    return;
  }
  const manifests = discoverPackageManifests();
  const aggregated = aggregateWorkspace(manifests);
  if (options.json) {
    console.log(JSON.stringify(aggregated, null, 2));
  } else {
    console.log('\n📦 Workspace overview');
    aggregated.forEach((p) => {
      console.log(`\n🔹 ${p.name} (${p.path})`);
      p.groups.forEach((g) => {
        console.log(`  📁 ${g.name}`);
        g.scripts.forEach((s) => console.log(`    - [${s.key}] ${s.description}`));
      });
    });
  }
}
