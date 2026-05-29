import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';

const enchantPool = [
  { key: 'lucky_foam', text: '+4 Luck on Rainy weather' },
  { key: 'steady_grip', text: '+4 Power for Epic+ fish' },
  { key: 'quick_reel', text: '+4 Speed after perfect catch' },
  { key: 'pearl_sense', text: '+5% Pearl bonus on Rare+ fish' },
  { key: 'secret_bell', text: 'Tiny boost toward secret spots' },
];

export const rodCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('rod')
    .setDescription('Manage rod progression, enchant, and prestige.')
    .addSubcommand((subcommand) => subcommand.setName('status').setDescription('View equipped rod status.'))
    .addSubcommand((subcommand) => subcommand.setName('enchant').setDescription('Enchant equipped rod for 25 Pearls.'))
    .addSubcommand((subcommand) => subcommand.setName('prestige').setDescription('Prestige equipped max-level rod.')),
  prefixAliases: ['rod', 'rodlevel', 'can', 'cần'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'enchant') {
      await enchantRod(user.id);
      await interaction.reply('Đã enchant cần hiện tại.');
      return;
    }
    if (subcommand === 'prestige') {
      await prestigeRod(user.id);
      await interaction.reply('Prestige thành công. Cần reset level nhưng nhận permanent buff.');
      return;
    }
    await interaction.reply({ embeds: [await renderRod(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'enchant') {
      await enchantRod(user.id);
      await message.reply('Đã enchant cần hiện tại.');
      return;
    }
    if (args[0] === 'prestige') {
      await prestigeRod(user.id);
      await message.reply('Prestige thành công. Cần reset level nhưng nhận permanent buff.');
      return;
    }
    await message.reply({ embeds: [await renderRod(user.id)] });
  },
};

async function renderRod(userId: string): Promise<EmbedBuilder> {
  const rod = await prisma.userRod.findFirstOrThrow({
    where: { userId, isEquipped: true },
    include: { rod: true },
  });
  const enchantments = Array.isArray(rod.enchantments) ? rod.enchantments : [];
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setTitle(`🎣 ${rod.rod.name}`)
    .setDescription(`Level ${rod.level}/${rod.rod.maxLevel} | EXP ${rod.exp} | Prestige ${rod.prestigeCount}`)
    .addFields(
      { name: 'Stats', value: `Power ${rod.rod.power} | Luck ${rod.rod.luck} | Speed ${rod.rod.speed}` },
      { name: 'Ability', value: JSON.stringify(rod.rod.ability) },
      { name: 'Enchantments', value: enchantments.length ? enchantments.map((e) => `• ${JSON.stringify(e)}`).join('\n') : 'None' },
    );
}

async function enchantRod(userId: string): Promise<void> {
  const equipped = await prisma.userRod.findFirstOrThrow({ where: { userId, isEquipped: true } });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  const enchantments = Array.isArray(equipped.enchantments) ? equipped.enchantments : [];
  const maxEnchantments = 2 + Math.min(2, equipped.prestigeCount);
  if (enchantments.length >= maxEnchantments) throw new Error('ROD_ENCHANT_FULL');
  if (profile.pearls < 25) throw new Error('INSUFFICIENT_FUNDS');
  const enchantment = enchantPool[Math.floor(Math.random() * enchantPool.length)]!;
  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { pearls: { decrement: 25 } } }),
    prisma.userRod.update({
      where: { userId_rodId: { userId, rodId: equipped.rodId } },
      data: { enchantments: [...enchantments, enchantment] },
    }),
  ]);
}

async function prestigeRod(userId: string): Promise<void> {
  const equipped = await prisma.userRod.findFirstOrThrow({
    where: { userId, isEquipped: true },
    include: { rod: true },
  });
  if (equipped.level < equipped.rod.maxLevel) throw new Error('ROD_NOT_MAX');
  await prisma.userRod.update({
    where: { userId_rodId: { userId, rodId: equipped.rodId } },
    data: {
      level: 1,
      exp: 0,
      prestigeCount: { increment: 1 },
      enchantments: Array.isArray(equipped.enchantments) ? equipped.enchantments.slice(0, 1) : [],
    },
  });
}
