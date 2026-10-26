import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { BaseStoreMonitor } from '../monitors/base.js';
import { StockDatabase } from '../services/db.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Displays bot health, store monitor statuses, and tracked product stats'),

  async execute(
    interaction: ChatInputCommandInteraction, 
    db: StockDatabase, 
    monitors: BaseStoreMonitor[]
  ) {
    const stats = db.getStats();
    const client = interaction.client;

    const monitorStatuses = monitors.map(m => {
      const h = m.getHealth();
      const statusEmoji = h.status === 'ONLINE' ? '🟢' : '🔴';
      return `${statusEmoji} **${h.storeName}**: ${h.totalProductsChecked} items checked (${h.itemsInStock} in stock)`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📊 Vancouver Pokémon Stock Bot Status')
      .addFields(
        { name: '🤖 Bot Latency', value: `${client.ws.ping}ms`, inline: true },
        { name: '⏱️ Uptime', value: `<t:${Math.floor((Date.now() - (client.uptime || 0)) / 1000)}:R>`, inline: true },
        { name: '🌐 Configured Servers', value: `${stats.trackedGuilds}`, inline: true },
        { name: '📦 Tracked Products in DB', value: `${stats.totalProducts}`, inline: true },
        { name: '🟢 Current In-Stock Items', value: `${stats.inStockProducts}`, inline: true },
        { name: '🔔 Active Embed Alerts', value: `${stats.activeAlerts}`, inline: true },
        { 
          name: '🏪 Active Store Monitors', 
          value: monitorStatuses.length > 0 ? monitorStatuses.slice(0, 10).join('\n') : 'No monitors active' 
        }
      )
      .setFooter({ text: 'HaxPokemon Stock Monitor' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
