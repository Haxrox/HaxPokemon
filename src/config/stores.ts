import { StoreConfig } from '../types/index.js';

/**
 * Registry of tracked stores, Vancouver locations, polling intervals, and channel keys.
 */
export const TRACKED_STORES: StoreConfig[] = [
  // Metro Vancouver & BC Local Game Stores (LGS)
  {
    id: 'zephyr-epic',
    name: 'Zephyr Epic (Surrey, BC)',
    category: 'VANCOUVER_LGS',
    baseUrl: 'https://zephyrepic.com',
    logoUrl: 'https://zephyrepic.com/wp-content/uploads/2021/04/ZE_Logo_Horizontal_White.png',
    pollIntervalSeconds: 90,
    enabled: true,
    channelKey: 'zephyr-epic',
    vancouverLocations: [
      {
        id: 'ze-surrey',
        name: 'Zephyr Epic Flagship Store',
        address: '19888 56 Ave #102',
        city: 'Langley / Surrey border',
        province: 'BC',
        postalCode: 'V3A 3Y1'
      }
    ]
  },
  {
    id: 'house-of-cards',
    name: 'House of Cards (BC)',
    category: 'VANCOUVER_LGS',
    baseUrl: 'https://houseofcards.ca',
    logoUrl: 'https://cdn.shopify.com/s/files/1/0270/8258/8240/files/HOC_Logo_Stacked_Colour_200x.png',
    pollIntervalSeconds: 120,
    enabled: true,
    channelKey: 'bc-local-shops',
    vancouverLocations: [
      {
        id: 'hoc-abbotsford',
        name: 'House of Cards Abbotsford',
        address: '2649 Montrose Ave',
        city: 'Abbotsford',
        province: 'BC',
        postalCode: 'V2S 3T5'
      },
      {
        id: 'hoc-cloverdale',
        name: 'House of Cards Cloverdale',
        address: '5660 176 St',
        city: 'Surrey',
        province: 'BC',
        postalCode: 'V3S 4C6'
      }
    ]
  },
  {
    id: 'pastime-sports',
    name: 'Pastime Sports & Games (BC)',
    category: 'VANCOUVER_LGS',
    baseUrl: 'https://pastimesports.ca',
    logoUrl: 'https://pastimesports.ca/cdn/shop/files/Pastime_Logo_Black_Small.png',
    pollIntervalSeconds: 120,
    enabled: true,
    channelKey: 'bc-local-shops',
    vancouverLocations: [
      {
        id: 'ps-metrotown',
        name: 'Metropolis at Metrotown',
        address: '4700 Kingsway',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5H 4M1'
      },
      {
        id: 'ps-langley',
        name: 'Langley Superstore',
        address: '20378 88 Ave',
        city: 'Langley',
        province: 'BC',
        postalCode: 'V1M 2Y4'
      },
      {
        id: 'ps-tsawwassen',
        name: 'Tsawwassen Mills',
        address: '5000 Canoe Pass Way',
        city: 'Delta',
        province: 'BC',
        postalCode: 'V4M 0B3'
      }
    ]
  },
  {
    id: 'magic-stronghold',
    name: 'Magic Stronghold Games (Burnaby, BC)',
    category: 'VANCOUVER_LGS',
    baseUrl: 'https://www.magicstronghold.com',
    logoUrl: 'https://www.magicstronghold.com/images/logo.png',
    pollIntervalSeconds: 120,
    enabled: true,
    channelKey: 'bc-local-shops',
    vancouverLocations: [
      {
        id: 'ms-kingsway',
        name: 'Magic Stronghold Burnaby',
        address: '3665 Kingsway #100',
        city: 'Vancouver / Burnaby Border',
        province: 'BC',
        postalCode: 'V5R 5W2'
      }
    ]
  },

  // Major Canadian Retailers (Online + Vancouver In-Store Reserve)
  {
    id: 'pokemoncenter-ca',
    name: 'Pokémon Center Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://www.pokemoncenter.com/en-ca',
    logoUrl: 'https://www.pokemoncenter.com/static/images/pokemon-center-logo.svg',
    pollIntervalSeconds: 60,
    enabled: true,
    channelKey: 'pokemon-center-ca'
  },
  {
    id: 'bestbuy-ca',
    name: 'Best Buy Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://www.bestbuy.ca/en-ca',
    logoUrl: 'https://assets.bbycastatic.ca/sf/bundles/header-footer/assets/images/bestbuy-logo-en.svg',
    pollIntervalSeconds: 75,
    enabled: true,
    channelKey: 'bestbuy-ca',
    vancouverLocations: [
      {
        id: 'bb-cambie',
        storeNumber: '935',
        name: 'Best Buy Vancouver - Cambie St',
        address: '2220 Cambie St',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V5Z 2T7'
      },
      {
        id: 'bb-robson',
        storeNumber: '928',
        name: 'Best Buy Vancouver - Robson St Downtown',
        address: '798 Granville St',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6Z 3A3'
      },
      {
        id: 'bb-metrotown',
        storeNumber: '943',
        name: 'Best Buy Burnaby - Station Square / Metrotown',
        address: '6200 McKay Ave',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5H 4L7'
      },
      {
        id: 'bb-richmond',
        storeNumber: '924',
        name: 'Best Buy Richmond - Lansdowne Centre',
        address: '5300 No. 3 Rd',
        city: 'Richmond',
        province: 'BC',
        postalCode: 'V6X 2X9'
      }
    ]
  },
  {
    id: 'gamestop-ca',
    name: 'GameStop Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://gamestop.ca',
    logoUrl: 'https://gamestop.ca/Areas/Store/Content/Images/logo.svg',
    pollIntervalSeconds: 90,
    enabled: true,
    channelKey: 'gamestop-ca',
    vancouverLocations: [
      {
        id: 'gs-pacific-centre',
        name: 'GameStop Pacific Centre Downtown',
        address: '701 W Georgia St',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V7Y 1G5'
      },
      {
        id: 'gs-metrotown',
        name: 'GameStop Metropolis at Metrotown',
        address: '4800 Kingsway',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5H 4J2'
      },
      {
        id: 'gs-richmond',
        name: 'GameStop Richmond Centre',
        address: '6551 No 3 Rd',
        city: 'Richmond',
        province: 'BC',
        postalCode: 'V6Y 2B6'
      },
      {
        id: 'gs-brentwood',
        name: 'GameStop The Amazing Brentwood',
        address: '4567 Lougheed Hwy',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5C 3Z6'
      }
    ]
  },
  {
    id: 'walmart-ca',
    name: 'Walmart Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://www.walmart.ca',
    logoUrl: 'https://i5.walmartimages.ca/dfw/63fd9f59-e938/k2-_6b2fa90a-a3a8-422f-8705-1a221f7db192.v1.png',
    pollIntervalSeconds: 90,
    enabled: true,
    channelKey: 'walmart-ca',
    vancouverLocations: [
      {
        id: 'wm-grandview',
        name: 'Walmart Vancouver Supercentre - Grandview Hwy',
        address: '3585 Grandview Hwy',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V5M 2G7'
      },
      {
        id: 'wm-metrotown',
        name: 'Walmart Burnaby Supercentre - Metrotown',
        address: '4700 Kingsway #1100',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5H 4N2'
      }
    ]
  },
  {
    id: 'costco-ca',
    name: 'Costco Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://www.costco.ca',
    logoUrl: 'https://mobilecontent.costco.com/live/resource/img/static-ca-header/costco-logo-c.svg',
    pollIntervalSeconds: 180,
    enabled: true,
    channelKey: 'costco-toysrus',
    vancouverLocations: [
      {
        id: 'costco-downtown',
        name: 'Costco Vancouver Downtown',
        address: '605 Expo Blvd',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1V4'
      },
      {
        id: 'costco-richmond',
        name: 'Costco Richmond',
        address: '9151 Bridgeport Rd',
        city: 'Richmond',
        province: 'BC',
        postalCode: 'V6X 1S1'
      }
    ]
  },
  {
    id: 'toysrus-ca',
    name: 'Toys "R" Us Canada',
    category: 'MAJOR_RETAILER',
    baseUrl: 'https://www.toysrus.ca/en',
    logoUrl: 'https://www.toysrus.ca/on/demandware.static/Sites-toys-ca-Site/-/default/dw9e120f26/images/logo-toysrus.svg',
    pollIntervalSeconds: 180,
    enabled: true,
    channelKey: 'costco-toysrus',
    vancouverLocations: [
      {
        id: 'tru-broadway',
        name: 'Toys "R" Us Vancouver - Broadway',
        address: '1154 W Broadway',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6H 1G5'
      },
      {
        id: 'tru-metrotown',
        name: 'Toys "R" Us Metropolis at Metrotown',
        address: '4800 Kingsway',
        city: 'Burnaby',
        province: 'BC',
        postalCode: 'V5H 4J2'
      }
    ]
  },

  // Major Canadian Online TCG Stores (Fast Shopify Feeds)
  {
    id: '401-games',
    name: '401 Games (Canada)',
    category: 'CANADIAN_TCG_ONLINE',
    baseUrl: 'https://store.401games.ca',
    logoUrl: 'https://store.401games.ca/cdn/shop/files/401_New_Logo_Horizontal_-_White_Background.png',
    pollIntervalSeconds: 90,
    enabled: true,
    channelKey: 'bc-local-shops'
  },
  {
    id: 'hobbiesville',
    name: 'Hobbiesville (Canada)',
    category: 'CANADIAN_TCG_ONLINE',
    baseUrl: 'https://hobbiesville.com',
    logoUrl: 'https://hobbiesville.com/cdn/shop/files/HV_Logomark_Final_2022.png',
    pollIntervalSeconds: 90,
    enabled: true,
    channelKey: 'bc-local-shops'
  },
  {
    id: 'facetoface-games',
    name: 'Face to Face Games (Canada)',
    category: 'CANADIAN_TCG_ONLINE',
    baseUrl: 'https://www.facetofacegames.com',
    logoUrl: 'https://www.facetofacegames.com/cdn/shop/files/F2F_LOGO_NAV_2022.png',
    pollIntervalSeconds: 120,
    enabled: true,
    channelKey: 'bc-local-shops'
  }
];

export function getStoreConfig(storeId: string): StoreConfig | undefined {
  return TRACKED_STORES.find(s => s.id === storeId);
}

export function getStoresByCategory(category: StoreConfig['category']): StoreConfig[] {
  return TRACKED_STORES.filter(s => s.category === category && s.enabled);
}
