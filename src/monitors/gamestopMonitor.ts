import '../polyfill.js';
import * as cheerio from 'cheerio';
import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

export class GameStopMonitor extends BaseStoreMonitor {
  private searchPath: string;

  constructor(storeConfig: StoreConfig, searchPath: string = '/SearchResult/QuickSearch?q=pokemon%20cards') {
    super(storeConfig);
    this.searchPath = searchPath;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.searchPath}`;
    const items: ProductStockItem[] = [];

    try {
      const html = await this.fetchSafe(url);
      const $ = cheerio.load(html);

      let inStockCount = 0;

      $('.product, .productBox, .card').each((idx, elem) => {
        const el = $(elem);
        const titleEl = el.find('.prodTitle a, a.product-title, .title a').first();
        const title = titleEl.text().trim();
        const relativeUrl = titleEl.attr('href') || '';
        const productUrl = relativeUrl.startsWith('http') ? relativeUrl : `${this.storeConfig.baseUrl}${relativeUrl}`;
        const image = el.find('img').first().attr('src') || el.find('img').first().attr('data-src');

        const priceText = el.find('.price, .prodPrice, .actualPrice').first().text();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        // Check stock badges (e.g. "Add to Cart", "Out of Stock", "Not Available Online")
        const isUnavailable = 
          el.find('.outOfStock, .unavailable, .badge-sold-out').length > 0 ||
          /out of stock|currently unavailable/i.test(el.text());

        const inStock = !isUnavailable && price > 0;
        if (inStock) inStockCount++;

        const skuMatch = productUrl.match(/\/(\d+)(?:\?|$)/);
        const sku = skuMatch ? skuMatch[1] : `${idx}`;

        if (title) {
          items.push({
            sku: `gamestop-${sku}`,
            storeId: this.storeConfig.id,
            title,
            url: productUrl,
            imageUrl: image,
            price,
            currency: 'CAD',
            inStock,
            locationName: 'GameStop Canada Online & Vancouver Stores',
            sellerName: 'GameStop Canada',
            isOfficialSeller: true,
            lastChecked: new Date().toISOString()
          });
        }
      });

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err: any) {
      this.updateHealthError(err);
      this.logErrorOnce(err.message || 'DNS / Network lookup issue');
      return [];
    }
  }
}
