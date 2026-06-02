import { SlashCommandBuilder, EmbedBuilder, type MessageCreateOptions } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser, invalidateUserCache, isAdmin, rememberBan } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

type SendableChannel = {
  send: (options: MessageCreateOptions) => Promise<unknown>;
};

export const adminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Milkbucket admin tools.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('giovang')
        .setDescription('Start Golden Hour.')
        .addIntegerOption((option) => option.setName('minutes').setDescription('Duration').setRequired(true).setMinValue(1).setMaxValue(180))
        .addNumberOption((option) => option.setName('multiplier').setDescription('Value multiplier').setRequired(true).setMinValue(1).setMaxValue(3)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('taocode')
        .setDescription('Create gift code.')
        .addStringOption((option) => option.setName('code').setDescription('Code').setRequired(true))
        .addIntegerOption((option) => option.setName('coins').setDescription('Coins').setRequired(false).setMinValue(0))
        .addIntegerOption((option) => option.setName('pearls').setDescription('Pearls').setRequired(false).setMinValue(0))
        .addIntegerOption((option) => option.setName('milkdrops').setDescription('Milk Drops').setRequired(false).setMinValue(0))
        .addIntegerOption((option) => option.setName('claims').setDescription('Max claims').setRequired(false).setMinValue(1)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('congtien')
        .setDescription('Add coins.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true))
        .addIntegerOption((option) => option.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('trutien')
        .setDescription('Remove coins.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true))
        .addIntegerOption((option) => option.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setlevel')
        .setDescription('Set player level.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true))
        .addIntegerOption((option) => option.setName('level').setDescription('Level').setRequired(true).setMinValue(1).setMaxValue(200)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setrod')
        .setDescription('Give and equip a rod.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true))
        .addStringOption((option) => option.setName('rod').setDescription('Rod id').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('thongbao')
        .setDescription('Send safe announcement in current channel.')
        .addStringOption((option) => option.setName('message').setDescription('Announcement').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ban')
        .setDescription('Soft-ban player from game commands.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true))
        .addIntegerOption((option) => option.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(10080)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('unban')
        .setDescription('Unban player.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Reset a player account.')
        .addUserOption((option) => option.setName('user').setDescription('Target').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('wipe')
        .setDescription('Danger: wipe player economy data.')
        .addStringOption((option) => option.setName('confirm').setDescription('MILKBUCKET_WIPE').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('backup').setDescription('Show backup-ready stats.'))
    .addSubcommand((subcommand) => subcommand.setName('restore').setDescription('Show restore instructions.')),
  prefixAliases: ['admin'],
  execute: async (interaction) => {
    if (!(await isAdmin(interaction.user.id))) {
      await interaction.reply({ content: 'Admin only.', ephemeral: true });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'giovang') {
      const minutes = interaction.options.getInteger('minutes', true);
      const multiplier = interaction.options.getNumber('multiplier', true);
      await startGoldenHour(minutes, multiplier);
      await interaction.reply(`Giờ vàng ${minutes} phút x${multiplier}.`);
      return;
    }
    if (subcommand === 'taocode') {
      const code = await createGiftCode(
        interaction.options.getString('code', true),
        interaction.options.getInteger('coins') ?? 0,
        interaction.options.getInteger('pearls') ?? 0,
        interaction.options.getInteger('milkdrops') ?? 0,
        interaction.options.getInteger('claims') ?? 1,
      );
      await interaction.reply(`Code \`${code.code}\` đã sẵn sàng.`);
      return;
    }
    if (subcommand === 'backup') {
      await interaction.reply({ embeds: [await renderStats()] });
      return;
    }
    if (subcommand === 'restore') {
      await interaction.reply('Restore thật nên chạy ở hạ tầng DB: `pg_restore` hoặc managed backup của Railway/Render/VPS. Bot không nhận file DB qua Discord để tránh rủi ro.');
      return;
    }
    if (subcommand === 'wipe') {
      const confirm = interaction.options.getString('confirm', true);
      if (confirm !== 'MILKBUCKET_WIPE') {
        await interaction.reply({ content: 'Confirm sai. Không wipe.', ephemeral: true });
        return;
      }
      await wipePlayers();
      await interaction.reply('Đã wipe player economy/game data.');
      return;
    }
    if (subcommand === 'thongbao') {
      const message = interaction.options.getString('message', true);
      const sent = await sendAnnouncement(interaction.channel, message);
      await interaction.reply({
        content: sent ? 'Đã gửi thông báo an toàn.' : 'Channel này không gửi được thông báo.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const targetUser = await getOrCreateUser(target.id, target.username);
    if (subcommand === 'congtien') {
      const amount = interaction.options.getInteger('amount', true);
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { coins: { increment: amount } } });
      await interaction.reply(`Đã cộng ${formatCoins(amount)} coins.`);
      return;
    }
    if (subcommand === 'trutien') {
      const amount = interaction.options.getInteger('amount', true);
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { coins: { decrement: amount } } });
      await interaction.reply(`Đã trừ ${formatCoins(amount)} coins.`);
      return;
    }
    if (subcommand === 'setlevel') {
      const level = interaction.options.getInteger('level', true);
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { level, exp: 0 } });
      await interaction.reply(`Đã set level ${level}.`);
      return;
    }
    if (subcommand === 'setrod') {
      const rodId = interaction.options.getString('rod', true);
      await prisma.$transaction([
        prisma.userRod.updateMany({ where: { userId: targetUser.id }, data: { isEquipped: false } }),
        prisma.userRod.upsert({
          where: { userId_rodId: { userId: targetUser.id, rodId } },
          update: { isEquipped: true },
          create: { userId: targetUser.id, rodId, isEquipped: true },
        }),
        prisma.profile.update({ where: { userId: targetUser.id }, data: { currentRodId: rodId } }),
      ]);
      await interaction.reply(`Đã set rod ${rodId}.`);
      return;
    }
    if (subcommand === 'ban') {
      const minutes = interaction.options.getInteger('minutes', true);
      const bannedUntil = new Date(Date.now() + minutes * 60 * 1000);
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { bannedUntil },
      });
      rememberBan(target.id, bannedUntil);
      await interaction.reply(`Đã ban ${target.username} ${minutes} phút.`);
      return;
    }
    if (subcommand === 'unban') {
      await prisma.user.update({ where: { id: targetUser.id }, data: { bannedUntil: null } });
      rememberBan(target.id, null);
      invalidateUserCache(target.id);
      await interaction.reply(`Đã unban ${target.username}.`);
      return;
    }
    if (subcommand === 'reset') {
      await prisma.user.delete({ where: { id: targetUser.id } });
      rememberBan(target.id, null);
      invalidateUserCache(target.id);
      await interaction.reply(`Đã reset ${target.username}.`);
    }
  },
  executePrefix: async (message, args) => {
    if (!(await isAdmin(message.author.id))) {
      await message.reply('Admin only.');
      return;
    }
    const subcommand = args[0];
    if (subcommand === 'backup') {
      await message.reply({ embeds: [await renderStats()] });
      return;
    }
    if (subcommand === 'restore') {
      await message.reply('Restore thật nên chạy bằng `pg_restore` hoặc managed backup của hosting.');
      return;
    }
    if (subcommand === 'giovang') {
      await startGoldenHour(Number(args[1] ?? 30), Number(args[2] ?? 2));
      await message.reply('Đã bật giờ vàng.');
      return;
    }
    if (subcommand === 'taocode' && args[1]) {
      await createGiftCode(args[1], Number(args[2] ?? 0), Number(args[3] ?? 0), Number(args[4] ?? 0), Number(args[5] ?? 1));
      await message.reply('Đã tạo code.');
      return;
    }
    if (subcommand === 'thongbao') {
      const sent = await sendAnnouncement(message.channel, args.slice(1).join(' '));
      if (!sent) await message.reply('Channel này không gửi được thông báo.');
      return;
    }
    if (subcommand === 'wipe') {
      if (args[1] !== 'MILKBUCKET_WIPE') {
        await message.reply('Confirm sai. Không wipe.');
        return;
      }
      await wipePlayers();
      await message.reply('Đã wipe player economy/game data.');
      return;
    }

    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Cần mention user cho lệnh này.');
      return;
    }
    const targetUser = await getOrCreateUser(target.id, target.username);
    const amount = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 0);
    if (subcommand === 'congtien') {
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { coins: { increment: amount } } });
      await message.reply('Đã cộng tiền.');
      return;
    }
    if (subcommand === 'trutien') {
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { coins: { decrement: amount } } });
      await message.reply('Đã trừ tiền.');
      return;
    }
    if (subcommand === 'setlevel') {
      await prisma.profile.update({ where: { userId: targetUser.id }, data: { level: Math.max(1, amount), exp: 0 } });
      await message.reply('Đã set level.');
      return;
    }
    if (subcommand === 'setrod' && args[2]) {
      const rodId = args[2];
      await prisma.$transaction([
        prisma.userRod.updateMany({ where: { userId: targetUser.id }, data: { isEquipped: false } }),
        prisma.userRod.upsert({
          where: { userId_rodId: { userId: targetUser.id, rodId } },
          update: { isEquipped: true },
          create: { userId: targetUser.id, rodId, isEquipped: true },
        }),
        prisma.profile.update({ where: { userId: targetUser.id }, data: { currentRodId: rodId } }),
      ]);
      await message.reply('Đã set rod.');
      return;
    }
    if (subcommand === 'reset') {
      await prisma.user.delete({ where: { id: targetUser.id } });
      rememberBan(target.id, null);
      invalidateUserCache(target.id);
      await message.reply('Đã reset user.');
    }
  },
};

function canSend(channel: unknown): channel is SendableChannel {
  return Boolean(channel && typeof (channel as { send?: unknown }).send === 'function');
}

async function sendAnnouncement(channel: unknown, description: string): Promise<boolean> {
  if (!canSend(channel)) return false;
  await channel.send({
    embeds: [{ title: '📢 Milkbucket', description, color: colors.cream }],
    allowedMentions: { parse: [] },
  });
  return true;
}

async function startGoldenHour(minutes: number, multiplier: number): Promise<void> {
  await prisma.config.upsert({
    where: { key: 'event.current' },
    update: {
      value: {
        type: 'golden_hour',
        multiplier,
        endsAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
      },
    },
    create: {
      key: 'event.current',
      value: {
        type: 'golden_hour',
        multiplier,
        endsAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
      },
    },
  });
}

async function wipePlayers(): Promise<void> {
  await prisma.$transaction([
    prisma.bossParticipation.deleteMany(),
    prisma.worldBoss.deleteMany(),
    prisma.marketplaceListing.deleteMany(),
    prisma.auction.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function createGiftCode(code: string, coins: number, pearls: number, milkDrops: number, claims: number) {
  return prisma.giftCode.upsert({
    where: { code: code.toUpperCase() },
    update: { coins, pearls, milkDrops, maxClaims: claims, active: true },
    create: { code: code.toUpperCase(), coins, pearls, milkDrops, maxClaims: claims },
  });
}

async function renderStats(): Promise<EmbedBuilder> {
  const [users, catches, listings, teams] = await Promise.all([
    prisma.user.count(),
    prisma.catchRecord.count(),
    prisma.marketplaceListing.count({ where: { sold: false } }),
    prisma.team.count(),
  ]);
  return new EmbedBuilder()
    .setColor(colors.warning)
    .setTitle('Milkbucket Backup Stats')
    .setDescription('Use PostgreSQL managed backups or `pg_dump` for real restore points.')
    .addFields(
      { name: 'Users', value: String(users), inline: true },
      { name: 'Catches', value: String(catches), inline: true },
      { name: 'Active listings', value: String(listings), inline: true },
      { name: 'Teams', value: String(teams), inline: true },
    );
}
