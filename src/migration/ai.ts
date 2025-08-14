import { AIService } from '../ai-service.js';
import { getPackageJson } from '../core/package.js';
import type { ScriptGroup } from '../types.js';

export async function enhanceWithAI(scriptGroups: ScriptGroup[]): Promise<ScriptGroup[]> {
  const aiService = new AIService();
  if (!aiService.hasApiKey()) throw new Error('AI enhancement requires an OpenAI API key');
  const allScripts: Record<string, string> = {};
  const pkg = getPackageJson();
  for (const group of scriptGroups)
    for (const s of group.scripts) allScripts[s.key] = pkg.scripts?.[s.key] || s.description;
  const analysis = await aiService.analyzeScripts(allScripts);
  return analysis.scriptGroups;
}
