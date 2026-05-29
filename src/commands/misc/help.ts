import {
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type Message,
} from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import {
  findCategoryByQuery,
  findCommandDetail,
  findHelpCategory,
  getCommandsForCategory,
  helpCategories,
  helpCommandDetails,
  type HelpCategory,
  type HelpCategoryId,
  type HelpCommandDetail,
} from './helpCatalog';

const milkIconUrl = 'https://cdn-icons-png.flaticon.com/512/590/590685.png';

type HelpViewState = {
  embed: EmbedBuilder;
  categoryId: HelpCategoryId;
  commandName?: string;
};

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show Milkbucket help.')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Command or category, e.g. fish, market, team')
        .setRequired(false),
  ),
  prefixAliases: ['help', 'trogiup'],
  execute: async (interaction) => {
    await getOrCreateUser(interaction.user.id, interaction.user.username);
    const query = interaction.options.getString('command');
    if (query) {
      const state = renderQuery(query);
      await interaction.reply({
        embeds: [state.embed],
        components: renderHelpComponents(interaction.user.id, state.categoryId, state.commandName),
      });
      const reply = await interaction.fetchReply();
      attachHelpCollector(reply, interaction.user.id);
      return;
    }

    await interaction.reply({
      embeds: [renderCategory(findHelpCategory('home'))],
      components: renderHelpComponents(interaction.user.id, 'home'),
    });
    const reply = await interaction.fetchReply();
    attachHelpCollector(reply, interaction.user.id);
  },
  executePrefix: async (message, args) => {
    await getOrCreateUser(message.author.id, message.author.username);
    const query = args.join(' ').trim();
    if (query) {
      const state = renderQuery(query);
      const reply = await message.reply({
        embeds: [state.embed],
        components: renderHelpComponents(message.author.id, state.categoryId, state.commandName),
      });
      attachHelpCollector(reply, message.author.id);
      return;
    }

    const reply = await message.reply({
      embeds: [renderCategory(findHelpCategory('home'))],
      components: renderHelpComponents(message.author.id, 'home'),
    });
    attachHelpCollector(reply, message.author.id);
  },
};

function renderQuery(query: string): HelpViewState {
  const command = findCommandDetail(query) ?? findCommandDetail(query.split(/\s+/)[0] ?? query);
  if (command) {
    return {
      embed: renderCommandDetail(command),
      categoryId: command.category,
      commandName: command.name,
    };
  }

  const category = findCategoryByQuery(query);
  if (category) {
    return {
      embed: renderCategory(category),
      categoryId: category.id,
    };
  }

  return {
    embed: renderNotFound(query),
    categoryId: 'home',
  };
}

function renderCategory(category: HelpCategory): EmbedBuilder {
  const categoryCommands = getCommandsForCategory(category.id)
    .map((command) => `\`${command.name}\``)
    .join(' ');

  const embed = new EmbedBuilder()
    .setColor(category.color)
    .setAuthor({ name: 'Milkbucket Help Center', iconURL: milkIconUrl })
    .setTitle(`${category.emoji} ${category.label}`)
    .setDescription(category.description)
    .addFields(category.fields)
    .setFooter({
      text:
        category.id === 'home'
          ? 'Mẹo: m!help fish hoặc /help command:fish để xem chi tiết một lệnh.'
          : 'Dùng menu bên dưới để đổi mục. Dùng m!help <lệnh> để xem chi tiết.',
    })
    .setTimestamp();

  if (categoryCommands) {
    embed.addFields({ name: 'Lệnh trong mục này', value: categoryCommands });
  }

  if (category.id === 'home') {
    embed.addFields({
      name: 'Bộ màu',
      value: 'Trắng sữa, kem, mint, dâu và trời pastel. Dịu mắt để mở help nhiều lần không bị mệt.',
    });
  }

  return embed;
}

function renderCommandDetail(command: HelpCommandDetail): EmbedBuilder {
  const category = findHelpCategory(command.category);
  return new EmbedBuilder()
    .setColor(category.color)
    .setAuthor({ name: `Milkbucket Command Detail - ${category.label}`, iconURL: milkIconUrl })
    .setTitle(`${category.emoji} ${command.name}`)
    .setDescription(command.summary)
    .addFields(
      {
        name: 'Cách dùng',
        value: command.usage.map((usage) => `\`${usage}\``).join('\n'),
      },
      {
        name: 'Ví dụ',
        value: command.examples.map((example) => `\`${example}\``).join('\n'),
        inline: true,
      },
      {
        name: 'Alias prefix',
        value: command.aliases.length ? command.aliases.map((alias) => `\`${alias}\``).join(', ') : '`không có`',
        inline: true,
      },
      {
        name: 'Ghi chú',
        value: command.notes.map((note) => `• ${note}`).join('\n'),
      },
      {
        name: 'Điều hướng nhanh',
        value: `\`m!help ${category.id}\` xem cả mục này\n\`m!help index\` mở danh sách toàn bộ lệnh`,
      },
    )
    .setFooter({ text: `Mục: ${category.label} | Quay lại bằng m!help ${category.id}` })
    .setTimestamp();
}

