import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const teamCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Create, join, or view fishing teams.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a team.')
        .addStringOption((option) => option.setName('name').setDescription('Team name').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Join a team by name.')
        .addStringOption((option) => option.setName('name').setDescription('Team name').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('info').setDescription('View your team.')),
  prefixAliases: ['team', 'guild'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'create') {
      await createTeam(user.id, interaction.options.getString('name', true));
      await interaction.reply('Team đã được tạo.');
      return;
    }
    if (subcommand === 'join') {
      await joinTeam(user.id, interaction.options.getString('name', true));
      await interaction.reply('Đã join team.');
      return;
    }
    await interaction.reply({ embeds: [await renderTeam(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'create' && args.slice(1).join(' ')) {
      await createTeam(user.id, args.slice(1).join(' '));
      await message.reply('Team đã được tạo.');
      return;
    }
    if (args[0] === 'join' && args.slice(1).join(' ')) {
      await joinTeam(user.id, args.slice(1).join(' '));
      await message.reply('Đã join team.');
      return;
    }
    await message.reply({ embeds: [await renderTeam(user.id)] });
  },
};

async function createTeam(userId: string, name: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.teamMember.findUnique({ where: { userId } });
    if (existing) throw new Error('ALREADY_IN_TEAM');
    const team = await tx.team.create({
      data: {
        name: name.slice(0, 32),
        leaderId: userId,
        members: [userId],
      },
    });
    await tx.teamMember.create({ data: { teamId: team.id, userId, role: 'Leader' } });
  });
}

async function joinTeam(userId: string, name: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.teamMember.findUnique({ where: { userId } });
    if (existing) throw new Error('ALREADY_IN_TEAM');
    const team = await tx.team.findUniqueOrThrow({ where: { name } });
    const count = await tx.teamMember.count({ where: { teamId: team.id } });
    if (count >= 20) throw new Error('TEAM_FULL');
    await tx.teamMember.create({ data: { teamId: team.id, userId } });
    await tx.team.update({ where: { id: team.id }, data: { members: { push: userId } } });
  });
}

async function renderTeam(userId: string): Promise<EmbedBuilder> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId },
    include: { team: { include: { teamMembers: true } } },
  });
  if (!membership) {
    return new EmbedBuilder().setColor(colors.cream).setTitle('Fishing Team').setDescription('Bạn chưa ở trong team nào.');
  }
  return new EmbedBuilder()
    .setColor(colors.mint)
    .setTitle(`🥛 ${membership.team.name}`)
    .setDescription(`Members ${membership.team.teamMembers.length}/20`)
    .addFields(
      { name: 'Weekly Score', value: formatCoins(membership.team.weeklyScore), inline: true },
      { name: 'Storage Coins', value: formatCoins(membership.team.storageCoins), inline: true },
      { name: 'Storage Pearls', value: formatCoins(membership.team.storagePearls), inline: true },
    );
}
