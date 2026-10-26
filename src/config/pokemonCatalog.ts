import { PokemonSet, ProductFormat, SetTier } from '../types/index.js';

/**
 * Canonical Registry of Pokemon TCG Sets, Chronology, and Matchers.
 * Includes upcoming 30th Anniversary releases, latest Scarlet & Violet expansions,
 * and high-demand reprint/vintage favorites.
 */
export const POKEMON_SETS: PokemonSet[] = [
  // 30th Anniversary (2026 Releases)
  {
    id: 'sv-30th-anniversary',
    name: 'Pokémon 30th Anniversary Collection',
    code: '30TH',
    releaseDate: '2026-02-27',
    is30thAnniversary: true,
    tier: '30TH_ANNIVERSARY',
    aliases: ['30th', '30th anniversary', 'anniversary collection', 'pokemon 30', '30 years of pokemon']
  },
  // Scarlet & Violet Era (Latest & Modern)
  {
    id: 'sv-prismatic-evolutions',
    name: 'Prismatic Evolutions',
    code: 'PRE',
    releaseDate: '2025-01-17',
    tier: 'LATEST',
    aliases: ['prismatic evolutions', 'prismatic', 'eevee prismatic', 'terastal festival']
  },
  {
    id: 'sv-surging-sparks',
    name: 'Surging Sparks',
    code: 'SSP',
    releaseDate: '2024-11-08',
    tier: 'LATEST',
    aliases: ['surging sparks', 'surging', 'pikachu ex surging']
  },
  {
    id: 'sv-stellar-crown',
    name: 'Stellar Crown',
    code: 'SCR',
    releaseDate: '2024-09-13',
    tier: 'RECENT',
    aliases: ['stellar crown', 'stellar', 'terapagos']
  },
  {
    id: 'sv-shrouded-fable',
    name: 'Shrouded Fable',
    code: 'SFA',
    releaseDate: '2024-08-02',
    tier: 'RECENT',
    aliases: ['shrouded fable', 'shrouded', 'pecharunt']
  },
  {
    id: 'sv-twilight-masquerade',
    name: 'Twilight Masquerade',
    code: 'TWM',
    releaseDate: '2024-05-24',
    tier: 'RECENT',
    aliases: ['twilight masquerade', 'twilight', 'ogerpon']
  },
  {
    id: 'sv-temporal-forces',
    name: 'Temporal Forces',
    code: 'TEF',
    releaseDate: '2024-03-22',
    tier: 'RECENT',
    aliases: ['temporal forces', 'temporal', 'iron leaves', 'walking wake']
  },
  {
    id: 'sv-paldean-fates',
    name: 'Paldean Fates',
    code: 'PAF',
    releaseDate: '2024-01-26',
    tier: 'EVERGREEN',
    aliases: ['paldean fates', 'shiny treasure', 'shiny charizard']
  },
  {
    id: 'sv-paradox-rift',
    name: 'Paradox Rift',
    code: 'PAR',
    releaseDate: '2023-11-03',
    tier: 'EVERGREEN',
    aliases: ['paradox rift', 'roaring moon']
  },
  {
    id: 'sv-151',
    name: 'Pokémon 151',
    code: 'MEW',
    releaseDate: '2023-09-22',
    tier: 'EVERGREEN',
    aliases: ['151', 'scarlet & violet 151', 'sv 151', 'pokemon 151', 'original 151']
  },
  {
    id: 'sv-obsidian-flames',
    name: 'Obsidian Flames',
    code: 'OBF',
    releaseDate: '2023-08-11',
    tier: 'EVERGREEN',
    aliases: ['obsidian flames', 'obsidian', 'dark charizard']
  },
  // Sword & Shield Reprints & High-Demand Fan Favorites
  {
    id: 'swsh-crown-zenith',
    name: 'Crown Zenith',
    code: 'CRZ',
    releaseDate: '2023-01-20',
    tier: 'VINTAGE',
    aliases: ['crown zenith', 'zenith', 'galarian gallery']
  },
  {
    id: 'swsh-silver-tempest',
    name: 'Silver Tempest',
    code: 'SIT',
    releaseDate: '2022-11-11',
    tier: 'VINTAGE',
    aliases: ['silver tempest', 'lugia vstar']
  },
  {
    id: 'swsh-lost-origin',
    name: 'Lost Origin',
    code: 'LOR',
    releaseDate: '2022-09-09',
    tier: 'VINTAGE',
    aliases: ['lost origin', 'giratina v alt']
  },
  {
    id: 'swsh-evolving-skies',
    name: 'Evolving Skies',
    code: 'EVS',
    releaseDate: '2021-08-27',
    tier: 'VINTAGE',
    aliases: ['evolving skies', 'eeveelutions', 'moonbreon']
  },
  {
    id: 'swsh-celebrations',
    name: 'Celebrations (25th Anniversary)',
    code: 'CEL',
    releaseDate: '2021-10-08',
    tier: 'VINTAGE',
    aliases: ['celebrations', '25th anniversary', 'pokemon celebrations']
  }
];

