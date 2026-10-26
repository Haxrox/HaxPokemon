import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { TRACKED_STORES } from '../config/stores.js';
import { StockDatabase } from '../services/db.js';

export const checkCommand = {
  data: new SlashCommandBuilder()
    .setName('check')
    .setDescription('Check current stock and price for a Pokémon card set or bundle')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Keyword to search (e.g., "prismatic", "bundle", "151", "30th")')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('max_price')
        .setDescription('Maximum price ceiling in CAD (Default: $500 to filter out scalpers/glitches)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('sort')
        .setDescription('Sort results by price or availability (Default: Price Min to Max)')
        .setRequired(false)
        .addChoices(
          { name: '💰 Price: Low to High (Min to Max)', value: 'price_asc' },
          { name: '🟢 In Stock First', value: 'in_stock' },
          { name: '💎 Price: High to Low', value: 'price_desc' }
        )
    )
    .addStringOption(option =>
      option.setName('store')
        .setDescription('Optionally filter by store')
        .setRequired(false)
        .addChoices(
          ...TRACKED_STORES.slice(0, 25).map(s => ({ name: s.name.substring(0, 30), value: s.id }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, db: StockDatabase) {
    const query = interaction.options.getString('query', true).toLowerCase();
    const storeFilter = interaction.options.getString('store');
    const maxPrice = interaction.options.getNumber('max_price') ?? 500;
    const sortChoice = interaction.options.getString('sort') || 'price_asc';

    // Query SQLite database for matching products within price ceiling
    const internalDb = (db as any).db;
    let sql = `
      SELECT * FROM products 
      WHERE (lower(title) LIKE ? OR lower(set_name) LIKE ? OR lower(format) LIKE ?)
        AND price > 0 
        AND price <= ?
    `;
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`, maxPrice];

    if (storeFilter) {
      sql += ' AND store_id = ?';
      params.push(storeFilter);
    }

    if (sortChoice === 'price_asc') {
      sql += ' ORDER BY in_stock DESC, price ASC LIMIT 10';
    } else if (sortChoice === 'price_desc') {
      sql += ' ORDER BY in_stock DESC, price DESC LIMIT 10';
    } else {
      sql += ' ORDER BY in_stock DESC, last_checked DESC LIMIT 10';
    }

    const rows = internalDb.prepare(sql).all(...params) as any[];

    if (rows.length === 0) {
      await interaction.reply({
        content: `🔍 No products found matching "**${query}**" under **$${maxPrice} CAD**${storeFilter ? ` at ${storeFilter}` : ''}.`,
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`🔍 Stock Search Results for "${query}" (Under $${maxPrice} CAD)`)
      .setDescription(`Found **${rows.length}** item(s) sorted by price (Min to Max):`)
      .setFooter({ text: 'HaxPokemon Verified MSRP Inventory' })
      .setTimestamp();

    for (const r of rows) {
      const statusEmoji = r.in_stock ? '🟢 In Stock' : '🔴 Out of Stock';
      const storeName = TRACKED_STORES.find(s => s.id === r.store_id)?.name || r.store_id;
      const location = r.location_name ? ` (${r.location_name})` : '';
      
      // Clean up URL formatting (prevent double /en/en/ in Walmart links)
      let cleanUrl = (r.url || '').replace('/en/en/', '/en/');

      embed.addFields({
        name: `${statusEmoji} | ${r.title.substring(0, 60)}`,
        value: `💰 **$${r.price.toFixed(2)} ${r.currency}** | 🏪 **${storeName}**${location}\n🔗 [View Product Page](${cleanUrl})`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
