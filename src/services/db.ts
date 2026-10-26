import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { GuildChannelMapping, ProductStockItem } from '../types/index.js';

export interface AlertRecord {
  id: number;
  product_sku: string;
  store_id: string;
  location_name: string;
  discord_message_id: string;
  discord_channel_id: string;
  alert_timestamp: string;
  is_active: number;
  last_status: string;
}

export class StockDatabase {
  private db: Database.Database;

  constructor(dbPath: string = process.env.DATABASE_PATH || './data/pokemon_stock.sqlite') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL,
        store_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        image_url TEXT,
        price REAL NOT NULL,
        currency TEXT NOT NULL,
        in_stock INTEGER NOT NULL,
        location_name TEXT NOT NULL DEFAULT '',
        set_id TEXT,
        set_name TEXT,
        set_tier TEXT,
        format TEXT,
        is_latest_bundle INTEGER DEFAULT 0,
        is_30th_anniversary INTEGER DEFAULT 0,
        published_at TEXT,
        last_stock_change TEXT NOT NULL,
        last_checked TEXT NOT NULL,
        UNIQUE(sku, store_id, location_name)
      );

      CREATE TABLE IF NOT EXISTS alert_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_sku TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_name TEXT NOT NULL DEFAULT '',
        discord_message_id TEXT NOT NULL,
        discord_channel_id TEXT NOT NULL,
        alert_timestamp TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS guild_channels (
        guild_id TEXT NOT NULL,
        channel_key TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        category_id TEXT,
        PRIMARY KEY(guild_id, channel_key)
      );

      CREATE INDEX IF NOT EXISTS idx_products_lookup 
      ON products(sku, store_id, location_name);

      CREATE INDEX IF NOT EXISTS idx_alert_records_lookup 
      ON alert_records(product_sku, store_id, location_name, is_active);
    `);

    // Clean up corrupted URLs and purge glitched prices from prior runs
    try {
      this.db.exec(`
        UPDATE products SET url = replace(url, '/en/en/', '/en/') WHERE url LIKE '%/en/en/%';
        DELETE FROM products WHERE price > 600 OR price <= 0;
      `);
    } catch {}
  }

  public getProduct(sku: string, storeId: string, locationName: string = ''): ProductStockItem | undefined {
    const row = this.db.prepare(`
      SELECT * FROM products 
      WHERE sku = ? AND store_id = ? AND location_name = ?
    `).get(sku, storeId, locationName) as any;

    if (!row) return undefined;

    return {
      sku: row.sku,
      storeId: row.store_id,
      title: row.title,
      url: row.url,
      imageUrl: row.image_url,
      price: row.price,
      currency: row.currency,
      inStock: Boolean(row.in_stock),
      locationName: row.location_name,
      setId: row.set_id,
      setName: row.set_name,
      setTier: row.set_tier,
      format: row.format,
      isLatestBundle: Boolean(row.is_latest_bundle),
      is30thAnniversary: Boolean(row.is_30th_anniversary),
      isOfficialSeller: true,
      publishedAt: row.published_at,
      lastChecked: row.last_checked
    };
  }

  public upsertProduct(item: ProductStockItem): { isNew: boolean; prevItem?: ProductStockItem } {
    const location = item.locationName || '';
    const prev = this.getProduct(item.sku, item.storeId, location);

    const now = new Date().toISOString();
    const stockChanged = !prev || prev.inStock !== item.inStock;
    const lastStockChange = stockChanged ? now : (prev?.lastChecked || now);

    const stmt = this.db.prepare(`
      INSERT INTO products (
        sku, store_id, title, url, image_url, price, currency,
        in_stock, location_name, set_id, set_name, set_tier, format,
        is_latest_bundle, is_30th_anniversary, published_at,
        last_stock_change, last_checked
      ) VALUES (
        @sku, @store_id, @title, @url, @image_url, @price, @currency,
        @in_stock, @location_name, @set_id, @set_name, @set_tier, @format,
        @is_latest_bundle, @is_30th_anniversary, @published_at,
        @last_stock_change, @last_checked
      )
      ON CONFLICT(sku, store_id, location_name) DO UPDATE SET
        title = excluded.title,
        url = excluded.url,
        image_url = excluded.image_url,
        price = excluded.price,
        in_stock = excluded.in_stock,
        set_id = excluded.set_id,
        set_name = excluded.set_name,
        set_tier = excluded.set_tier,
        format = excluded.format,
        is_latest_bundle = excluded.is_latest_bundle,
        is_30th_anniversary = excluded.is_30th_anniversary,
        published_at = excluded.published_at,
        last_stock_change = CASE 
          WHEN products.in_stock != excluded.in_stock THEN excluded.last_checked 
          ELSE products.last_stock_change 
        END,
        last_checked = excluded.last_checked
    `);

    stmt.run({
      sku: item.sku,
      store_id: item.storeId,
      title: item.title,
      url: item.url,
      image_url: item.imageUrl || null,
      price: item.price,
      currency: item.currency,
      in_stock: item.inStock ? 1 : 0,
      location_name: location,
      set_id: item.setId || null,
      set_name: item.setName || null,
      set_tier: item.setTier || null,
      format: item.format || null,
      is_latest_bundle: item.isLatestBundle ? 1 : 0,
      is_30th_anniversary: item.is30thAnniversary ? 1 : 0,
      published_at: item.publishedAt || null,
      last_stock_change: lastStockChange,
      last_checked: item.lastChecked || now
    });

    return {
      isNew: !prev,
      prevItem: prev
    };
  }

  public getActiveAlert(sku: string, storeId: string, locationName: string = ''): AlertRecord | undefined {
    return this.db.prepare(`
      SELECT * FROM alert_records 
      WHERE product_sku = ? AND store_id = ? AND location_name = ? AND is_active = 1
      ORDER BY id DESC LIMIT 1
    `).get(sku, storeId, locationName) as AlertRecord | undefined;
  }

  public saveAlertRecord(
    sku: string,
    storeId: string,
    locationName: string = '',
    messageId: string,
    channelId: string,
    status: string = 'IN_STOCK'
  ): void {
    // Invalidate prior active alerts for this product
    this.db.prepare(`
      UPDATE alert_records 
      SET is_active = 0 
      WHERE product_sku = ? AND store_id = ? AND location_name = ?
    `).run(sku, storeId, locationName);

    this.db.prepare(`
      INSERT INTO alert_records (
        product_sku, store_id, location_name, 
        discord_message_id, discord_channel_id, 
        alert_timestamp, is_active, last_status
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(sku, storeId, locationName, messageId, channelId, new Date().toISOString(), status);
  }

  public markAlertInactive(id: number, status: string = 'OUT_OF_STOCK'): void {
    this.db.prepare(`
      UPDATE alert_records 
      SET is_active = 0, last_status = ? 
      WHERE id = ?
    `).run(status, id);
  }

  public saveGuildChannel(guildId: string, channelKey: string, channelId: string, categoryId?: string): void {
    this.db.prepare(`
      INSERT INTO guild_channels (guild_id, channel_key, channel_id, category_id)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, channel_key) DO UPDATE SET
        channel_id = excluded.channel_id,
        category_id = excluded.category_id
    `).run(guildId, channelKey, channelId, categoryId || null);
  }

  public getGuildChannels(guildId: string): GuildChannelMapping[] {
    const rows = this.db.prepare(`
      SELECT guild_id, channel_key, channel_id, category_id 
      FROM guild_channels 
      WHERE guild_id = ?
    `).all(guildId) as any[];

    return rows.map(r => ({
      guildId: r.guild_id,
      channelKey: r.channel_key,
      channelId: r.channel_id,
      categoryId: r.category_id
    }));
  }

  public getAllGuildIds(): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT guild_id FROM guild_channels
    `).all() as { guild_id: string }[];
    return rows.map(r => r.guild_id);
  }

  public getStats() {
    const totalProducts = (this.db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
    const inStockProducts = (this.db.prepare('SELECT COUNT(*) as count FROM products WHERE in_stock = 1').get() as any).count;
    const activeAlerts = (this.db.prepare('SELECT COUNT(*) as count FROM alert_records WHERE is_active = 1').get() as any).count;
    const trackedGuilds = (this.db.prepare('SELECT COUNT(DISTINCT guild_id) as count FROM guild_channels').get() as any).count;

    return {
      totalProducts,
      inStockProducts,
      activeAlerts,
      trackedGuilds
    };
  }

  public close(): void {
    this.db.close();
  }
}
