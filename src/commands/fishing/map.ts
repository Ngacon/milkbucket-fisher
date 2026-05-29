import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const mapCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('View maps or unlock a map.')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List maps.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('unlock')
        .setDescription('Unlock a map.')
        .addStringOption((option) => option.setName('id').setDescription('Map id').setRequired(true)),
    ),
  prefixAliases: ['map', 'maps'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'unlock') {
      await unlockMap(user.id, interaction.options.getString('id', true));
      await interaction.reply('Đã mở map thành công.');
      return;
    }
    await interaction.reply({ embeds: [await renderMaps(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'unlock' && args[1]) {
      await unlockMap(user.id, args[1]);
      await message.reply('Đã mở map thành công.');
      return;
    }
    await message.reply({ embeds: [await renderMaps(user.id)] });
  },
};

async function renderMaps(userId: string): Promise<EmbedBuilder> {
  const [maps, owned] = await Promise.all([
    prisma.map.findMany({
      orderBy: [{ difficulty: 'asc' }],
      include: { weatherState: true },
    }),
    prisma.userMap.findMany({ where: { userId } }),
  ]);
  const ownedIds = new Set(owned.map((entry) => entry.mapId));
  return new EmbedBuilder()
    .setColor(colors.sky)
    .setTitle('🗺️ Milkbucket Maps')
    .setDescription(
      maps
        .map((map) => {
          const status = ownedIds.has(map.id) ? '✅' : `${formatCoins(map.price)} coins`;
          return `• \`${map.id}\` **${map.name}** | ${map.biome} | diff ${map.difficulty} | ${map.weatherState?.currentWeather ?? 'Sunny'} | ${status}`;
        })
        .join('\n')
        .slice(0, 4000),
    );
}

async function unlockMap(userId: string, mapId: string): Promise<void> {
  const map = await prisma.map.findUniqueOrThrow({ where: { id: mapId } });
  const existing = await prisma.userMap.findUnique({ where: { userId_mapId: { userId, mapId } } });
  if (existing) {
    throw new Error('MAP_ALREADY_UNLOCKED');
  }
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.coins < map.price) {
    throw new Error('INSUFFICIENT_FUNDS');
  }
  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { coins: { decrement: map.price } } }),
    prisma.userMap.upsert({
      where: { userId_mapId: { userId, mapId } },
      update: {},
      create: { userId, mapId },
    }),
  ]);
}
