/**
 * Types & Interfaces for the Vancouver Pokemon TCG Stock Bot
 */

export type SetTier = 
  | '30TH_ANNIVERSARY' 
  | 'LATEST' 
  | 'RECENT' 
  | 'EVERGREEN' 
  | 'VINTAGE';

export type ProductFormat = 
  | 'BOOSTER_BUNDLE' 
  | 'ELITE_TRAINER_BOX' 
  | 'ULTRA_PREMIUM_COLLECTION' 
  | 'BOOSTER_BOX' 
  | 'SPECIAL_COLLECTION' 
  | 'MINI_TIN' 
  | 'SLEEVED_BOOSTER' 
  | 'OTHER_SEALED';

export interface PokemonSet {
  id: string;
  name: string;
  code: string;
  releaseDate: string; // YYYY-MM-DD
  is30thAnniversary?: boolean;
  tier: SetTier;
  aliases: string[];
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  storeNumber?: string;
}

export type StoreCategory = 
  | 'VANCOUVER_LGS' 
  | 'MAJOR_RETAILER' 
  | 'CANADIAN_TCG_ONLINE';

export interface StoreConfig {
  id: string;
  name: string;
  category: StoreCategory;
  baseUrl: string;
  logoUrl: string;
  pollIntervalSeconds: number;
  enabled: boolean;
  vancouverLocations?: StoreLocation[];
  channelKey: string;
}

export interface ProductStockItem {
  sku: string;
  storeId: string;
  title: string;
  url: string;
  imageUrl?: string;
  price: number;
  currency: string;
  inStock: boolean;
  quantity?: number;
  locationName?: string; // e.g. "Metrotown", "Cambie St", "Online (Ships to Vancouver)"
  storeNumber?: string;
  sellerName?: string;
  isOfficialSeller: boolean;
  
  // Categorization
  setId?: string;
  setName?: string;
  setTier?: SetTier;
  format?: ProductFormat;
  isLatestBundle?: boolean;
  is30thAnniversary?: boolean;
  
  // Timestamps
  publishedAt?: string;
  lastChecked: string;
}

export type StockTransitionType = 
  | 'NEW_STOCK' 
  | 'RESTOCK' 
  | 'OUT_OF_STOCK' 
  | 'PRICE_CHANGE' 
  | 'NO_CHANGE';

export interface StockTransitionEvent {
  product: ProductStockItem;
  previousItem?: ProductStockItem;
  transitionType: StockTransitionType;
  timestamp: string;
  activeDiscordMessageId?: string;
  activeDiscordChannelId?: string;
}

export interface GuildChannelMapping {
  guildId: string;
  channelKey: string;
  channelId: string;
  categoryId?: string;
}

export interface MonitorHealthStatus {
  storeId: string;
  storeName: string;
  status: 'ONLINE' | 'ERROR' | 'PAUSED';
  lastPollTimestamp: string;
  totalProductsChecked: number;
  itemsInStock: number;
  lastErrorMessage?: string;
}
