import type { Message } from 'discord.js';
import { env } from '../config/env';
import { commandsByAlias } from '../commands';
import { prisma } from '../database/prisma';
import { getBannedUntil, getOrCreateUser } from '../systems/users/userService';
import { humanizeError } from './interactionCreate';
import { logger } from '../utils/logger';

const recentMessages = new Map<string, { content: string; count: number; lastAt: number }>();
const toxicTerms = ['địt', 'dit me', 'dm ', 'dmm', 'fuck', 'shit'];

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;

  if (await maybeAutomod(message)) {
    return;
  }

  const loweredContent = message.content.toLowerCase();
  const prefix = env.PREFIXES.find((candidate) => loweredContent.startsWith(candidate.toLowerCase()));
  if (!prefix) return;

  const [rawName, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  if (!rawName) return;

  const command = commandsByAlias.get(rawName.toLowerCase());
  if (!command?.executePrefix) {
    await message.reply('Không tìm thấy lệnh. Dùng `m!help` hoặc `/help`.');
    return;
  }

  const bannedUntil = await getBannedUntil(message.author.id);
  if (bannedUntil && bannedUntil.getTime() > Date.now()) {
    await message.reply(`Bạn đang bị khóa game tới ${bannedUntil.toLocaleString()}.`);
    return;
  }

  try {
    await command.executePrefix(message, args);
  } catch (error) {
    logger.error({ err: error, command: rawName }, 'Prefix command failed');
    await message.reply(humanizeError(error));
  }
}

async function maybeAutomod(message: Message): Promise<boolean> {
  const content = message.content.toLowerCase();
  const key = message.author.id;
  const previous = recentMessages.get(key);
  const now = Date.now();
  const repeated = previous && previous.content === content && now - previous.lastAt < 15_000 ? previous.count + 1 : 1;
  recentMessages.set(key, { content, count: repeated, lastAt: now });

  const toxic = toxicTerms.some((term) => content.includes(term));
  const spam = repeated >= 5 || /(.)\1{12,}/.test(content);
  if (!toxic && !spam) return false;

  const user = await getOrCreateUser(message.author.id, message.author.username);
  await prisma.userMap.upsert({
    where: { userId_mapId: { userId: user.id, mapId: 'team_jail_pond' } },
    update: {},
    create: { userId: user.id, mapId: 'team_jail_pond' },
  });

  try {
    await message.member?.timeout(5 * 60 * 1000, 'Milkbucket automod: spam/toxic in game channel');
  } catch (error) {
    logger.warn({ err: error }, 'Failed to timeout user');
  }
  await message.reply('Milkbucket đã câu bạn vào timeout 5 phút. Jail Pond đã mở, nhưng cá ở đó không bán được.');
  return true;
}
