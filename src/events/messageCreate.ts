import type { Message } from 'discord.js';
import { env } from '../config/env';
import { commandsByAlias } from '../commands';
import { getCachedBannedUntil } from '../systems/users/userService';
import { humanizeError } from './interactionCreate';
import { logger } from '../utils/logger';

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;

  const loweredContent = message.content.toLowerCase();
  const prefix = env.PREFIXES.find((candidate) => loweredContent.startsWith(candidate.toLowerCase()));
  if (!prefix) return;

  const [rawName, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  if (!rawName) return;

  const command = commandsByAlias.get(rawName.toLowerCase());
  if (!command?.executePrefix) {
    await message.reply('Khong tim thay lenh. Dung `m!help` hoac `/help`.');
    return;
  }

  if (!command.skipBanCheck) {
    const bannedUntil = getCachedBannedUntil(message.author.id);
    if (bannedUntil) {
      await message.reply(`Ban dang bi khoa game toi ${bannedUntil.toLocaleString()}.`);
      return;
    }
  }

  try {
    await command.executePrefix(message, args);
  } catch (error) {
    logger.error({ err: error, command: rawName }, 'Prefix command failed');
    await message.reply(humanizeError(error));
  }
}
