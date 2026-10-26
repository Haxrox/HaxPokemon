import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StockDatabase } from '../src/services/db.js';
import { StockManager } from '../src/services/stockManager.js';
import { ProductStockItem, StockTransitionEvent } from '../src/types/index.js';

describe('StockManager & SQLite State Machine', () => {
  const testDbPath = path.join(process.cwd(), 'tests', 'test_stock.sqlite');
  let db: StockDatabase;
  let manager: StockManager;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new StockDatabase(testDbPath);
    manager = new StockManager(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('detects NEW_STOCK when an in-stock product is first discovered', async () => {
    const receivedEvents: StockTransitionEvent[] = [];
    manager.addListener(async (e) => {
      receivedEvents.push(e);
    });

    const item: ProductStockItem = {
      sku: 'zephyr-30th-bundle-1',
      storeId: 'zephyr-epic',
      title: 'Pokémon 30th Anniversary Booster Bundle (6 Packs)',
      url: 'https://zephyrepic.com/product/30th-bundle',
      price: 39.99,
      currency: 'CAD',
      inStock: true,
      locationName: 'Zephyr Epic (Surrey Flagship & Online)',
      sellerName: 'Zephyr Epic',
      isOfficialSeller: true,
      lastChecked: new Date().toISOString()
    };

    const events = await manager.processProductUpdates([item]);
    expect(events.length).toBe(1);
    expect(events[0].transitionType).toBe('NEW_STOCK');
    expect(events[0].product.is30thAnniversary).toBe(true);
    expect(receivedEvents.length).toBe(1);
  });

  it('detects NO_CHANGE when product stock status is unchanged', async () => {
    const item: ProductStockItem = {
      sku: 'bb-prismatic-1',
      storeId: 'bestbuy-ca',
      title: 'Pokémon TCG: Scarlet & Violet - Prismatic Evolutions Booster Bundle',
      url: 'https://bestbuy.ca/product/prismatic',
      price: 37.99,
      currency: 'CAD',
      inStock: true,
      locationName: 'Best Buy Vancouver - Cambie St',
      sellerName: 'Best Buy Canada',
      isOfficialSeller: true,
      lastChecked: new Date().toISOString()
    };

    // First check: NEW_STOCK
    await manager.processProductUpdates([item]);

    // Second check with same status
    const secondEvents = await manager.processProductUpdates([item]);
    expect(secondEvents.length).toBe(0); // No noisy duplicate alert!
  });

  it('detects OUT_OF_STOCK and associates with active Discord message ID', async () => {
    const item: ProductStockItem = {
      sku: 'pc-151-bundle',
      storeId: 'pokemoncenter-ca',
      title: 'Pokémon TCG: Scarlet & Violet 151 Booster Bundle',
      url: 'https://pokemoncenter.com/en-ca/product/151-bundle',
      price: 39.99,
      currency: 'CAD',
      inStock: true,
      locationName: 'Online',
      sellerName: 'Pokémon Center',
      isOfficialSeller: true,
      lastChecked: new Date().toISOString()
    };

    // 1. Initial In-Stock
    await manager.processProductUpdates([item]);

    // Simulate Discord message sent
    db.saveAlertRecord(
      item.sku,
      item.storeId,
      item.locationName || '',
      'msg_123456789',
      'chan_987654321',
      'IN_STOCK'
    );

    // 2. Product Sells Out
    const oosItem: ProductStockItem = {
      ...item,
      inStock: false
    };

    const oosEvents = await manager.processProductUpdates([oosItem]);
    expect(oosEvents.length).toBe(1);
    expect(oosEvents[0].transitionType).toBe('OUT_OF_STOCK');
    expect(oosEvents[0].activeDiscordMessageId).toBe('msg_123456789');
    expect(oosEvents[0].activeDiscordChannelId).toBe('chan_987654321');
  });

  it('detects RESTOCK when a sold-out item comes back in stock', async () => {
    const item: ProductStockItem = {
      sku: 'hoc-surging-etb',
      storeId: 'house-of-cards',
      title: 'Pokémon TCG: Surging Sparks Elite Trainer Box',
      url: 'https://houseofcards.ca/products/surging-etb',
      price: 64.99,
      currency: 'CAD',
      inStock: false, // Initially out of stock
      locationName: 'House of Cards Cloverdale',
      sellerName: 'House of Cards',
      isOfficialSeller: true,
      lastChecked: new Date().toISOString()
    };

    // First check (out of stock, so no alert)
    const initialEvents = await manager.processProductUpdates([item]);
    expect(initialEvents.length).toBe(0);

    // Later: restocked!
    const restockedItem: ProductStockItem = {
      ...item,
      inStock: true
    };

    const restockEvents = await manager.processProductUpdates([restockedItem]);
    expect(restockEvents.length).toBe(1);
    expect(restockEvents[0].transitionType).toBe('RESTOCK');
    expect(restockEvents[0].product.format).toBe('ELITE_TRAINER_BOX');
  });
});
