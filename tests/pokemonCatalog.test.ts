import { describe, expect, it } from 'vitest';
import { 
  enrichProductData, 
  identifyProductFormat, 
  isLegitOfficialSeller, 
  isPokemonCardProduct, 
  matchPokemonSet 
} from '../src/config/pokemonCatalog.js';

describe('Pokemon Catalog & Filter Engine', () => {
  it('correctly identifies authentic Pokemon card products', () => {
    expect(isPokemonCardProduct('Pokémon TCG: Scarlet & Violet - Prismatic Evolutions Booster Bundle')).toBe(true);
    expect(isPokemonCardProduct('Pokemon 30th Anniversary Ultra-Premium Collection')).toBe(true);
    expect(isPokemonCardProduct('Pokemon 151 Elite Trainer Box Sealed')).toBe(true);
    expect(isPokemonCardProduct('Pokemon Crown Zenith Booster Display Box')).toBe(true);
  });

  it('rejects non-card merchandise to prevent noisy pings', () => {
    expect(isPokemonCardProduct('Pokemon Pikachu 8-inch Plush Toy')).toBe(false);
    expect(isPokemonCardProduct('Pokemon Charmander Action Figure')).toBe(false);
    expect(isPokemonCardProduct('Pokemon Eevee Backpack & Lunchbox')).toBe(false);
    expect(isPokemonCardProduct('Nintendo Switch Pokemon Scarlet Game Cartridge')).toBe(false);
    expect(isPokemonCardProduct('Pokemon 9-Pocket Trading Card Binder')).toBe(false);
  });

  it('strictly rejects competing card games and franchises', () => {
    expect(isPokemonCardProduct('Cyberpunk TCG - Welcome To Night City - Starter Deck - The Heist - French')).toBe(false);
    expect(isPokemonCardProduct('League of Legends Riftbound TCG: Vendetta Booster Box')).toBe(false);
    expect(isPokemonCardProduct('Union Arena TCG UE31BT ARKNIGHTS BOOSTER')).toBe(false);
    expect(isPokemonCardProduct('Magic: The Gathering 30th Anniversary Edition Booster Box')).toBe(false);
    expect(isPokemonCardProduct('One Piece TCG - Romance Dawn Booster Box')).toBe(false);
    expect(isPokemonCardProduct('Disney Lorcana Rise of the Floodborn Booster Pack')).toBe(false);
    expect(isPokemonCardProduct('Upper Deck 2024-25 Series 1 NHL Hockey Cards Box')).toBe(false);
    expect(isPokemonCardProduct('Echoes of Astra TCG: Imperion - Booster Box')).toBe(false);
  });

  it('correctly classifies product formats', () => {
    expect(identifyProductFormat('Scarlet & Violet: Prismatic Evolutions Booster Bundle')).toBe('BOOSTER_BUNDLE');
    expect(identifyProductFormat('Surging Sparks Elite Trainer Box (ETB)')).toBe('ELITE_TRAINER_BOX');
    expect(identifyProductFormat('Pokemon 30th Anniversary Ultra-Premium Collection Box')).toBe('ULTRA_PREMIUM_COLLECTION');
    expect(identifyProductFormat('Pokemon Stellar Crown 36-Pack Booster Box')).toBe('BOOSTER_BOX');
    expect(identifyProductFormat('Pokemon 151 Poster Collection')).toBe('SPECIAL_COLLECTION');
    expect(identifyProductFormat('Pokemon Paldean Fates Mini Tin Display')).toBe('MINI_TIN');
  });

  it('matches canonical Pokemon sets and recognizes 30th Anniversary', () => {
    const annivSet = matchPokemonSet('Pokemon 30th Anniversary Collection ETB');
    expect(annivSet).toBeDefined();
    expect(annivSet?.is30thAnniversary).toBe(true);
    expect(annivSet?.tier).toBe('30TH_ANNIVERSARY');

    const prismaticSet = matchPokemonSet('Pokemon TCG Prismatic Evolutions Booster Bundle');
    expect(prismaticSet).toBeDefined();
    expect(prismaticSet?.name).toBe('Prismatic Evolutions');
    expect(prismaticSet?.tier).toBe('LATEST');

    const set151 = matchPokemonSet('Pokemon TCG Scarlet & Violet 151 Booster Bundle');
    expect(set151).toBeDefined();
    expect(set151?.name).toBe('Pokémon 151');
    expect(set151?.tier).toBe('EVERGREEN');
  });

  it('validates official sellers and rejects 3rd party marketplace scalpers', () => {
    // Walmart Canada
    expect(isLegitOfficialSeller('walmart-ca', 'Walmart')).toBe(true);
    expect(isLegitOfficialSeller('walmart-ca', 'Walmart Canada')).toBe(true);
    expect(isLegitOfficialSeller('walmart-ca', 'ScalperCards LLC')).toBe(false);
    expect(isLegitOfficialSeller('walmart-ca', 'Tokyo Collectibles Direct')).toBe(false);

    // Best Buy Canada
    expect(isLegitOfficialSeller('bestbuy-ca', 'Best Buy Canada')).toBe(true);
    expect(isLegitOfficialSeller('bestbuy-ca', 'Best Buy')).toBe(true);
    expect(isLegitOfficialSeller('bestbuy-ca', 'CardHype Marketplace')).toBe(false);
  });

  it('ranks latest bundles and 30th anniversary items with high priority', () => {
    // 30th Anniversary bundle
    const annivBundle = enrichProductData(
      'Pokemon 30th Anniversary Booster Bundle (6 Packs)',
      'Zephyr Epic',
      'zephyr-epic'
    );
    expect(annivBundle.isCard).toBe(true);
    expect(annivBundle.is30thAnniversary).toBe(true);
    expect(annivBundle.isLatestBundle).toBe(true);
    expect(annivBundle.format).toBe('BOOSTER_BUNDLE');

    // Latest set booster bundle
    const prismaticBundle = enrichProductData(
      'Pokemon TCG: Scarlet & Violet - Prismatic Evolutions Booster Bundle',
      'Best Buy Canada',
      'bestbuy-ca'
    );
    expect(prismaticBundle.isLatestBundle).toBe(true);
    expect(prismaticBundle.setTier).toBe('LATEST');

    // Older vintage set (Crown Zenith) is NOT marked as latest bundle
    const vintageETB = enrichProductData(
      'Pokemon TCG: Crown Zenith Elite Trainer Box',
      'House of Cards',
      'house-of-cards'
    );
    expect(vintageETB.isLatestBundle).toBe(false);
    expect(vintageETB.setTier).toBe('VINTAGE');
  });
});
