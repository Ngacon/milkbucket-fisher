import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';

export const questsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('View daily, weekly, and story quests.')
    .addStringOption((option) => option.setName('claim').setDescription('Quest id to claim').setRequired(false)),
  prefixAliases: ['quests', 'quest', 'nhiemvu'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const claimId = interaction.options.getString('claim');
    if (claimId) {
      await claimQuest(user.id, claimId);
      await interaction.reply(`Đã claim quest \`${claimId}\`.`);
      return;
    }
    await interaction.reply({ embeds: [await renderQuests()] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'claim' && args[1]) {
      await claimQuest(user.id, args[1]);
      await message.reply(`Đã claim quest \`${args[1]}\`.`);
      return;
    }
    await message.reply({ embeds: [await renderQuests()] });
  },
};

async function renderQuests(): Promise<EmbedBuilder> {
  const quests = await prisma.quest.findMany({ orderBy: { type: 'asc' } });
  return new EmbedBuilder()
    .setColor(colors.strawberry)
    .setTitle('📜 Quests')
    .setDescription(
      quests
        .map((quest) => `• **${quest.id}** [${quest.type}] requirement \`${JSON.stringify(quest.requirement)}\``)
        .join('\n'),
    );
}

async function claimQuest(userId: string, questId: string): Promise<void> {
  const userQuest = await prisma.userQuest.findUniqueOrThrow({
    where: { userId_questId: { userId, questId } },
    include: { quest: true },
  });
  if (!userQuest.completed || userQuest.claimed) throw new Error('QUEST_NOT_CLAIMABLE');
  const reward = userQuest.quest.reward as {
    coins?: number;
    pearls?: number;
    milkDrops?: number;
    title?: string;
  };
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: {
        coins: { increment: reward.coins ?? 0 },
        pearls: { increment: reward.pearls ?? 0 },
        milkDrops: { increment: reward.milkDrops ?? 0 },
        title: reward.title,
      },
    }),
    prisma.userQuest.update({
      where: { userId_questId: { userId, questId } },
      data: { claimed: true },
    }),
  ]);
}
