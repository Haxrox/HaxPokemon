# Vancouver Pokémon TCG Stock Tracking Discord Bot 🍁

[![CI](https://github.com/Haxrox/HaxPokemon/actions/workflows/ci.yml/badge.svg)](https://github.com/Haxrox/HaxPokemon/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.20.0-339933.svg?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18.svg?logo=vitest)](https://vitest.dev/)

A production-grade, real-time Pokémon Trading Card Game (TCG) stock and bundle tracking Discord bot built for collectors and players in **Greater Vancouver and across Canada** — providing a free, transparent, self-hosted alternative to paid subscription alert services like PokeToolz.

---

## 🌟 Key Features

- **🎉 Pokémon 30th Anniversary Tracking**:
  - High-priority detection for upcoming 30th Anniversary releases (Ultra-Premium Collections, Anniversary Elite Trainer Boxes, Booster Bundles).
  - Automatically routes anniversary drops to a dedicated `#30th-anniversary` channel and tags `@30th Anniversary Alerts`.
- **🔥 Latest Bundle Chronology Engine**:
  - Dynamically classifies products by set release date and format.
  - Identifies modern high-demand sets (*Prismatic Evolutions*, *Surging Sparks*, *151*, *Paldean Fates*) vs reprint/vintage waves.
  - Badges drops with `🔥 [LATEST BUNDLE]` and `🎉 [30th ANNIVERSARY]` in rich embeds.
- **🛡️ Strict Franchise Filter & Anti-Noise Shield**:
  - Explicit validation prevents false alarms from non-card goods (plushies, binders, playmats, figures).
  - Strictly blocks competing TCGs (*Magic: The Gathering*, *Disney Lorcana*, *One Piece*, *Cyberpunk*, *Union Arena*, sports cards).
  - Marketplace scalper defense: filters out third-party inflated marketplace listings on Walmart and Best Buy, only alerting on direct retail MSRP.
- **📍 Vancouver & Canadian Retailer Coverage**:
  - **Metro Vancouver LGS**: House of Cards (Abbotsford / Cloverdale), Pastime Sports & Games (Metrotown, Langley, Tsawwassen Mills), Zephyr Epic (Surrey flagship & online).
  - **Major Canadian Retailers**: Best Buy Canada (online + Vancouver Cambie, Robson, Metrotown, Richmond in-store pickup), Walmart Canada (online + Grandview & Metrotown Supercentres), GameStop Canada, Pokémon Center Canada.
  - **Top Canadian Online TCG Stores**: 401 Games, Hobbiesville, Face to Face Games.
- **⚡ Dual In-Stock & Sold-Out Notification System**:
  - 🟢 **In-Stock Alert**: High-impact rich embed with thumbnail image, direct product page button, location tag, CAD price, and role ping.
  - 🔴 **Sold-Out Handling**: Automatically updates the original in-stock Discord embed in-place to `[SOLD OUT]` with red styling **AND** posts a timestamped notice to `#out-of-stock-log`.
- **🗄️ SQLite State Machine & Anti-Spam Debounce**:
  - Local persistent SQLite database (`better-sqlite3`) tracks product stock transitions (`NEW_STOCK`, `RESTOCK`, `OUT_OF_STOCK`, `PRICE_CHANGE`) to eliminate duplicate alerts and ping storms.
- **🛠️ Automated Server Provisioning (`/setup`)**:
  - Automatically configures categorized Discord channels, roles, and permissions in your server with a single command.

---

## 🔒 Security & Secrets Protection

This repository follows strict security practices to ensure credentials and bot tokens are never exposed:

1. **Environment File Isolation**:
   - The actual `.env` file containing your `DISCORD_BOT_TOKEN` and credentials is **strictly ignored by git** in [`.gitignore`](.gitignore).
   - A sanitized template file [`.env.example`](.env.example) is provided for configuration.
2. **Automated GitHub Actions CI Security Audit**:
   - Every commit and pull request runs an automated security audit in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
   - The workflow checks that no `.env` files are tracked and scans all files for exposed token patterns.
3. **Database & Cache Exclusions**:
   - SQLite databases (`*.sqlite`, `*.sqlite-wal`, `data/`), logs (`*.log`), and build artifacts (`dist/`) are excluded from version control.

> [!IMPORTANT]
> **Never commit your `.env` file or Discord Bot Token to any git branch.** If a token is ever accidentally shared, immediately invalidate and reset it in the [Discord Developer Portal](https://discord.com/developers/applications).

---

## 📂 Discord Server Channel Architecture

Running the `/setup` slash command automatically generates a clean, organized server layout:

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

### Auto-Generated Notification Roles
- `@Pokemon Alerts` (General sealed product drops)
- `@30th Anniversary Alerts` (Exclusive 30th Anniversary drops)
- `@Vancouver In-Store` (Physical stock in Metro Vancouver)
- `@ETB & Bundles` (Booster bundles and ETB drops)

---

## 🤖 Slash Commands

| Command | Description | Options | Required Permissions |
| :--- | :--- | :--- | :--- |
| `/setup` | Automatically creates categories, channels, and alert roles in your Discord server. | None | `Administrator` or `Manage Server` |
| `/status` | Displays bot health, store monitor latency, active database items, and uptime. | None | Everyone |
| `/check` | Search current stock and prices across all monitored Canadian and Vancouver stores. | `query` (required), `max_price` (default: $500), `sort` (low-to-high, in-stock first), `store` (optional filter) | Everyone |
| `/test-alert` | Simulates an in-stock drop or sold-out transition to test channel routing and embed formatting. | `type` (`LATEST_BUNDLE`, `30TH_ANNIVERSARY`, `OUT_OF_STOCK`) | `Administrator` or `Manage Server` |

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: `v18.20.0` or higher (Node 20+ LTS recommended)
- **npm**: `v10.0.0` or higher
- A Discord Bot Application from the [Discord Developer Portal](https://discord.com/developers/applications)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Haxrox/HaxPokemon.git
cd HaxPokemon
```

### Step 2: Configure Environment Variables
Copy the template and fill in your Discord credentials:
```bash
cp .env.example .env
```

Open `.env` in your editor:
```env
# Discord Credentials (from Developer Portal -> Application -> Bot)
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Optional: Set your test server ID for instant command registration (avoids 1hr CDN delay)
DISCORD_GUILD_ID=

# Polling interval in minutes (default: 2)
DEFAULT_POLL_INTERVAL_MINUTES=2

# Vancouver Default Postal Code prefix for Best Buy / Walmart in-store checks
VANCOUVER_POSTAL_CODE=V6B

# SQLite Database Location
DATABASE_PATH=./data/pokemon_stock.sqlite
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Tests
Validate the Pokémon catalog filter and stock state machine:
```bash
npm test
```

### Step 5: Start the Bot

**Production Mode:**
```bash
npm run build
npm start
```

**Development Mode (Hot Reload with `tsx`):**
```bash
npm run dev
```

---

## 🤖 Discord Bot Setup & Permissions Checklist

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application**.
2. Under the **Bot** tab:
   - Click **Reset Token** and copy the token into your `.env` file as `DISCORD_BOT_TOKEN`.
   - Enable **Server Members Intent** and **Message Content Intent** under *Privileged Gateway Intents*.
3. Under the **OAuth2 -> URL Generator** tab:
   - **Scopes**: `bot`, `applications.commands`
   - **Bot Permissions**:
     - `Manage Roles` (required by `/setup` to generate alert roles)
     - `Manage Channels` (required by `/setup` to generate categories and channels)
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Read Message History`
     - `Mention Everyone` (for pinging `@30th Anniversary Alerts`, `@Pokemon Alerts`, etc.)
4. Open the generated invitation URL in your browser to invite the bot to your Discord server.
5. In your Discord server, run `/setup` in any text channel to initialize the channels and roles.

---

## 🧪 Testing & Continuous Integration

This project uses [Vitest](https://vitest.dev/) for high-speed unit testing.

```bash
# Run all tests once:
npm test

# Run tests in watch mode during development:
npx vitest

# Run only catalog filter tests:
npm test -- tests/pokemonCatalog.test.ts
```

### GitHub Actions CI
The workflow in `.github/workflows/ci.yml` runs on every push and pull request to `main`:
- **Security Audit**: Scans for `.env` files and leaked credentials.
- **Matrix Testing**: Tests against Node.js `18.x`, `20.x`, and `22.x`.
- **TypeScript Compilation**: Verifies full type safety with `tsc`.
- **Vitest Suite**: Verifies catalog filtering, format detection, and SQLite transition handling.

---

## 🛠️ Standalone Scripts

```bash
# Manually deploy or refresh slash commands to Discord:
npx tsx scripts/deploy-commands.ts
```

---

## ❓ FAQ & Troubleshooting

### Why did `npm test` fail with `vitest: not found`?
Vitest is a developer dependency. Ensure `npm install` has completed fully before executing `npm test`.

### Why does `/check` filter out items above $500 by default?
Certain marketplace listings and glitched third-party scrape entries list booster boxes for thousands of dollars. The `/check` command applies a sensible `$500 CAD` price ceiling by default (customizable via the optional `max_price` parameter) and sorts results from lowest to highest price.

### Why do some store monitors back off?
Retailers like GameStop Canada, Zephyr Epic, and Pokémon Center deploy enterprise anti-bot defenses (Cloudflare Turnstile, Imperva Incapsula). To prevent noisy terminal logs, the bot automatically backs off failed stores to a 10-minute retry interval while keeping active stores (Best Buy, Walmart, House of Cards, Pastime Sports, 401 Games, Hobbiesville, Face to Face Games) streaming in real time.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
