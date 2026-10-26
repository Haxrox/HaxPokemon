import { ProductStockItem, StoreConfig } from '../types/index.js';
import { BaseStoreMonitor } from './base.js';

export class MockMonitor extends BaseStoreMonitor {
  private mockItems: ProductStockItem[];

  constructor(storeConfig: StoreConfig, initialItems?: ProductStockItem[]) {
    super(storeConfig);
    this.mockItems = initialItems || [
      {
        sku: 'mock-30th-upc',
        storeId: storeConfig.id,
        title: 'Pokémon 30th Anniversary Ultra-Premium Collection Box',
        url: 'https://zephyrepic.com/product/pokemon-30th-anniversary-upc/',
        imageUrl: 'https://images.pokemontcg.io/logo-30th.png',
        price: 159.99,
        currency: 'CAD',
        inStock: true,
        locationName: 'Zephyr Epic (Surrey Flagship & Online)',
        sellerName: 'Zephyr Epic',
        isOfficialSeller: true,
        lastChecked: new Date().toISOString()
      },
      {
        sku: 'mock-prismatic-bundle',
        storeId: storeConfig.id,
        title: 'Pokémon TCG: Scarlet & Violet - Prismatic Evolutions Booster Bundle (6 Packs)',
        url: 'https://www.bestbuy.ca/en-ca/product/pokemon-prismatic-evolutions-booster-bundle',
        imageUrl: 'https://assets.bbycastatic.ca/sf/bundles/pokemon-prismatic.png',
        price: 37.99,
        currency: 'CAD',
        inStock: true,
        locationName: 'Best Buy Vancouver - Cambie St',
        sellerName: 'Best Buy Canada',
        isOfficialSeller: true,
        lastChecked: new Date().toISOString()
      },
      {
        sku: 'mock-151-bundle',
        storeId: storeConfig.id,
        title: 'Pokémon TCG: Scarlet & Violet - 151 Booster Bundle',
        url: 'https://houseofcards.ca/products/pokemon-151-booster-bundle',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0270/8258/8240/products/151bundle.png',
        price: 39.99,
        currency: 'CAD',
        inStock: false,
        locationName: 'House of Cards (Cloverdale & Online)',
        sellerName: 'House of Cards',
        isOfficialSeller: true,
        lastChecked: new Date().toISOString()
      }
    ];
  }

  public setMockStock(sku: string, inStock: boolean, price?: number): void {
    const item = this.mockItems.find(i => i.sku === sku);
    if (item) {
      item.inStock = inStock;
      if (price !== undefined) item.price = price;
      item.lastChecked = new Date().toISOString();
    }
  }

  public async poll(): Promise<ProductStockItem[]> {
    const inStockCount = this.mockItems.filter(i => i.inStock).length;
    this.updateHealthSuccess(this.mockItems.length, inStockCount);
    return JSON.parse(JSON.stringify(this.mockItems));
  }
}