/**
 * Keywords that classify the product format
 */
const FORMAT_MATCHERS: { format: ProductFormat; patterns: RegExp[] }[] = [
  {
    format: 'ULTRA_PREMIUM_COLLECTION',
    patterns: [/ultra[- ]premium collection/i, /\bupc\b/i, /premium collection box/i]
  },
  {
    format: 'BOOSTER_BUNDLE',
    patterns: [/booster bundle/i, /\b6[- ]pack bundle\b/i, /booster pack bundle/i]
  },
  {
    format: 'ELITE_TRAINER_BOX',
    patterns: [/elite trainer box/i, /\betb\b/i, /pokemon center elite trainer box/i]
  },
  {
    format: 'BOOSTER_BOX',
    patterns: [/booster box/i, /36[- ]pack booster/i, /sealed booster display/i]
  },
  {
    format: 'MINI_TIN',
    patterns: [/mini tin/i, /tin display/i, /collector tin/i, /stacking tin/i]
  },
  {
    format: 'SPECIAL_COLLECTION',
    patterns: [
      /special collection/i,
      /poster collection/i,
      /binder collection/i,
      /premium tournament collection/i,
      /pin collection/i,
      /collector chest/i
    ]
  },
  {
    format: 'SLEEVED_BOOSTER',
    patterns: [/sleeved booster/i, /blister pack/i, /checklane blister/i]
  }
];

/**
 * Filter out non-card merchandise to prevent alert noise
 */
const EXCLUSION_PATTERNS: RegExp[] = [
  /\bplush\b/i,
  /\bfigure\b/i,
  /\btoy\b/i,
  /\bcostume\b/i,
  /\bbackpack\b/i,
  /\bhat\b/i,
  /\bshirt\b/i,
  /\bhoodie\b/i,
  /\bplaymat\b(?!.*(?:with|includes|\+|pack|booster))/i,
  /\bcard sleeves\b(?!.*(?:with|includes|\+|pack|booster))/i,
  /\bdeck box\b(?!.*(?:with|includes|\+|pack|booster))/i,
  /\bbinder\b(?!.*(?:collection|pack|booster|bundle))/i,
  /\bvideo game\b/i,
  /\bnintendo switch\b/i,
  /\bkeychain\b/i
];

/**
 * Inspects a product title and description to determine if it is a genuine Pokémon card product
 */
