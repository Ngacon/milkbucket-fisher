import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { buyPremiumTrack } from '../../systems/event/seasonService';
import { colors } from '../../utils/colors';

export const seasonCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('season')
    .setDescription('View season and battle pass progress.')
    .addSubcommand((subcommand) => subcommand.setName('view').setDescription('View current season.'))
    .addSubcommand((subcommand) => subcommand.setName('premium').setDescription('Unlock premium track for 250 Milk Drops.')),
  prefixAliases: ['season', 'battlepass'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    if (interaction.options.getSubcommand() === 'premium') {
      await buyPremiumTrack(user.id);
      await interaction.reply('Premium track đã mở.');
      return;
    }
    await interaction.reply({ embeds: [await renderSeason(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'premium') {
      await buyPremiumTrack(user.id);
      await message.reply('Premium track đã mở.');
      return;
    }
    await message.reply({ embeds: [await renderSeason(user.id)] });
  },
};

async function renderSeason(userId: string): Promise<EmbedBuilder> {
  const season = await prisma.season.findFirst({ where: { active: true } });
  if (!season) {
    return new EmbedBuilder().setColor(colors.cream).setTitle('Season').setDescription('Không có season active.');
  }
  const progress = await prisma.seasonProgress.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
  });
  const exp = progress?.exp ?? 0;
  const level = Math.floor(exp / 1000) + 1;
  return new EmbedBuilder()
    .setColor(colors.strawberry)
    .setTitle(`🎟️ ${season.name}`)
    .setDescription(`${season.theme}\nLevel ${level} | EXP ${exp}\nPremium: ${progress?.premium ? 'yes' : 'no'}`)
    .addFields({ name: 'Ends', value: `<t:${Math.floor(season.endDate.getTime() / 1000)}:R>` });
}
