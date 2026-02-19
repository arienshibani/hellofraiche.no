import type { WinePairing } from '$lib/types';

/**
 * Builds a Vinmonopolet search URL from a wine pairing.
 * Base: :relevance:mainCategory:{rødvin|hvitvin}
 * With variety: :relevance:Raastoff:{variety}:mainCategory:{rødvin|hvitvin}
 */
export const buildVinmonopoletSearchUrl = (pairing: WinePairing | undefined): string | null => {
  if (!pairing) return null;

  const mainCategory = pairing.category === 'red' ? 'rødvin' : 'hvitvin';
  const parts: string[] = [':relevance'];

  if (pairing.variety?.trim()) {
    parts.push(`Raastoff:${pairing.variety.trim()}`);
  }
  parts.push(`mainCategory:${mainCategory}`);

  const q = encodeURIComponent(parts.join(':'));
  return `https://www.vinmonopolet.no/search?q=${q}`;
};