export function isPokemonCardProduct(title: string): boolean {
  const lower = title.toLowerCase();
  
  // Must mention pokemon or tcg or a recognizable set/product keyword
  const hasPokemonKeyword = 
    lower.includes('pokemon') || 
    lower.includes('pokémon') || 
    lower.includes('tcg') || 
    POKEMON_SETS.some(s => s.aliases.some(a => lower.includes(a)));

  if (!hasPokemonKeyword) {
    return false;
  }

  // Must not match strictly non-card merchandise exclusions
  for (const exclusion of EXCLUSION_PATTERNS) {
    if (exclusion.test(lower)) {
      return false;
    }
  }

  // Must have card pack indicators
  const hasCardPackIndicator = 
    /booster|pack|bundle|box|tin|collection|etb|blister|deck|card|display|upc/i.test(lower);

  return hasCardPackIndicator;
}

/**
 * Identifies the product format from the title
 */
export function identifyProductFormat(title: string): ProductFormat {
  for (const item of FORMAT_MATCHERS) {
    for (const pattern of item.patterns) {
      if (pattern.test(title)) {
        return item.format;
      }
    }
  }
  return 'OTHER_SEALED';
}

/**
 * Matches a product title to a canonical Pokémon Set
 */
export function matchPokemonSet(title: string): PokemonSet | undefined {
  const lower = title.toLowerCase();

  // Prioritize 30th Anniversary first
  const anniversarySet = POKEMON_SETS.find(s => s.is30thAnniversary);
  if (anniversarySet && anniversarySet.aliases.some(alias => lower.includes(alias))) {
    return anniversarySet;
  }

  // Then check other sets (ordered from newest to oldest in array)
  for (const set of POKEMON_SETS) {
    for (const alias of set.aliases) {
      if (lower.includes(alias)) {
        return set;
      }
    }
  }

  return undefined;
}

/**
 * Validates whether the seller is legitimate (e.g. Best Buy Canada or Walmart direct, NOT 3rd party scalpers)
 */
export function isLegitOfficialSeller(storeId: string, sellerName?: string): boolean {
  if (!sellerName) {
    return true; // Many local stores only sell directly
  }

  const lower = sellerName.toLowerCase();
  
  if (storeId === 'walmart-ca') {
    // Only accept items sold and shipped by Walmart directly
    return lower.includes('walmart') || lower === 'walmart canada';
  }

  if (storeId === 'bestbuy-ca') {
    // Only accept items sold directly by Best Buy
    return lower.includes('best buy') || lower === 'best buy canada';
  }

  return true;
}

/**
 * Determines if a product is a "Latest Bundle" or High-Priority New Drop:
 * - Format is BOOSTER_BUNDLE, ELITE_TRAINER_BOX, or UPC
 * - Set is 30TH_ANNIVERSARY or LATEST
 * - Or published recently
 */
export function isLatestBundle(
  format?: ProductFormat, 
  setTier?: SetTier, 
  is30th?: boolean
): boolean {
  if (is30th) return true;
  if (!format || !setTier) return false;

  const isPriorityFormat = 
    format === 'BOOSTER_BUNDLE' || 
    format === 'ELITE_TRAINER_BOX' || 
    format === 'ULTRA_PREMIUM_COLLECTION';

  const isLatestSet = setTier === 'LATEST' || setTier === '30TH_ANNIVERSARY';

  return isPriorityFormat && isLatestSet;
}

/**
 * Complete parser helper to enrich raw product data with set, tier, format, and badges
 */
export function enrichProductData(title: string, sellerName?: string, storeId: string = '') {
  const isCard = isPokemonCardProduct(title);
  const format = identifyProductFormat(title);
  const matchedSet = matchPokemonSet(title);
  const is30th = matchedSet?.is30thAnniversary || /30th|30 years/i.test(title);
  const setTier = matchedSet?.tier ?? (is30th ? '30TH_ANNIVERSARY' : 'EVERGREEN');
  const isOfficial = isLegitOfficialSeller(storeId, sellerName);
  const latestBundle = isLatestBundle(format, setTier, is30th);

  return {
    isCard,
    format,
    setId: matchedSet?.id,
    setName: matchedSet?.name,
    setTier,
    is30thAnniversary: is30th,
    isLatestBundle: latestBundle,
    isOfficialSeller: isOfficial
  };
}