function renderNotFound(query: string): EmbedBuilder {
  const suggestions = helpCommandDetails
    .filter((command) => command.name.includes(query.toLowerCase()[0] ?? ''))
    .slice(0, 6)
    .map((command) => `\`${command.name}\``)
    .join(' ');

  return new EmbedBuilder()
    .setColor(0xffd166)
    .setTitle('Không tìm thấy mục help')
    .setDescription(`Không có lệnh hoặc mục tên \`${query}\`.`)
    .addFields(
      {
        name: 'Thử các mục này',
        value: '`fish` `market` `auction` `team` `rod` `craft` `season`',
      },
      {
        name: 'Một vài lệnh gần đó',
        value: suggestions || '`m!help index` để xem tất cả lệnh.',
      },
    );
}

function renderHelpComponents(
  userId: string,
  selectedCategory: HelpCategoryId,
  selectedCommand?: string,
): Array<ActionRowBuilder<StringSelectMenuBuilder>> {
  return [
    renderCategoryMenu(userId, selectedCategory),
    renderCommandMenu(userId, selectedCategory, selectedCommand),
  ];
}

function renderCategoryMenu(
  userId: string,
  selected: HelpCategoryId,
): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(helpCategoryCustomId(userId))
      .setPlaceholder('Chọn một mục help...')
      .addOptions(
        helpCategories.map((category) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(category.label)
            .setDescription(shortDescription(category.description))
            .setEmoji(category.emoji)
            .setValue(category.id)
            .setDefault(category.id === selected),
        ),
      ),
  );
}

function renderCommandMenu(
  userId: string,
  categoryId: HelpCategoryId,
  selectedCommand?: string,
): ActionRowBuilder<StringSelectMenuBuilder> {
  const commands = getCommandsForCategory(categoryId).slice(0, 25);
  const options = commands.length
    ? commands.map((command) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(command.name)
          .setDescription(shortDescription(command.summary))
          .setEmoji(commandEmoji(command.category))
          .setValue(command.name)
          .setDefault(command.name === selectedCommand),
      )
    : [
        new StringSelectMenuOptionBuilder()
          .setLabel('Chưa có lệnh trực tiếp')
          .setDescription('Chọn mục khác hoặc dùng m!help index.')
          .setEmoji('🥛')
          .setValue('__empty__'),
      ];

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(helpCommandCustomId(userId, categoryId))
      .setPlaceholder('Chọn lệnh để xem chi tiết...')
      .addOptions(options),
  );
}

function attachHelpCollector(message: Message, userId: string): void {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 180_000,
    filter: (interaction) =>
      (interaction.customId === helpCategoryCustomId(userId) ||
        interaction.customId.startsWith(helpCommandCustomIdPrefix(userId))),
  });

  collector.on('collect', (interaction) => {
    if (interaction.user.id !== userId) {
      void interaction
        .reply({
          content: 'Menu help này không phải của bạn. Gõ `m!help` để mở menu riêng nhé.',
          ephemeral: true,
        })
        .catch(() => undefined);
      return;
    }

    if (interaction.customId === helpCategoryCustomId(userId)) {
      const selected = (interaction.values[0] ?? 'home') as HelpCategoryId;
      const category = findHelpCategory(selected);
      void interaction.update({
        embeds: [renderCategory(category)],
        components: renderHelpComponents(userId, category.id),
      });
      return;
    }

    const selectedCommand = interaction.values[0] ?? 'help';
    const command = findCommandDetail(selectedCommand);
    if (!command) {
      void interaction.update({
        embeds: [renderNotFound(selectedCommand)],
        components: renderHelpComponents(userId, 'home'),
      });
      return;
    }

    void interaction.update({
      embeds: [renderCommandDetail(command)],
      components: renderHelpComponents(userId, command.category, command.name),
    });
  });

  collector.on('end', () => {
    void message.edit({ components: [renderExpiredMenu()] }).catch(() => undefined);
  });
}

function renderExpiredMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('milkbucket_help_expired')
      .setPlaceholder('Help menu đã hết hạn - gõ m!help để mở lại')
      .setDisabled(true)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Đã hết hạn')
          .setDescription('Gõ m!help để mở help center mới.')
          .setValue('expired'),
      ),
  );
}

function helpCategoryCustomId(userId: string): string {
  return `milkbucket_help_category:${userId}`;
}

function helpCommandCustomId(userId: string, categoryId: HelpCategoryId): string {
  return `${helpCommandCustomIdPrefix(userId)}:${categoryId}`;
}

function helpCommandCustomIdPrefix(userId: string): string {
  return `milkbucket_help_command:${userId}`;
}

function commandEmoji(categoryId: HelpCategoryId): string {
  return findHelpCategory(categoryId).emoji;
}

function shortDescription(value: string): string {
  return value.length > 92 ? `${value.slice(0, 89)}...` : value;
}
