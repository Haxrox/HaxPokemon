import '../polyfill.js';
import { MonitorHealthStatus, ProductStockItem, StoreConfig } from '../types/index.js';

export abstract class BaseStoreMonitor {
  public storeConfig: StoreConfig;
  protected health: MonitorHealthStatus;

  constructor(storeConfig: StoreConfig) {
    this.storeConfig = storeConfig;
    this.health = {
      storeId: storeConfig.id,
      storeName: storeConfig.name,
      status: 'ONLINE',
      lastPollTimestamp: new Date().toISOString(),
      totalProductsChecked: 0,
      itemsInStock: 0
    };
  }

  public abstract poll(): Promise<ProductStockItem[]>;

  public getHealth(): MonitorHealthStatus {
    return { ...this.health };
  }

  /**
   * Safe HTTP fetch wrapper with rotated User-Agent, timeout, and error handling
   */
  protected async fetchSafe(url: string, headers: Record<string, string> = {}): Promise<string> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];

    const randomUa = userAgents[Math.floor(Math.random() * userAgents.length)];

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': randomUa,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-CA,en-US;q=0.9,en;q=0.8',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        ...headers
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  }

  protected consecutiveErrors = 0;
  protected lastLoggedErrorTime = 0;

  public shouldSkipDueToBackoff(): boolean {
    if (this.consecutiveErrors >= 2) {
      // Back off to checking once every 10 minutes instead of every 60-90s
      const tenMinutes = 10 * 60 * 1000;
      const lastPoll = new Date(this.health.lastPollTimestamp).getTime();
      return (Date.now() - lastPoll) < tenMinutes;
    }
    return false;
  }

  public logErrorOnce(msg: string): void {
    const now = Date.now();
    // Only log if 10 minutes have passed since last log to prevent spamming terminal
    if (now - this.lastLoggedErrorTime > 10 * 60 * 1000) {
      console.warn(`[${this.constructor.name}] ${this.storeConfig.name}: ${msg} (backing off for 10m)`);
      this.lastLoggedErrorTime = now;
    }
  }

  protected updateHealthSuccess(checkedCount: number, inStockCount: number): void {
    this.consecutiveErrors = 0;
    this.health.status = 'ONLINE';
    this.health.lastPollTimestamp = new Date().toISOString();
    this.health.totalProductsChecked = checkedCount;
    this.health.itemsInStock = inStockCount;
    this.health.lastErrorMessage = undefined;
  }

  protected updateHealthError(err: any): void {
    this.consecutiveErrors++;
    this.health.status = 'ERROR';
    this.health.lastPollTimestamp = new Date().toISOString();
    this.health.lastErrorMessage = err instanceof Error ? err.message : String(err);
  }
}
