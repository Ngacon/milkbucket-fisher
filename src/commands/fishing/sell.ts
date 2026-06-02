import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { sellInventory } from '../../systems/fishing/fishingService';
import { t } from '../../i18n';

export const sellCommand: Command = {
  data: new SlashCommandBuilder().setName('sell').setDescription('Sell all unsold fish at current market prices.'),
  prefixAliases: ['sell', 'ban', 'bán', 'banca'],
  execute: async (interaction) => {
    await interaction.reply('Đang bán cá...');
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const result = await sellInventory(user.id);
    await interaction.editReply(result.count === 0 ? t(user.language, 'economy.emptyBag') : t(user.language, 'economy.sold', result));
  },
  executePrefix: async (message) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    const result = await sellInventory(user.id);
    await message.reply(result.count === 0 ? t(user.language, 'economy.emptyBag') : t(user.language, 'economy.sold', result));
  },
};
