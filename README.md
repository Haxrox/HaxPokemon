# Vancouver Pokémon TCG Stock Tracking Discord Bot 🍁

A production-grade, real-time Pokémon Trading Card Game (TCG) stock and bundle tracking Discord bot built for collectors and players in **Greater Vancouver and across Canada** (a complete local alternative to subscription services like PokeToolz).

---

## 🌟 Key Features

- **🎉 Pokémon 30th Anniversary Tracking**:
  - High-priority detection for 30th Anniversary Ultra-Premium Collections (UPC), Anniversary Elite Trainer Boxes (ETBs), and 30th Anniversary Booster Bundles.
  - Automatically routes anniversary drops to a dedicated `#30th-anniversary` channel and pings `@30th Anniversary Alerts`.
- **🔥 Latest Bundle Chronology Engine**:
  - Dynamically classifies products by set release date and format.
  - Detects whether a bundle belongs to the newest expansion (*Prismatic Evolutions*, *Surging Sparks*, *151*, etc.) vs older reprint waves.
  - Automatically tags drops with `🔥 [LATEST BUNDLE]` and `🎉 [30th ANNIVERSARY]` badges in the Discord embed.
- **📍 Vancouver & Canadian Retailer Focus**:
  - **Metro Vancouver Local Game Stores (LGS)**: Zephyr Epic (Surrey flagship & online), House of Cards (Abbotsford / Cloverdale), Pastime Sports & Games (Metrotown, Langley, Tsawwassen), Magic Stronghold.
  - **Major Canadian Retailers**: Pokémon Center Canada, Best Buy Canada (online + Vancouver Cambie, Robson, Metrotown, Richmond in-store pickup), GameStop Canada (online + Pacific Centre, Metrotown, Richmond Centre in-store pickup), Walmart Canada (MSRP verified, filtering out 3rd party scalpers), Costco Canada, Toys "R" Us Canada.
  - **Canadian Online TCG Shops**: 401 Games, Hobbiesville, Face to Face Games.
- **⚡ Dual In-Stock & Sold-Out Notification System**:
  - 🟢 **In-Stock Alert**: High-impact rich embed with thumbnail image, direct store link, location tag, CAD price, and role ping.
  - 🔴 **Sold-Out Handling**: Automatically updates the original in-stock Discord embed to `[SOLD OUT]` with red styling **AND** posts a timestamped sold-out notice to `#out-of-stock-log`.
- **🛡️ Anti-Ghost Ping & Debounce**:
  - Built-in SQLite database tracks previous stock state, preventing alert spam, false alarms, or price fluctuation ping storms.
- **🛠️ Automated Server Setup (`/setup`)**:
  - Automatically provisions categorized Discord channels, roles, and permissions in your server with one click!

---

## 📂 Discord Server Channel Architecture

When you run `/setup`, the bot automatically structures your server into clean categories:

```
🍁 VANCOUVER & BC DROPS
   ├── #zephyr-epic           (Zephyr Epic drops - Surrey, BC)
   ├── #vancouver-instore     (Physical in-store pickup in Greater Vancouver)
   └── #bc-local-shops        (House of Cards, Pastime Sports, Magic Stronghold)

📦 ONLINE CANADIAN RETAIL
   ├── #pokemon-center-ca     (Official Pokémon Center Canada drops)
   ├── #gamestop-ca           (GameStop Canada online drops)
   ├── #bestbuy-ca            (Best Buy Canada MSRP stock)
   ├── #walmart-ca            (Walmart Canada - direct sold only)
   └── #costco-toysrus        (Costco tins & Toys "R" Us bundles)

⚡ HIGH PRIORITY ALERTS
   ├── #30th-anniversary      (Dedicated to 30th Anniversary UPCs & Bundles)
   ├── #booster-bundles-etbs  (Filtered exclusively for Bundles & ETBs)
   └── #out-of-stock-log      (Real-time log when tracked items sell out)

⚙️ BOT MANAGEMENT
   ├── #bot-status            (Live monitor health & uptime)
   └── #bot-commands          (Channel for running slash commands)
```

