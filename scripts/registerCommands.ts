import { REST, Routes } from 'discord.js';
import { env } from '../src/config/env';
import { commands } from '../src/commands';

async function main(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const body = commands.map((command) => command.data.toJSON());
  const route = env.DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  await rest.put(route, { body });
  console.log(`Registered ${body.length} slash commands.`);
}

void main();
