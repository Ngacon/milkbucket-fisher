import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const shopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View or buy rods.')
    .addSubcommand((subcommand) => subcommand.setName('rods').setDescription('List rods.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('buyrod')
        .setDescription('Buy a rod.')
        .addStringOption((option) => option.setName('id').setDescription('Rod id').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('equip')
        .setDescription('Equip a rod you own.')
        .addStringOption((option) => option.setName('id').setDescription('Rod id').setRequired(true)),
    ),
  prefixAliases: ['shop', 'cuahang'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'buyrod') {
      await buyRod(user.id, interaction.options.getString('id', true));
      await interaction.reply('Đã mua cần.');
      return;
    }
    if (subcommand === 'equip') {
      await equipRod(user.id, interaction.options.getString('id', true));
      await interaction.reply('Đã trang bị cần.');
      return;
    }
    await interaction.reply({ embeds: [await renderRods(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'buy' && args[1]) {
      await buyRod(user.id, args[1]);
      await message.reply('Đã mua cần.');
      return;
    }
    if (args[0] === 'equip' && args[1]) {
      await equipRod(user.id, args[1]);
      await message.reply('Đã trang bị cần.');
      return;
    }
    await message.reply({ embeds: [await renderRods(user.id)] });
  },
};

async function renderRods(userId: string): Promise<EmbedBuilder> {
  const [rods, owned] = await Promise.all([
    prisma.rod.findMany({ orderBy: { price: 'asc' } }),
    prisma.userRod.findMany({ where: { userId } }),
  ]);
  const ownedIds = new Set(owned.map((entry) => entry.rodId));
  const equipped = owned.find((entry) => entry.isEquipped)?.rodId;
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setTitle('🎣 Rod Shop')
    .setDescription(
      rods
        .map((rod) => {
          const tag = equipped === rod.id ? 'EQUIPPED' : ownedIds.has(rod.id) ? 'OWNED' : `${formatCoins(rod.price)} coins`;
          return `• \`${rod.id}\` **${rod.name}** P${rod.power}/L${rod.luck}/S${rod.speed} | ${tag}`;
        })
        .join('\n')
        .slice(0, 4000),
    );
}

async function buyRod(userId: string, rodId: string): Promise<void> {
  const rod = await prisma.rod.findUniqueOrThrow({ where: { id: rodId } });
  const existing = await prisma.userRod.findUnique({ where: { userId_rodId: { userId, rodId } } });
  if (existing) {
    throw new Error('ROD_ALREADY_OWNED');
  }
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.coins < rod.price) {
    throw new Error('INSUFFICIENT_FUNDS');
  }
  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { coins: { decrement: rod.price } } }),
    prisma.userRod.upsert({
      where: { userId_rodId: { userId, rodId } },
      update: {},
      create: { userId, rodId },
    }),
  ]);
}

async function equipRod(userId: string, rodId: string): Promise<void> {
  const owned = await prisma.userRod.findUnique({ where: { userId_rodId: { userId, rodId } } });
  if (!owned) {
    throw new Error('ROD_LOCKED');
  }
  await prisma.$transaction([
    prisma.userRod.updateMany({ where: { userId }, data: { isEquipped: false } }),
    prisma.userRod.update({ where: { userId_rodId: { userId, rodId } }, data: { isEquipped: true } }),
    prisma.profile.update({ where: { userId }, data: { currentRodId: rodId } }),
  ]);
}
