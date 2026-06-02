import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';

export const hardcoreCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('hardcore')
    .setDescription('Toggle hardcore mode: fail loses 50%, catch rewards x2.')
    .addBooleanOption((option) => option.setName('enabled').setDescription('Enable hardcore').setRequired(true)),
  prefixAliases: ['hardcore'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const enabled = interaction.options.getBoolean('enabled', true);
    await prisma.profile.update({ where: { userId: user.id }, data: { hardcore: enabled } });
    await interaction.reply(enabled ? 'Hardcore ON: reward x2, fail mất 50% coins/pearls.' : 'Hardcore OFF.');
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    const enabled = ['on', 'true', 'bat', 'bật'].includes((args[0] ?? '').toLowerCase());
    await prisma.profile.update({ where: { userId: user.id }, data: { hardcore: enabled } });
    await message.reply(enabled ? 'Hardcore ON: reward x2, fail mất 50% coins/pearls.' : 'Hardcore OFF.');
  },
};
