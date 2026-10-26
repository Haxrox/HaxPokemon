import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

interface BestBuyProduct {
  sku: string;
  name: string;
  productUrl: string;
  thumbnailImage?: string;
  regularPrice: number;
  salePrice?: number;
  isAvailableForPickup: boolean;
  isAvailableForDelivery: boolean;
  seller?: {
    name: string;
  };
}

interface BestBuySearchResponse {
  total: number;
  products: BestBuyProduct[];
}

export class BestBuyMonitor extends BaseStoreMonitor {
  private postalCode: string;

  constructor(storeConfig: StoreConfig, postalCode: string = process.env.VANCOUVER_POSTAL_CODE || 'V6B') {
    super(storeConfig);
    this.postalCode = postalCode;
  }

  public async poll(): Promise<ProductStockItem[]> {
    // Best Buy Canada public search API endpoint
    const url = `https://www.bestbuy.ca/api/v2/json/search?query=pokemon%20trading%20card&lang=en-CA&postalCode=${this.postalCode}&pageSize=40`;
    const items: ProductStockItem[] = [];

    try {
      const jsonText = await this.fetchSafe(url, {
        'Accept': 'application/json',
        'Referer': 'https://www.bestbuy.ca/en-ca/search?search=pokemon'
      });

      const data: BestBuySearchResponse = JSON.parse(jsonText);
      let inStockCount = 0;

      for (const p of data.products || []) {
        const sellerName = p.seller?.name || 'Best Buy Canada';
        const isOfficial = sellerName.toLowerCase().includes('best buy');

        // Only alert on items sold directly by Best Buy Canada (ignore marketplace scalpers)
        if (!isOfficial) {
          continue;
        }

        const price = p.salePrice || p.regularPrice || 0;
        const productUrl = p.productUrl.startsWith('http') 
          ? p.productUrl 
          : `https://www.bestbuy.ca${p.productUrl}`;

        // Online delivery availability
        const onlineAvailable = p.isAvailableForDelivery;
        if (onlineAvailable) inStockCount++;

        items.push({
          sku: `bestbuy-${p.sku}-online`,
          storeId: this.storeConfig.id,
          title: p.name,
          url: productUrl,
          imageUrl: p.thumbnailImage,
          price,
          currency: 'CAD',
          inStock: onlineAvailable,
          locationName: 'Best Buy Canada Online (Ships to Vancouver)',
          sellerName,
          isOfficialSeller: true,
          lastChecked: new Date().toISOString()
        });

        // If store pickup is active, add localized Vancouver store items
        if (p.isAvailableForPickup && this.storeConfig.vancouverLocations) {
          for (const loc of this.storeConfig.vancouverLocations) {
            items.push({
              sku: `bestbuy-${p.sku}-${loc.id}`,
              storeId: this.storeConfig.id,
              title: p.name,
              url: productUrl,
              imageUrl: p.thumbnailImage,
              price,
              currency: 'CAD',
              inStock: true,
              locationName: `Best Buy In-Store (${loc.name})`,
              storeNumber: loc.storeNumber,
              sellerName,
              isOfficialSeller: true,
              lastChecked: new Date().toISOString()
            });
            inStockCount++;
          }
        }
      }

      this.updateHealthSuccess(items.length, inStockCount);
      return items;
    } catch (err) {
      this.updateHealthError(err);
      console.error(`[BestBuyMonitor] Error polling ${this.storeConfig.name}:`, err);
      return [];
    }
  }
}
