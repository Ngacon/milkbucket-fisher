import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const bagCommand: Command = {
  data: new SlashCommandBuilder().setName('bag').setDescription('View your unsold fish.'),
  prefixAliases: ['bag', 'tui', 'túi'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const embed = await renderBag(user.id);
    await interaction.reply({ embeds: [embed] });
  },
  executePrefix: async (message) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    await message.reply({ embeds: [await renderBag(user.id)] });
  },
};

async function renderBag(userId: string): Promise<EmbedBuilder> {
  const records = await prisma.catchRecord.findMany({
    where: { userId, sold: false },
    include: { fish: true },
    orderBy: { caughtAt: 'desc' },
    take: 15,
  });

  if (records.length === 0) {
    return new EmbedBuilder().setColor(colors.cream).setTitle('🎒 Túi cá').setDescription('Túi đang trống.');
  }

  const total = records.reduce((sum, record) => sum + record.value, 0);
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setTitle('🎒 Túi cá')
    .setDescription(
      records
        .map((record) => `• **${record.fish.name}** ${record.quality}★ ${record.size.toFixed(2)}kg - ${formatCoins(record.value)}`)
        .join('\n'),
    )
    .setFooter({ text: `Hiển thị 15 con mới nhất | Tổng tạm tính ${formatCoins(total)} coins` });
}
