import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { checkCommand } from '../src/commands/check.js';
import { setupCommand } from '../src/commands/setup.js';
import { statusCommand } from '../src/commands/status.js';
import { testAlertCommand } from '../src/commands/testAlert.js';

async function deploy() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  console.log('====================================================');
  console.log('⚡ Deploying Pokémon Stock Bot Slash Commands');
  console.log('====================================================');

  if (!token || token === 'your_bot_token_here') {
    console.error('❌ Error: DISCORD_BOT_TOKEN is missing or not set in .env');
    process.exit(1);
  }

  if (!clientId || clientId === 'your_client_id_here') {
    console.error('❌ Error: DISCORD_CLIENT_ID is missing or not set in .env');
    process.exit(1);
  }

  const commands = [
    setupCommand.data.toJSON(),
    statusCommand.data.toJSON(),
    testAlertCommand.data.toJSON(),
    checkCommand.data.toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    if (guildId) {
      console.log(`📡 Registering ${commands.length} commands to Guild ID: ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`✅ Successfully deployed slash commands to guild: ${guildId}`);
    } else {
      console.log(`🌍 Registering ${commands.length} global application commands...`);
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('✅ Successfully deployed global slash commands (may take up to 1 hour to propagate globally).');
    }
  } catch (err: any) {
    console.error('❌ Failed to deploy slash commands:', err);
    process.exit(1);
  }
}

deploy();
