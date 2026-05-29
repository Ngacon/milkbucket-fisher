import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';

export const codeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('code')
    .setDescription('Redeem a gift code.')
    .addStringOption((option) => option.setName('code').setDescription('Gift code').setRequired(true)),
  prefixAliases: ['code', 'giftcode'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const reward = await redeemCode(user.id, interaction.options.getString('code', true));
    await interaction.reply(`Nhận ${reward.coins} coins, ${reward.pearls} pearls, ${reward.milkDrops} milk drops.`);
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (!args[0]) {
      await message.reply('Cú pháp: `m!code MILK2026`');
      return;
    }
    const reward = await redeemCode(user.id, args[0]);
    await message.reply(`Nhận ${reward.coins} coins, ${reward.pearls} pearls, ${reward.milkDrops} milk drops.`);
  },
};

async function redeemCode(userId: string, rawCode: string): Promise<{ coins: number; pearls: number; milkDrops: number }> {
  const code = rawCode.toUpperCase();
  return prisma.$transaction(async (tx) => {
    const giftCode = await tx.giftCode.findUniqueOrThrow({ where: { code } });
    if (!giftCode.active || giftCode.claimedCount >= giftCode.maxClaims) {
      throw new Error('CODE_EXPIRED');
    }
    if (giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
      throw new Error('CODE_EXPIRED');
    }
    const used = await tx.userGiftCode.findUnique({ where: { userId_code: { userId, code } } });
    if (used) {
      throw new Error('CODE_USED');
    }
    await tx.profile.update({
      where: { userId },
      data: {
        coins: { increment: giftCode.coins },
        pearls: { increment: giftCode.pearls },
        milkDrops: { increment: giftCode.milkDrops },
      },
    });
    await tx.userGiftCode.create({ data: { userId, code } });
    await tx.giftCode.update({ where: { code }, data: { claimedCount: { increment: 1 } } });
    return {
      coins: giftCode.coins,
      pearls: giftCode.pearls,
      milkDrops: giftCode.milkDrops,
    };
  });
}
