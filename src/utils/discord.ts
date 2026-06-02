import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type Message,
  type MessageCreateOptions,
} from 'discord.js';
import { colors } from './colors';

export function milkEmbed(title: string, description?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.milk)
    .setTitle(title)
    .setDescription(description ?? null)
    .setFooter({ text: 'Milkbucket' })
    .setTimestamp();
}

export async function sendCommandReply(
  target: ChatInputCommandInteraction | Message,
  options: InteractionReplyOptions & MessageCreateOptions,
): Promise<Message> {
  if ('isChatInputCommand' in target) {
    if (target.deferred || target.replied) {
      const { ephemeral: _ephemeral, fetchReply: _fetchReply, ...editOptions } = options;
      return target.editReply(editOptions as InteractionEditReplyOptions);
    }

    const reply = await target.reply({ ...options, fetchReply: true });
    return reply;
  }
  return target.reply(options);
}

export function disabledButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('done_pull').setLabel('Kéo').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('done_hold').setLabel('Giữ').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('done_slack').setLabel('Thả dây').setStyle(ButtonStyle.Secondary).setDisabled(true),
  );
}
