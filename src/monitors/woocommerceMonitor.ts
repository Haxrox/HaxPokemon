import '../polyfill.js';
import * as cheerio from 'cheerio';
import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

export class WooCommerceMonitor extends BaseStoreMonitor {
  private categoryPath: string;

  constructor(storeConfig: StoreConfig, categoryPath: string = '/product-category/pokemon/') {
    super(storeConfig);
    this.categoryPath = categoryPath;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.categoryPath}`;
    const items: ProductStockItem[] = [];

    try {
      const html = await this.fetchSafe(url);
      const $ = cheerio.load(html);

      let inStockCount = 0;

      // 1. First attempt: Parse Schema.org JSON-LD microdata if present
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const json = JSON.parse($(elem).html() || '{}');
          const products = json['@graph'] || (Array.isArray(json) ? json : [json]);

          for (const item of products) {
            if (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') {
              const offer = item.offers?.[0] || item.offers;
              const inStock = offer?.availability?.includes('InStock') ?? true;
              const price = parseFloat(offer?.price) || 0;
              const sku = item.sku || item['@id'] || `${item.name}`;

              if (inStock) inStockCount++;

              items.push({
                sku: `${this.storeConfig.id}-${sku}`,
                storeId: this.storeConfig.id,
                title: item.name,
                url: offer?.url || item.url || url,
                imageUrl: item.image?.url || (typeof item.image === 'string' ? item.image : undefined),
                price,
                currency: offer?.priceCurrency || 'CAD',
                inStock,
                locationName: 'Zephyr Epic (Surrey Flagship & Online)',
                sellerName: 'Zephyr Epic',
                isOfficialSeller: true,
                lastChecked: new Date().toISOString()
              });
            }
          }
        } catch {
          // Continue to HTML fallback
        }
      });

      // 2. If JSON-LD didn't yield products, parse WooCommerce HTML product cards
      if (items.length === 0) {
        $('li.product, .product-item, div.product').each((idx, elem) => {
          const el = $(elem);
          const linkEl = el.find('.woocommerce-LoopProduct-link, a.woocommerce-loop-product__link, a[href*="/product/"]').first();
          const title = el.find('.woocommerce-loop-product__title, h2.product-title, .title').text().trim();
          const productUrl = linkEl.attr('href') || url;
          const image = el.find('img').first().attr('src') || el.find('img').first().attr('data-src');
          
          // Price parsing (e.g. "$49.99" or "<ins>$39.99</ins>")
          const priceText = el.find('ins .woocommerce-Price-amount, .woocommerce-Price-amount, .price').first().text();
          const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

          // Out-of-stock indicators in WooCommerce
          const isOutOfStock = 
            el.hasClass('outofstock') || 
            el.find('.out-of-stock, .badge-out-of-stock').length > 0 ||
            /sold out|out of stock/i.test(el.text());

          const inStock = !isOutOfStock;
          if (inStock) inStockCount++;

          const sku = `${this.storeConfig.id}-${idx}-${title.substring(0, 15).replace(/\s+/g, '')}`;

          if (title) {
            items.push({
              sku,
              storeId: this.storeConfig.id,
              title,
              url: productUrl,
              imageUrl: image,
              price,
              currency: 'CAD',
              inStock,
              locationName: 'Zephyr Epic (Surrey Flagship & Online)',
              sellerName: 'Zephyr Epic',
              isOfficialSeller: true,
              lastChecked: new Date().toISOString()
            });
          }
        });
      }

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err: any) {
      // Fallback: Attempt RSS Feed parsing (Cloudflare typically permits RSS XML feeds)
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

      this.updateHealthError(err);
      console.warn(`[WooCommerceMonitor] ${this.storeConfig.name}: ${err.message || 'Access limited by Cloudflare'}`);
      return [];
    }
  }
}
