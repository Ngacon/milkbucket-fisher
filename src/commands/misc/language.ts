import { SlashCommandBuilder } from 'discord.js';
import type { Language } from '@prisma/client';
import type { Command } from '../../types/command';
import { getOrCreateUser, setLanguage } from '../../systems/users/userService';
import { t } from '../../i18n';

export const languageCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Change bot language.')
    .addStringOption((option) =>
      option
        .setName('language')
        .setDescription('Language')
        .setRequired(true)
        .addChoices({ name: 'Tiếng Việt', value: 'vi' }, { name: 'English', value: 'en' }),
    ),
  prefixAliases: ['language', 'lang', 'ngonngu'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const language = interaction.options.getString('language', true) as Language;
    await setLanguage(user, language);
    await interaction.reply(t(language, 'language.changed'));
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    const language = args[0] === 'en' ? 'en' : 'vi';
    await setLanguage(user, language);
    await message.reply(t(language, 'language.changed'));
  },
};
