import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { Message } from 'discord.js';

export type SlashData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type Command = {
  data: SlashData;
  prefixAliases: string[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  executePrefix?: (message: Message, args: string[]) => Promise<void>;
};
