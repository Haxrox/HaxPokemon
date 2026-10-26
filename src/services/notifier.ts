import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Client, 
  EmbedBuilder, 
  TextChannel 
} from 'discord.js';
import { getStoreConfig } from '../config/stores.js';
import { ProductStockItem, StockTransitionEvent } from '../types/index.js';
import { StockDatabase } from './db.js';

export class DiscordNotifier {
  private client: Client;
  private db: StockDatabase;

  constructor(client: Client, db: StockDatabase) {
    this.client = client;
    this.db = db;
  }

  /**
   * Main handler for stock transition events emitted by StockManager
   */
  public async handleStockEvent(event: StockTransitionEvent): Promise<void> {
    if (event.transitionType === 'NEW_STOCK' || event.transitionType === 'RESTOCK') {
      await this.dispatchInStockAlert(event.product);
    } else if (event.transitionType === 'OUT_OF_STOCK') {
      await this.dispatchOutOfStockAlert(event.product, event.activeDiscordMessageId, event.activeDiscordChannelId);
    }
  }

  /**
   * Builds and dispatches rich In-Stock embeds across configured guild channels
   */
  public async dispatchInStockAlert(product: ProductStockItem): Promise<void> {
    const store = getStoreConfig(product.storeId);
    const storeName = store?.name || product.storeId;
    const storeLogo = store?.logoUrl;

    // Determine embed color
    let embedColor = 0x2ECC71; // Green
    if (product.is30thAnniversary) {
      embedColor = 0xF1C40F; // Gold for 30th Anniversary
    } else if (product.format === 'ULTRA_PREMIUM_COLLECTION' || product.format === 'ELITE_TRAINER_BOX') {
      embedColor = 0x9B59B6; // Purple for Premium/ETB
    }

    // Title badge
    let badge = '🟢 [IN STOCK]';
    if (product.is30thAnniversary) {
      badge = '🎉 [30th ANNIVERSARY IN-STOCK]';
    } else if (product.isLatestBundle) {
      badge = '🔥 [LATEST BUNDLE IN-STOCK]';
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`${badge} ${product.title}`)
      .setURL(product.url)
      .setDescription(`**${storeName}** has reported available stock!`)
      .addFields(
        { name: '💰 Price', value: `$${product.price.toFixed(2)} ${product.currency}`, inline: true },
        { name: '📍 Location', value: product.locationName || 'Online (Ships to Vancouver)', inline: true },
        { name: '📦 Set & Format', value: `${product.setName || 'Sealed TCG'} • ${product.format || 'Card Pack'}`, inline: true },
        { name: '⚡ Status', value: '🟢 Available Now / Ready to Order', inline: true },
        { name: '🕒 Detected At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setFooter({ 
        text: `Vancouver Pokémon Stock Tracker • Verified Seller: ${product.sellerName || storeName}`,
        iconURL: storeLogo 
      })
      .setTimestamp();

    if (product.imageUrl) {
      embed.setThumbnail(product.imageUrl);
    }

    // Action button
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('🛒 View & Order Product')
        .setStyle(ButtonStyle.Link)
        .setURL(product.url)
    );

    // Send to all connected guilds
    const guildIds = this.db.getAllGuildIds();

