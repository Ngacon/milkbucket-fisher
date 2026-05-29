import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show social leaderboards.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('coins, fish, team')
        .setRequired(false)
        .addChoices(
          { name: 'coins', value: 'coins' },
          { name: 'fish', value: 'fish' },
          { name: 'team', value: 'team' },
        ),
    ),
  prefixAliases: ['leaderboard', 'top', 'bxh'],
  execute: async (interaction) => {
    await interaction.reply({ embeds: [await renderLeaderboard(interaction.options.getString('type') ?? 'coins')] });
  },
  executePrefix: async (message, args) => {
    await message.reply({ embeds: [await renderLeaderboard(args[0] ?? 'coins')] });
  },
};

async function renderLeaderboard(type: string): Promise<EmbedBuilder> {
  if (type === 'team') {
    const teams = await prisma.team.findMany({ orderBy: { weeklyScore: 'desc' }, take: 10 });
    return new EmbedBuilder()
      .setColor(colors.sky)
      .setTitle('🏆 Team Leaderboard')
      .setDescription(teams.map((team, index) => `#${index + 1} **${team.name}** - ${formatCoins(team.weeklyScore)}`).join('\n') || 'No teams yet.');
  }

  const profiles = await prisma.profile.findMany({
    orderBy: type === 'fish' ? { totalFishCaught: 'desc' } : { coins: 'desc' },
    include: { user: true },
    take: 10,
  });
  return new EmbedBuilder()
    .setColor(colors.sky)
    .setTitle(type === 'fish' ? '🐟 Fish Leaderboard' : '💰 Coin Leaderboard')
    .setDescription(
      profiles
        .map((profile, index) => {
          const value = type === 'fish' ? `${profile.totalFishCaught} fish` : `${formatCoins(profile.coins)} coins`;
          return `#${index + 1} **${profile.user.username}** - ${value}`;
        })
        .join('\n') || 'No players yet.',
    );
}
