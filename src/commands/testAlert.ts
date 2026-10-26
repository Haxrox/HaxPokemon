import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { DiscordNotifier } from '../services/notifier.js';
import { StockManager } from '../services/stockManager.js';
import { ProductStockItem } from '../types/index.js';

export const testAlertCommand = {
  data: new SlashCommandBuilder()
    .setName('test-alert')
    .setDescription('Dispatches a test stock alert to verify Discord permissions and formatting')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of alert to simulate')
        .setRequired(true)
        .addChoices(
          { name: '🔥 Latest Booster Bundle In-Stock', value: 'latest_bundle' },
          { name: '🎉 30th Anniversary Drop', value: '30th_anniversary' },
          { name: '🔴 Out-of-Stock / Sold Out Transition', value: 'sold_out' }
        )
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    stockManager: StockManager,
    notifier: DiscordNotifier
  ) {
    const alertType = interaction.options.getString('type', true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let testItem: ProductStockItem;

    if (alertType === '30th_anniversary') {
      testItem = {
        sku: 'test-30th-anniversary-upc',
        storeId: 'zephyr-epic',
        title: 'Pokémon 30th Anniversary Ultra-Premium Collection Box (Exclusive)',
        url: 'https://zephyrepic.com/product-category/pokemon/',
        imageUrl: 'https://images.pokemontcg.io/logo-30th.png',
        price: 159.99,
        currency: 'CAD',
        inStock: true,
        locationName: 'Zephyr Epic (Surrey Flagship & Online)',
        sellerName: 'Zephyr Epic',
        isOfficialSeller: true,
        lastChecked: new Date().toISOString()
      };
      await stockManager.processProductUpdates([testItem]);
      await interaction.editReply({ content: '✅ Test **30th Anniversary** alert dispatched!' });
    } else if (alertType === 'latest_bundle') {
      testItem = {
        sku: 'test-prismatic-bundle',
        storeId: 'bestbuy-ca',
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
      };
      await stockManager.processProductUpdates([testItem]);
      await interaction.editReply({ content: '✅ Test **Latest Booster Bundle** in-stock alert dispatched!' });
    } else if (alertType === 'sold_out') {
      // First ensure it exists in stock
      const initialItem: ProductStockItem = {
        sku: 'test-sold-out-demo',
        storeId: 'pokemoncenter-ca',
        title: 'Pokémon TCG: Scarlet & Violet - 151 Booster Bundle (Demo Sold Out)',
        url: 'https://www.pokemoncenter.com/en-ca/product/151-bundle',
        price: 39.99,
        currency: 'CAD',
        inStock: true,
        locationName: 'Pokémon Center Canada (Official Drops)',
        sellerName: 'Pokémon Center',
        isOfficialSeller: true,
        lastChecked: new Date().toISOString()
      };
      await stockManager.processProductUpdates([initialItem]);

      // Then transition it to sold out
      const soldOutItem: ProductStockItem = {
        ...initialItem,
        inStock: false,
        lastChecked: new Date().toISOString()
      };
      await stockManager.processProductUpdates([soldOutItem]);

      await interaction.editReply({
        content: '✅ Test **Sold Out Transition** triggered! Check the updated embed and #out-of-stock-log.'
      });
    }
  }
};