### Auto-Generated Notification Roles:
- `@Pokemon Alerts` (General sealed product drops)
- `@30th Anniversary Alerts` (Exclusive 30th Anniversary drops)
- `@Vancouver In-Store` (Physical stock in Metro Vancouver)
- `@ETB & Bundles` (Booster bundles and ETB drops)

---

## 🤖 Slash Commands

| Command | Description | Permissions |
| :--- | :--- | :--- |
| `/setup` | Automatically creates categories, channels, and alert roles in your Discord server. | Administrator / Manage Server |
| `/status` | Displays bot health, store latency, active products in database, and uptime. | Everyone |
| `/test-alert type:<choice>` | Simulates an in-stock drop (Latest Bundle, 30th Anniversary, or Sold-Out transition) to test permissions and formatting. | Administrator / Manage Server |
| `/check query:<text> store:<optional>` | Search current stock and prices for any set or bundle across monitored Canadian stores. | Everyone |

---

## 🚀 Setup & Installation Guide

### Step 1: Discord Developer Portal Setup
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Give your bot a name (e.g. `HaxPokemon Tracker`).
3. Set your Bot Icon:
   - Download or upload the generated avatar: [`assets/Bear.gif`](file:///home/haxrox/HaxPokemon/assets/Bear.gif) or the generated high-res Discord avatar in `brain/`.
4. Go to the **Bot** tab:
   - Click **Reset Token** and copy your token.
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Server Members Intent** (recommended)
     - ✅ **Message Content Intent** (recommended)
5. Go to **OAuth2 -> URL Generator**:
   - Select Scopes: `bot`, `applications.commands`
   - Select Bot Permissions:
     - `Manage Roles`
     - `Manage Channels`
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Read Message History`
     - `Mention Everyone` (to ping alert roles)
   - Copy the generated URL into your browser and invite the bot to your Discord server!

---

### Step 2: Environment Configuration
Edit your `.env` file:
```env
# Discord Credentials
DISCORD_BOT_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Optional: Set this to your Discord Server ID for instant slash command registration!
DISCORD_GUILD_ID=

# Polling Interval (in minutes, default: 2)
DEFAULT_POLL_INTERVAL_MINUTES=2

# Vancouver Default Postal Code prefix for Best Buy / Walmart in-store checks
VANCOUVER_POSTAL_CODE=V6B
```

---

### Step 3: Install Dependencies
Run the install command:
```bash
npm install
```
*(Wait until npm finishes downloading all packages before running tests or building).*

---

### Step 4: Run Tests (Vitest)
```bash
npm test
```
This runs the automated Vitest test suite verifying:
- ✅ Pokémon card filter engine (excludes plushies, binders, playmats)
- ✅ 30th Anniversary detection and set matching
- ✅ Latest bundle chronology logic
- ✅ Scalper seller filtering on Best Buy and Walmart
- ✅ SQLite stock transition engine (in-stock -> sold-out -> restock)

---

### Step 5: Start the Bot
```bash
# Start in production mode:
npm run build
npm start

# Or start in live-reload development mode:
npm run dev
```

---

## 🛠️ Standalone Scripts & Utilities

You can also run standalone utilities directly from your terminal:

```bash
# 1. Check live Vancouver store inventory directly in your terminal:
npx tsx scripts/check-vancouver.ts

# 2. Simulate a 30th Anniversary or Prismatic Evolutions drop locally:
npx tsx scripts/simulate-drop.ts

# 3. Manually deploy or refresh slash commands to Discord:
npx tsx scripts/deploy-commands.ts
```

---

## ❓ FAQ & Troubleshooting

### Why did `npm test` fail with `vitest: not found`?
**Vitest** is the automated testing framework included in `devDependencies`. If you run `npm test` before `npm install` finishes downloading all packages, the `vitest` executable is not yet present in `node_modules/.bin/`. Simply wait for `npm install` to complete, then run `npm test` again.

### Why do some Walmart or Best Buy items not alert?
The bot explicitly filters out third-party marketplace scalpers charging inflated prices. It only alerts on products sold directly by **Walmart Canada** or **Best Buy Canada** at official MSRP.

### How do I get instant slash command registration?
By default, Discord global slash commands can take up to 1 hour to propagate across Discord's CDN. To make commands appear instantly in your test server, paste your server's ID into `DISCORD_GUILD_ID` in your `.env` file!
