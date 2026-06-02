import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';
import { t } from '../../i18n';

export const profileCommand: Command = {
  data: new SlashCommandBuilder().setName('profile').setDescription('View your Milkbucket profile.'),
  prefixAliases: ['profile', 'me', 'menu'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    await interaction.reply({ embeds: [await renderProfile(user.id, interaction.user.username)] });
  },
  executePrefix: async (message) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    await message.reply({ embeds: [await renderProfile(user.id, message.author.username)] });
  },
};

async function renderProfile(userId: string, username: string): Promise<EmbedBuilder> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: true,
      rods: { where: { isEquipped: true }, include: { rod: true }, take: 1 },
      maps: true,
      fish: true,
      teamMemberships: { include: { team: true }, take: 1 },
    },
  });
  const profile = user.profile;
  if (!profile) {
    throw new Error('PROFILE_MISSING');
  }
  return new EmbedBuilder()
    .setColor(colors.milk)
    .setTitle(t(user.language, 'profile.title', { user: username }))
    .setDescription(
      t(user.language, 'profile.line', {
        level: profile.level,
        coins: formatCoins(profile.coins),
        pearls: formatCoins(profile.pearls),
        milkDrops: formatCoins(profile.milkDrops),
      }),
    )
    .addFields(
      { name: 'Title', value: profile.title, inline: true },
      { name: 'Rod', value: user.rods[0]?.rod.name ?? 'None', inline: true },
      { name: 'Maps', value: String(user.maps.length), inline: true },
      { name: 'Collection', value: `${user.fish.length}/200`, inline: true },
      { name: 'Team', value: user.teamMemberships[0]?.team.name ?? 'None', inline: true },
      { name: 'Hardcore', value: profile.hardcore ? 'ON' : 'OFF', inline: true },
    );
}