    for (const guildId of guildIds) {
      try {
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (!guild) continue;

        const channels = this.db.getGuildChannels(guildId);
        const targetChannelKeys = this.determineTargetChannelKeys(product, store?.channelKey);

        // Determine Role Ping string
        const roleMention = this.determineRoleMention(guild, product);

        for (const channelKey of targetChannelKeys) {
          const mapping = channels.find(c => c.channelKey === channelKey);
          if (!mapping) continue;

          const channel = await this.client.channels.fetch(mapping.channelId).catch(() => null);
          if (!channel || !(channel instanceof TextChannel)) continue;

          const sentMessage = await channel.send({
            content: roleMention || undefined,
            embeds: [embed],
            components: [actionRow]
          });

          // Save message ID to database for dual out-of-stock update
          this.db.saveAlertRecord(
            product.sku,
            product.storeId,
            product.locationName || '',
            sentMessage.id,
            channel.id,
            'IN_STOCK'
          );
        }
      } catch (err) {
        console.error(`[DiscordNotifier] Error dispatching alert to guild ${guildId}:`, err);
      }
    }
  }

  /**
   * Dual Sold-Out Alert:
   * 1. Updates original in-stock message to show [SOLD OUT] with red styling
   * 2. Dispatches an out-of-stock notice to #out-of-stock-log
   */
  public async dispatchOutOfStockAlert(
    product: ProductStockItem,
    activeMessageId?: string,
    activeChannelId?: string
  ): Promise<void> {
    const store = getStoreConfig(product.storeId);
    const storeName = store?.name || product.storeId;

    // 1. In-place edit of the original in-stock message
    if (activeMessageId && activeChannelId) {
      try {
        const channel = await this.client.channels.fetch(activeChannelId).catch(() => null);
        if (channel && channel instanceof TextChannel) {
          const originalMessage = await channel.messages.fetch(activeMessageId).catch(() => null);
          if (originalMessage && originalMessage.embeds.length > 0) {
            const originalEmbed = originalMessage.embeds[0];
            
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
              .setColor(0xE74C3C) // Red
              .setTitle(`🔴 [SOLD OUT] ${product.title}`)
              .setFields(
                { name: '💰 Price', value: `$${product.price.toFixed(2)} ${product.currency}`, inline: true },
                { name: '📍 Location', value: product.locationName || 'Online', inline: true },
                { name: '📦 Set & Format', value: `${product.setName || 'Sealed TCG'} • ${product.format || 'Card Pack'}`, inline: true },
                { name: '⚡ Status', value: '🔴 SOLD OUT / Out of Stock', inline: true },
                { name: '🕒 Sold Out At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
              );

            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View Product (Sold Out)')
                .setStyle(ButtonStyle.Link)
                .setURL(product.url)
            );

            await originalMessage.edit({
              embeds: [updatedEmbed],
              components: [disabledRow]
            });
          }
        }
      } catch (err) {
        console.error(`[DiscordNotifier] Error editing original message ${activeMessageId}:`, err);
      }
    }

    // 2. Dispatch a log notice to the dedicated #out-of-stock-log channel
    const guildIds = this.db.getAllGuildIds();
    for (const guildId of guildIds) {
      try {
        const channels = this.db.getGuildChannels(guildId);
        const oosMapping = channels.find(c => c.channelKey === 'out-of-stock-log');
        if (!oosMapping) continue;

        const oosChannel = await this.client.channels.fetch(oosMapping.channelId).catch(() => null);
        if (!oosChannel || !(oosChannel instanceof TextChannel)) continue;

        const oosEmbed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle(`🔴 SOLD OUT: ${product.title}`)
          .setURL(product.url)
          .setDescription(`**${storeName}** has run out of stock for this item.`)
          .addFields(
            { name: 'Store & Location', value: `${storeName} (${product.locationName || 'Online'})`, inline: true },
            { name: 'Last Known Price', value: `$${product.price.toFixed(2)} ${product.currency}`, inline: true },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: 'Vancouver Pokémon Stock Tracker' })
          .setTimestamp();

        await oosChannel.send({ embeds: [oosEmbed] });
      } catch (err) {
        console.error(`[DiscordNotifier] Error sending OOS log in guild ${guildId}:`, err);
      }
    }
  }

  /**
   * Determines which channels this product should be sent to based on its properties
   */
  private determineTargetChannelKeys(product: ProductStockItem, storeChannelKey?: string): string[] {
    const keys = new Set<string>();

    // 1. Store specific channel
    if (storeChannelKey) {
      keys.add(storeChannelKey);
    }

    // 2. 30th Anniversary Channel
    if (product.is30thAnniversary) {
      keys.add('30th-anniversary');
    }

    // 3. High Priority Booster Bundles & ETBs Channel
    if (product.format === 'BOOSTER_BUNDLE' || product.format === 'ELITE_TRAINER_BOX' || product.isLatestBundle) {
      keys.add('booster-bundles-etbs');
    }

    // 4. Vancouver In-Store Channel
    if (product.locationName && !product.locationName.toLowerCase().includes('online')) {
      keys.add('vancouver-instore');
    }

    return Array.from(keys);
  }

  /**
   * Formats role mentions based on the product characteristics
   */
  private determineRoleMention(guild: any, product: ProductStockItem): string {
    const roles = guild.roles.cache;
    const mentions: string[] = [];

    if (product.is30thAnniversary) {
      const anniversaryRole = roles.find((r: any) => r.name === '30th Anniversary Alerts');
      if (anniversaryRole) mentions.push(`<@&${anniversaryRole.id}>`);
    }

    if (product.format === 'BOOSTER_BUNDLE' || product.format === 'ELITE_TRAINER_BOX') {
      const bundleRole = roles.find((r: any) => r.name === 'ETB & Bundles');
      if (bundleRole) mentions.push(`<@&${bundleRole.id}>`);
    }

    if (product.locationName && !product.locationName.toLowerCase().includes('online')) {
      const vancouverRole = roles.find((r: any) => r.name === 'Vancouver In-Store');
      if (vancouverRole) mentions.push(`<@&${vancouverRole.id}>`);
    }

    if (mentions.length === 0) {
      const generalRole = roles.find((r: any) => r.name === 'Pokemon Alerts');
      if (generalRole) mentions.push(`<@&${generalRole.id}>`);
    }

    return mentions.join(' ');
  }
}
