import '../polyfill.js';
import * as cheerio from 'cheerio';
import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

interface WcStoreProduct {
  id: number;
  name: string;
  permalink: string;
  sku: string;
  is_in_stock: boolean;
  prices: {
    price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  images: { src: string }[];
}

export class WooCommerceMonitor extends BaseStoreMonitor {
  private apiEndpoint: string;

  constructor(storeConfig: StoreConfig, apiEndpoint: string = '/wp-json/wc/store/v1/products?search=pokemon&per_page=50') {
    super(storeConfig);
    this.apiEndpoint = apiEndpoint;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.apiEndpoint}`;
    const items: ProductStockItem[] = [];

    // 1. Primary Strategy: WooCommerce Store API (Bypasses Cloudflare HTML Bot Challenge)
    try {
      const jsonText = await this.fetchSafe(url, {
        'Accept': 'application/json',
        'Referer': this.storeConfig.baseUrl
      });

      const products: WcStoreProduct[] = JSON.parse(jsonText);
      let inStockCount = 0;

      for (const p of products) {
        const minorUnit = p.prices.currency_minor_unit ?? 2;
        const rawPrice = parseFloat(p.prices.price) || 0;
        const price = minorUnit > 0 ? rawPrice / Math.pow(10, minorUnit) : rawPrice;
        const inStock = Boolean(p.is_in_stock);
        if (inStock) inStockCount++;

        items.push({
          sku: `${this.storeConfig.id}-${p.sku || p.id}`,
          storeId: this.storeConfig.id,
          title: p.name,
          url: p.permalink,
          imageUrl: p.images?.[0]?.src,
          price,
          currency: p.prices.currency_code || 'CAD',
          inStock,
          locationName: 'Zephyr Epic (Surrey Flagship & Online)',
          sellerName: 'Zephyr Epic',
          isOfficialSeller: true,
          lastChecked: new Date().toISOString()
        });
      }

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (apiErr: any) {
      // 2. Fallback: Parse XML Feed if Store API fails
      try {
        const feedUrl = `${this.storeConfig.baseUrl}/product-category/pokemon/feed/`;
        const xml = await this.fetchSafe(feedUrl);
        const $ = cheerio.load(xml, { xmlMode: true });

        $('item').each((idx, elem) => {
          const el = $(elem);
          const title = el.find('title').text().trim();
          const link = el.find('link').text().trim();

          if (title && link) {
            items.push({
              sku: `${this.storeConfig.id}-feed-${idx}`,
              storeId: this.storeConfig.id,
              title,
              url: link,
              price: 0,
              currency: 'CAD',
              inStock: true,
              locationName: 'Zephyr Epic (Surrey Flagship & Online)',
              sellerName: 'Zephyr Epic',
              isOfficialSeller: true,
              lastChecked: new Date().toISOString()
            });
          }
        });

        if (items.length > 0) {
          this.updateHealthSuccess(items.length, items.length);
          return items;
        }
      } catch {}

      this.updateHealthError(apiErr);
      this.logErrorOnce(apiErr.message || 'Access blocked by Cloudflare');
      return [];
    }
  }
}
