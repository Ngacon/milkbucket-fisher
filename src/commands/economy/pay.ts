import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { transferCoins } from '../../systems/economy/marketService';
import { t } from '../../i18n';

export const payCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer coins with anti-inflation tax.')
    .addUserOption((option) => option.setName('user').setDescription('Receiver').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('amount').setDescription('Coin amount').setRequired(true).setMinValue(1),
    ),
  prefixAliases: ['pay', 'chuyentien'],
  execute: async (interaction) => {
    const sender = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const receiverDiscord = interaction.options.getUser('user', true);
    const receiver = await getOrCreateUser(receiverDiscord.id, receiverDiscord.username);
    const amount = interaction.options.getInteger('amount', true);
    const tax = await transferCoins(sender.id, receiver.id, amount);
    await interaction.reply(t(sender.language, 'economy.paid', { amount, user: receiverDiscord.username, tax }));
  },
  executePrefix: async (message, args) => {
    const mentioned = message.mentions.users.first();
    const amount = Number(args.find((arg) => /^\d+$/.test(arg)));
    if (!mentioned || !Number.isInteger(amount) || amount <= 0) {
      await message.reply('Cú pháp: `m!pay @user 1000`');
      return;
    }
    const sender = await getOrCreateUser(message.author.id, message.author.username);
    const receiver = await getOrCreateUser(mentioned.id, mentioned.username);
    const tax = await transferCoins(sender.id, receiver.id, amount);
    await message.reply(t(sender.language, 'economy.paid', { amount, user: mentioned.username, tax }));
  },
};
