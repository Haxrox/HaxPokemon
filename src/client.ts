import { 
  ActivityType, 
  Client, 
  Events, 
  GatewayIntentBits, 
  REST, 
  Routes 
} from 'discord.js';
import { checkCommand } from './commands/check.js';
import { setupCommand } from './commands/setup.js';
import { statusCommand } from './commands/status.js';
import { testAlertCommand } from './commands/testAlert.js';
import { BaseStoreMonitor } from './monitors/base.js';
import { StockDatabase } from './services/db.js';
import { DiscordNotifier } from './services/notifier.js';
import { StockManager } from './services/stockManager.js';

export function createDiscordClient(
  db: StockDatabase, 
  stockManager: StockManager, 
  monitors: BaseStoreMonitor[]
): { client: Client; notifier: DiscordNotifier } {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });

  const notifier = new DiscordNotifier(client, db);

  client.once(Events.ClientReady, async (c) => {
    console.log(`[DiscordBot] Logged in as ${c.user.tag}!`);

    c.user.setPresence({
      activities: [{ name: 'Vancouver Pokémon Stock 🍁 | /status', type: ActivityType.Watching }],
      status: 'online'
    });

    // Register Slash Commands
    await registerSlashCommands();
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
      if (commandName === 'setup') {
        await setupCommand.execute(interaction, db);
      } else if (commandName === 'status') {
        await statusCommand.execute(interaction, db, monitors);
      } else if (commandName === 'test-alert') {
        await testAlertCommand.execute(interaction, stockManager, notifier);
      } else if (commandName === 'check') {
        await checkCommand.execute(interaction, db);
      }
    } catch (err) {
      console.error(`[DiscordBot] Error executing command /${commandName}:`, err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred while executing this command.' }).catch(() => {});
      } else {
        await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true }).catch(() => {});
      }
    }
  });

  async function registerSlashCommands(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !clientId) {
      console.warn('[DiscordBot] DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID missing in .env - Slash commands skipped.');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(token);
    const commands = [
      setupCommand.data.toJSON(),
      statusCommand.data.toJSON(),
      testAlertCommand.data.toJSON(),
      checkCommand.data.toJSON()
    ];

    try {
      console.log(`[DiscordBot] Registering ${commands.length} application (/) commands...`);

      if (guildId) {
        // Fast instant registration for development server
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands }
        );
        console.log(`[DiscordBot] Successfully registered slash commands to test guild: ${guildId}`);
      } else {
        // Global registration across all servers
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands }
        );
        console.log('[DiscordBot] Successfully registered global slash commands.');
      }
    } catch (err) {
      console.error('[DiscordBot] Failed to register slash commands:', err);
    }
  }

  return { client, notifier };
}
