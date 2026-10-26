import { enrichProductData } from '../config/pokemonCatalog.js';
import { ProductStockItem, StockTransitionEvent, StockTransitionType } from '../types/index.js';
import { StockDatabase } from './db.js';

export type StockEventListener = (event: StockTransitionEvent) => Promise<void>;

export class StockManager {
  private db: StockDatabase;
  private listeners: StockEventListener[] = [];

  constructor(db: StockDatabase) {
    this.db = db;
  }

  public addListener(listener: StockEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Processes a batch of raw product updates from any store monitor.
   * Enriches data with set, tier, format, and 30th anniversary tags.
   * Emits transition events when stock changes.
   */
  public async processProductUpdates(items: ProductStockItem[]): Promise<StockTransitionEvent[]> {
    const events: StockTransitionEvent[] = [];

    for (const rawItem of items) {
      // 1. Enrich with catalog metadata
      const enriched = enrichProductData(rawItem.title, rawItem.sellerName, rawItem.storeId);

      // Skip non-card merchandise or scalper 3rd-party listings
      if (!enriched.isCard || !enriched.isOfficialSeller) {
        continue;
      }

      const item: ProductStockItem = {
        ...rawItem,
        setId: enriched.setId,
        setName: enriched.setName,
        setTier: enriched.setTier,
        format: enriched.format,
        is30thAnniversary: enriched.is30thAnniversary,
        isLatestBundle: enriched.isLatestBundle,
        isOfficialSeller: enriched.isOfficialSeller,
        lastChecked: new Date().toISOString()
      };

      // 2. Query previous state and upsert into database
      const { isNew, prevItem } = this.db.upsertProduct(item);

      // 3. Determine transition type
      let transitionType: StockTransitionType = 'NO_CHANGE';

      if (isNew) {
        if (item.inStock) {
          transitionType = 'NEW_STOCK';
        }
      } else if (prevItem) {
        if (!prevItem.inStock && item.inStock) {
          transitionType = 'RESTOCK';
        } else if (prevItem.inStock && !item.inStock) {
          transitionType = 'OUT_OF_STOCK';
        } else if (prevItem.inStock && item.inStock && prevItem.price !== item.price) {
          transitionType = 'PRICE_CHANGE';
        }
      }

      if (transitionType !== 'NO_CHANGE') {
        const activeAlert = this.db.getActiveAlert(item.sku, item.storeId, item.locationName || '');
        
        const event: StockTransitionEvent = {
          product: item,
          previousItem: prevItem,
          transitionType,
          timestamp: new Date().toISOString(),
          activeDiscordMessageId: activeAlert?.discord_message_id,
          activeDiscordChannelId: activeAlert?.discord_channel_id
        };

        events.push(event);

        // Notify all registered listeners (e.g. Discord Notifier)
        for (const listener of this.listeners) {
          try {
            await listener(event);
          } catch (err) {
            console.error(`[StockManager] Error notifying listener for ${item.title}:`, err);
          }
        }
      }
    }

    return events;
  }

  public getDatabase(): StockDatabase {
    return this.db;
  }
}
