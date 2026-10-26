import './polyfill.js';
import 'dotenv/config';
import { createDiscordClient } from './client.js';
import { TRACKED_STORES } from './config/stores.js';
import { BaseStoreMonitor } from './monitors/base.js';
import { BestBuyMonitor } from './monitors/bestbuyMonitor.js';
import { GameStopMonitor } from './monitors/gamestopMonitor.js';
import { PokemonCenterMonitor } from './monitors/pokemonCenterMonitor.js';
import { ShopifyMonitor } from './monitors/shopifyMonitor.js';
import { WalmartMonitor } from './monitors/walmartMonitor.js';
import { WooCommerceMonitor } from './monitors/woocommerceMonitor.js';
import { StockDatabase } from './services/db.js';
import { StockManager } from './services/stockManager.js';

console.log('----------------------------------------------------');
console.log('🚀 Starting Vancouver Pokémon TCG Stock Tracking Bot');
console.log('----------------------------------------------------');

// 1. Initialize SQLite Database
const db = new StockDatabase();
const stockManager = new StockManager(db);

// 2. Initialize Store Monitors
const monitors: BaseStoreMonitor[] = [];

for (const store of TRACKED_STORES) {
  if (!store.enabled) continue;

  if (store.id === 'zephyr-epic') {
    monitors.push(new WooCommerceMonitor(store));
  } else if (store.id === 'bestbuy-ca') {
    monitors.push(new BestBuyMonitor(store));
  } else if (store.id === 'gamestop-ca') {
    monitors.push(new GameStopMonitor(store));
  } else if (store.id === 'pokemoncenter-ca') {
    monitors.push(new PokemonCenterMonitor(store));
  } else if (store.id === 'walmart-ca') {
    monitors.push(new WalmartMonitor(store));
  } else if (
    store.id === 'house-of-cards' || 
    store.id === '401-games' || 
    store.id === 'hobbiesville' || 
    store.id === 'facetoface-games'
  ) {
    monitors.push(new ShopifyMonitor(store));
  }
}

console.log(`[Init] Loaded ${monitors.length} store monitors for Canada & Metro Vancouver.`);

// 3. Initialize Discord Client & Notifier
const { client, notifier } = createDiscordClient(db, stockManager, monitors);

// Connect Notifier to StockManager events
stockManager.addListener(async (event) => {
  await notifier.handleStockEvent(event);
});

// 4. Polling Scheduler Engine with Jitter
const timers: NodeJS.Timeout[] = [];

function startPollingEngine() {
  console.log('[Scheduler] Starting stock polling loop...');

  for (const monitor of monitors) {
    const intervalMs = monitor.storeConfig.pollIntervalSeconds * 1000;
    
    // Initial run with slight staggered delay
    const initialDelayMs = Math.floor(Math.random() * 5000) + 1000;

    const timer = setTimeout(async () => {
      await runMonitorPoll(monitor);

      // Recurring interval
      const intervalTimer = setInterval(async () => {
        await runMonitorPoll(monitor);
      }, intervalMs);

      timers.push(intervalTimer);
    }, initialDelayMs);

    timers.push(timer);
  }
}

async function runMonitorPoll(monitor: BaseStoreMonitor) {
  try {
    const products = await monitor.poll();
    if (products.length > 0) {
      await stockManager.processProductUpdates(products);
    }
  } catch (err) {
    console.error(`[Scheduler] Error during polling ${monitor.storeConfig.name}:`, err);
  }
}

// 5. Connect Bot to Discord
const token = process.env.DISCORD_BOT_TOKEN;

if (token && token !== 'your_bot_token_here') {
  client.login(token)
    .then(() => {
      startPollingEngine();
    })
    .catch((err) => {
      console.error('[DiscordBot] Login failed:', err);
      console.log('[Scheduler] Running polling loop in standalone monitor mode without Discord connection.');
      startPollingEngine();
    });
} else {
  console.warn('⚠️ No DISCORD_BOT_TOKEN provided in .env! Running in monitor/simulation mode.');
  console.warn('➡️ Fill in DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env to connect to your Discord server.');
  startPollingEngine();
}

// 6. Graceful Shutdown
function handleShutdown() {
  console.log('\n[Shutdown] Stopping polling loops and closing database...');
  for (const t of timers) clearInterval(t);
  client.destroy();
  db.close();
  console.log('[Shutdown] Bot safely shut down.');
  process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
