import '../polyfill.js';
import * as cheerio from 'cheerio';
import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

export class WalmartMonitor extends BaseStoreMonitor {
  private searchPath: string;

  constructor(storeConfig: StoreConfig, searchPath: string = '/search?q=pokemon%20cards') {
    super(storeConfig);
    this.searchPath = searchPath;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.searchPath}`;
    const items: ProductStockItem[] = [];

    try {
      const html = await this.fetchSafe(url, {
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://www.walmart.ca/'
      });

      const $ = cheerio.load(html);
      let inStockCount = 0;

      $('[data-item-id], [data-automation-id="product"]').each((idx, elem) => {
        const el = $(elem);
        const title = el.find('[data-automation-id="product-title"], .normal, span.w_iUH7').text().trim();
        const link = el.find('a[href*="/ip/"]').first().attr('href') || '';
        let productUrl = link.startsWith('http') 
          ? link 
          : `https://www.walmart.ca${link.startsWith('/') ? '' : '/'}${link}`;
        productUrl = productUrl.replace('/en/en/', '/en/');

        const image = el.find('img').first().attr('src');
        
        // Extract only the primary current price (prevent concatenating current + old was-price)
        const priceEl = el.find('[data-automation-id="product-price"]').first();
        const rawPriceText = priceEl.length ? priceEl.text() : el.find('span.w_iUH7').first().text();
        const priceMatch = rawPriceText.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

        // Skip items with absurd price glitches or scalper price spikes > $500
        if (price <= 0 || price > 500) {
          return;
        }

        // Check seller: must be Walmart Canada directly, not third party!
        const sellerText = el.find('[data-automation-id="fulfillment-badge"], .gray').text().toLowerCase();
        const isOfficialSeller = sellerText.includes('walmart') || !sellerText.includes('sold and shipped by');

        if (!isOfficialSeller) {
          return; // Skip marketplace scalpers
        }

        const isOutOfStock = 
          el.find('.out-of-stock, [data-automation-id="out-of-stock"]').length > 0 ||
          /out of stock/i.test(el.text());

        const inStock = !isOutOfStock && price > 0;
        if (inStock) inStockCount++;

        const skuMatch = productUrl.match(/\/([A-Z0-9]+)(?:\?|$)/i);
        const sku = skuMatch ? skuMatch[1] : `wm-${idx}`;

        if (title) {
          items.push({
            sku: `walmart-${sku}`,
            storeId: this.storeConfig.id,
            title,
            url: productUrl,
            imageUrl: image,
            price,
            currency: 'CAD',
            inStock,
            locationName: 'Walmart Canada Online & Metro Vancouver Pickup',
            sellerName: 'Walmart Canada',
            isOfficialSeller: true,
            lastChecked: new Date().toISOString()
          });
        }
      });

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err) {
      this.updateHealthError(err);
      console.error(`[WalmartMonitor] Error polling ${this.storeConfig.name}:`, err);
      return [];
    }
  }
}
