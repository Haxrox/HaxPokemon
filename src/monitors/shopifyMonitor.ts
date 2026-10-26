import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string;
  available: boolean;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  published_at: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export class ShopifyMonitor extends BaseStoreMonitor {
  private collectionPath: string;

  constructor(storeConfig: StoreConfig, collectionPath: string = '/products.json?limit=100') {
    super(storeConfig);
    this.collectionPath = collectionPath;
  }

  public async poll(): Promise<ProductStockItem[]> {
    const url = `${this.storeConfig.baseUrl}${this.collectionPath}`;
    const items: ProductStockItem[] = [];

    try {
      const jsonText = await this.fetchSafe(url);
      const data: ShopifyProductsResponse = JSON.parse(jsonText);

      let inStockCount = 0;

      for (const p of data.products) {
        // Find best variant (prefer available)
        const availableVariant = p.variants.find(v => v.available) || p.variants[0];
        if (!availableVariant) continue;

        const isAvailable = p.variants.some(v => v.available);
        if (isAvailable) inStockCount++;

        const price = parseFloat(availableVariant.price) || 0;
        const productUrl = `${this.storeConfig.baseUrl}/products/${p.handle}`;
        const imageUrl = p.images?.[0]?.src;
        const sku = availableVariant.sku || `${p.id}`;

        items.push({
          sku: `${this.storeConfig.id}-${sku}`,
          storeId: this.storeConfig.id,
          title: p.title,
          url: productUrl,
          imageUrl,
          price,
          currency: 'CAD',
          inStock: isAvailable,
          locationName: 'Online Drop (Ships to Vancouver)',
          sellerName: p.vendor || this.storeConfig.name,
          isOfficialSeller: true,
          publishedAt: p.published_at || p.created_at,
          lastChecked: new Date().toISOString()
        });
      }

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err) {
      this.updateHealthError(err);
      console.error(`[ShopifyMonitor] Error polling ${this.storeConfig.name}:`, err);
      return [];
    }
  }
}
