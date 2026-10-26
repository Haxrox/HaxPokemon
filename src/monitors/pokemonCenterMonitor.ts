import '../polyfill.js';
import * as cheerio from 'cheerio';
import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

export class PokemonCenterMonitor extends BaseStoreMonitor {
  private categoryPath: string;

  constructor(storeConfig: StoreConfig, categoryPath: string = '/category/trading-card-game') {
    super(storeConfig);
    this.categoryPath = categoryPath;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.categoryPath}`;
    const items: ProductStockItem[] = [];

    try {
      const html = await this.fetchSafe(url, {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-CA,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate'
      });

      const $ = cheerio.load(html);
      let inStockCount = 0;

      // Parse JSON-LD if present
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const json = JSON.parse($(elem).html() || '{}');
          const products = json['@graph'] || (Array.isArray(json) ? json : [json]);

          for (const item of products) {
            if (item['@type'] === 'Product') {
              const offer = item.offers?.[0] || item.offers;
              const inStock = offer?.availability?.includes('InStock') ?? false;
              const price = parseFloat(offer?.price) || 0;
              const sku = item.sku || `${item.name}`;

              if (inStock) inStockCount++;

              items.push({
                sku: `pc-${sku}`,
                storeId: this.storeConfig.id,
                title: item.name,
                url: offer?.url || item.url || url,
                imageUrl: item.image,
                price,
                currency: 'CAD',
                inStock,
                locationName: 'Pokémon Center Canada (Official Drops)',
                sellerName: 'Pokémon Center',
                isOfficialSeller: true,
                lastChecked: new Date().toISOString()
              });
            }
          }
        } catch {
          // Ignore parse errors and fall through
        }
      });

      // Fallback HTML cards if JSON-LD was absent
      if (items.length === 0) {
        $('[data-sku], .product-tile, .product-card').each((idx, elem) => {
          const el = $(elem);
          const title = el.find('.product-title, .title, h3').text().trim();
          const relativeUrl = el.find('a').attr('href') || '';
          const productUrl = relativeUrl.startsWith('http') ? relativeUrl : `${this.storeConfig.baseUrl}${relativeUrl}`;
          const image = el.find('img').first().attr('src');
          const priceText = el.find('.product-price, .price').first().text();
          const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

          const isSoldOut = 
            el.find('.out-of-stock, .sold-out-badge').length > 0 ||
            /out of stock|sold out/i.test(el.text());

          const inStock = !isSoldOut;
          if (inStock) inStockCount++;

          const sku = el.attr('data-sku') || `pc-${idx}-${title.substring(0, 10).replace(/\s+/g, '')}`;

          if (title) {
            items.push({
              sku: `pc-${sku}`,
              storeId: this.storeConfig.id,
              title,
              url: productUrl,
              imageUrl: image,
              price,
              currency: 'CAD',
              inStock,
              locationName: 'Pokémon Center Canada (Official Drops)',
              sellerName: 'Pokémon Center',
              isOfficialSeller: true,
              lastChecked: new Date().toISOString()
            });
          }
        });
      }

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err: any) {
      this.updateHealthError(err);
      console.warn(`[PokemonCenterMonitor] Pokémon Center Canada: ${err.message || 'Protected by Cloudflare'}`);
      return [];
    }
  }
}
