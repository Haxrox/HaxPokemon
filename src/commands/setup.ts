import { 
  ChannelType, 
  ChatInputCommandInteraction, 
  MessageFlags,
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { StockDatabase } from '../services/db.js';

interface ChannelDef {
  key: string;
  name: string;
  topic: string;
}

interface CategoryDef {
  name: string;
  channels: ChannelDef[];
}

const SERVER_STRUCTURE: CategoryDef[] = [
  {
    name: '🍁 VANCOUVER & BC DROPS',
    channels: [
      { key: 'zephyr-epic', name: 'zephyr-epic', topic: 'Stock drops from Zephyr Epic (Surrey, BC)' },
      { key: 'vancouver-instore', name: 'vancouver-instore', topic: 'In-store stock pickup alerts for Greater Vancouver' },
      { key: 'bc-local-shops', name: 'bc-local-shops', topic: 'House of Cards, Pastime Sports, Magic Stronghold, and Canadian TCG shops' }
    ]
  },
  {
    name: '📦 ONLINE CANADIAN RETAIL',
    channels: [
      { key: 'pokemon-center-ca', name: 'pokemon-center-ca', topic: 'Official Pokémon Center Canada drops' },
      { key: 'gamestop-ca', name: 'gamestop-ca', topic: 'GameStop Canada online releases' },
      { key: 'bestbuy-ca', name: 'bestbuy-ca', topic: 'Best Buy Canada drops & MSRP inventory' },
      { key: 'walmart-ca', name: 'walmart-ca', topic: 'Walmart Canada verified MSRP stock' },
      { key: 'costco-toysrus', name: 'costco-toysrus', topic: 'Costco & Toys "R" Us Canada bundles' }
    ]
  },
  {
    name: '⚡ HIGH PRIORITY ALERTS',
    channels: [
      { key: '30th-anniversary', name: '30th-anniversary', topic: 'Pokémon 30th Anniversary UPCs, Booster Bundles & ETBs' },
      { key: 'booster-bundles-etbs', name: 'booster-bundles-etbs', topic: 'High-demand Booster Bundles and Elite Trainer Boxes' },
      { key: 'out-of-stock-log', name: 'out-of-stock-log', topic: 'Real-time logs when tracked items sell out' }
    ]
  },
  {
    name: '⚙️ BOT MANAGEMENT',
    channels: [
      { key: 'bot-status', name: 'bot-status', topic: 'Bot health, latency, and uptime logs' },
      { key: 'bot-commands', name: 'bot-commands', topic: 'Channel for testing and running slash commands' }
    ]
  }
];

const ROLES_TO_CREATE = [
  { name: 'Pokemon Alerts', color: 0x2ECC71, reason: 'General Pokemon stock alerts' },
  { name: '30th Anniversary Alerts', color: 0xF1C40F, reason: 'Exclusive 30th Anniversary drop alerts' },
  { name: 'Vancouver In-Store', color: 0x1ABC9C, reason: 'In-store Greater Vancouver stock notifications' },
  { name: 'ETB & Bundles', color: 0x9B59B6, reason: 'Booster Bundles and ETB alerts' }
];

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Automatically configures Pokémon stock tracking channels and alert roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction, db: StockDatabase) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ 
        content: '❌ This command must be run inside a Discord server.', 
        flags: MessageFlags.Ephemeral 
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const createdRoles: string[] = [];
      const createdChannels: string[] = [];
      let roleWarning = '';

      // 1. Create alert roles if bot has permission
      for (const roleDef of ROLES_TO_CREATE) {
        let existingRole = guild.roles.cache.find(r => r.name.toLowerCase() === roleDef.name.toLowerCase());
        if (!existingRole) {
          try {
            existingRole = await guild.roles.create({
              name: roleDef.name,
              color: roleDef.color,
              mentionable: true,
              reason: roleDef.reason
            });
            createdRoles.push(`@${roleDef.name}`);
          } catch (roleErr: any) {
            roleWarning = '\n⚠️ *(Note: Bot lacks "Manage Roles" permission to auto-create roles. Give the bot Manage Roles in Server Settings to enable auto role pinging).*';
          }
        } else {
          createdRoles.push(`@${roleDef.name}`);
        }
      }

      // 2. Create categories and channels
      for (const catDef of SERVER_STRUCTURE) {
        // Find or create category
        let category = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catDef.name.toLowerCase()
        );

        if (!category) {
          category = await guild.channels.create({
            name: catDef.name,
            type: ChannelType.GuildCategory
          });
        }

        for (const chanDef of catDef.channels) {
          let channel = guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && c.name.toLowerCase() === chanDef.name.toLowerCase()
          );

          if (!channel) {
            channel = await guild.channels.create({
              name: chanDef.name,
              type: ChannelType.GuildText,
              parent: category.id,
              topic: chanDef.topic
            });
            createdChannels.push(`#${chanDef.name}`);
          }

          // Register in database
          db.saveGuildChannel(guild.id, chanDef.key, channel.id, category.id);
        }
      }

      await interaction.editReply({
        content: `✅ **Setup Complete!**\n\n` +
          `📁 **Categories & Channels Configured:** ${SERVER_STRUCTURE.map(c => c.name).join(', ')}\n` +
          `👥 **Alert Roles:** ${createdRoles.length > 0 ? createdRoles.join(', ') : 'None created'}${roleWarning}\n\n` +
          `All stock monitors are mapped and ready to dispatch alerts to this server.`
      });
    } catch (err: any) {
      console.error('[setupCommand] Error setting up server:', err);
      await interaction.editReply({
        content: `❌ **Failed to complete setup:** ${err.message}`
      });
    }
  }
};
