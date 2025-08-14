export function fuzzyMatch(search: string, target: string): boolean {
  if (!search) return true;
  if (!target) return false;
  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();
  let searchIndex = 0;
  for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
    if (targetLower[i] === searchLower[searchIndex]) searchIndex++;
  }
  return searchIndex === searchLower.length;
}

export function fuzzyScore(search: string, target: string): number {
  if (!search) return 0;
  if (!target) return -1;
  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();
  let score = 0;
  let searchIndex = 0;
  let consecutive = 0;
  for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
    if (targetLower[i] === searchLower[searchIndex]) {
      score += 1 + consecutive;
      consecutive++;
      searchIndex++;
    } else {
      consecutive = 0;
    }
  }
  if (targetLower.startsWith(searchLower)) score += 10;
  if (targetLower === searchLower) score += 20;
  return searchIndex === searchLower.length ? score : -1;
}
